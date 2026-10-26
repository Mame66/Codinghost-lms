import { useRef, useState } from 'react';
import api from '../../api/axios';
import { buildPlan, resolveSpecials } from '../../utils/courseImport';
import { parseQuizFile } from '../../utils/quiz';
import { formatSize, uploadLessonFile, errMsg, guessMime, KINDS, fileKind } from '../../utils/files';

// ── Lecture des sources ───────────────────────────────────
const fromFileList = (files) => Array.from(files).map(f => ({
    path: f.webkitRelativePath || f.name, size: f.size, getFile: async () => f,
}));

const fromZip = async (zipFiles) => {
    const { default: JSZip } = await import('jszip');
    const out = [];
    for (const zf of zipFiles) {
        const zip = await JSZip.loadAsync(zf);
        zip.forEach((relPath, entry) => {
            if (entry.dir) return;
            const name = relPath.split('/').pop();
            out.push({
                path: relPath,
                size: entry._data?.uncompressedSize ?? 0,
                getFile: async () => new File([await entry.async('blob')], name, { type: guessMime(name) }),
            });
        });
    }
    return out;
};

// Dossier glissé-déposé : parcours récursif
const readEntry = (entry, prefix = '') => new Promise((resolve) => {
    if (entry.isFile) {
        entry.file(f => resolve([{ path: prefix + f.name, size: f.size, getFile: async () => f }]), () => resolve([]));
    } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const all = [];
        const next = () => reader.readEntries(async (batch) => {
            if (!batch.length) {
                const nested = await Promise.all(all.map(e => readEntry(e, `${prefix}${entry.name}/`)));
                resolve(nested.flat());
            } else { all.push(...batch); next(); }
        }, () => resolve([]));
        next();
    } else resolve([]);
});

// Exécute des tâches avec N en parallèle
const pool = async (tasks, n, fn) => {
    let i = 0;
    const worker = async () => { while (i < tasks.length) { const t = tasks[i++]; await fn(t); } };
    await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
};

export default function CourseImportModal({ audience, courses = [], targetCourse, onClose, onDone, notify }) {
    const [step, setStep] = useState('source');
    const [reading, setReading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [drag, setDrag] = useState(false);
    const [dest, setDest] = useState(targetCourse ? 'existing' : 'new');
    const [courseId, setCourseId] = useState(targetCourse?.id || '');
    const [titre, setTitre] = useState('');
    const [progress, setProgress] = useState({ done: 0, total: 1, label: '' });
    const [report, setReport] = useState(null);
    const folderRef = useRef(null);
    const zipRef = useRef(null);

    const sameAudience = courses.filter(c => !audience || c.audience === audience);

    const load = async (getEntries, fallbackTitle) => {
        setReading(true);
        try {
            const entries = await getEntries();
            const p = buildPlan(entries, fallbackTitle);
            if (!p.modules.length) {
                notify?.(p.skipped.length ? 'Tous les fichiers dépassent 50 Mo' : 'Aucun fichier trouvé dans ce dossier', 'error');
            } else {
                setPlan(p); setTitre(p.titre); setStep('preview');
            }
        } catch (e) { notify?.('Lecture impossible : ' + errMsg(e), 'error'); }
        setReading(false);
    };

    const onDrop = async (e) => {
        e.preventDefault(); setDrag(false);
        const items = Array.from(e.dataTransfer.items || []);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length && files.every(f => /\.zip$/i.test(f.name))) {
            return load(() => fromZip(files), files[0].name.replace(/(-\d{8}T\d+Z?-\d+-\d+)?\.zip$/i, ''));
        }
        const entries = items.map(i => i.webkitGetAsEntry?.()).filter(Boolean);
        if (entries.length) return load(async () => (await Promise.all(entries.map(en => readEntry(en)))).flat());
        if (files.length) return load(async () => fromFileList(files));
    };

    // ── édition du plan ──
    const setModule = (mi, fn) => setPlan(p => ({ ...p, modules: p.modules.map((m, i) => i === mi ? fn(m) : m) }));
    const setLesson = (mi, li, fn) => setModule(mi, m => ({ ...m, lessons: m.lessons.map((l, i) => i === li ? fn(l) : l) }));
    const setFile = (mi, li, fi, fn) => setLesson(mi, li, l => ({ ...l, files: l.files.map((f, i) => i === fi ? fn(f) : f) }));

    const stats = (() => {
        if (!plan) return null;
        const lessons = plan.modules.flatMap(m => m.lessons);
        const files = lessons.flatMap(l => l.files).filter(f => f.include);
        return {
            modules: plan.modules.length, lessons: lessons.length, files: files.length,
            bytes: files.reduce((a, f) => a + (f.size || 0), 0),
            teacher: files.filter(f => f.visibility === 'TEACHER').length,
            quiz: lessons.filter(l => l.specials.some(s => s.kind === 'quiz')).length,
            homework: lessons.filter(l => l.specials.some(s => s.kind === 'homework')).length,
        };
    })();

    // ── import ──
    const runImport = async () => {
        if (dest === 'new' && !titre.trim()) return notify?.('Donnez un titre au cours', 'error');
        if (dest === 'existing' && !courseId) return notify?.('Choisissez le cours', 'error');
        setStep('importing');
        const errors = [];
        const counts = { modules: 0, lessons: 0, files: 0, links: 0, questions: 0 };
        const totalBytes = Math.max(1, stats.bytes);
        let doneBytes = 0;
        const tick = (label) => setProgress(p => ({ ...p, label }));
        setProgress({ done: 0, total: totalBytes, label: 'Création du cours…' });

        let cid = courseId;
        try {
            if (dest === 'new') {
                const { data } = await api.post('/courses', { titre: titre.trim(), audience });
                cid = data.id;
            }
            const uploads = [];
            const linkJobs = [];   // ajoutés après les fichiers (ordre plus naturel)
            for (const mod of plan.modules) {
                tick(`Module « ${mod.titre} »`);
                const { data: m } = await api.post(`/lessons/courses/${cid}/modules`, { titre: mod.titre.trim() || 'Module' });
                counts.modules++;
                for (const les of mod.lessons) {
                    tick(`Leçon « ${les.titre} »`);
                    const sp = await resolveSpecials(les, parseQuizFile);
                    errors.push(...sp.quizErrors);
                    const { data: l } = await api.post(`/lessons/modules/${m.id}/lessons`, {
                        titre: les.titre.trim() || 'Leçon',
                        objectives: sp.objectives || '',
                        ...(sp.homework ? { homeworkEnabled: true, homeworkInstructions: sp.homework } : {}),
                    });
                    counts.lessons++;
                    if (sp.quiz.length) {
                        try {
                            await api.post(`/lessons/lessons/${l.id}/quiz/bulk`, { questions: sp.quiz });
                            counts.questions += sp.quiz.length;
                        } catch (e) { errors.push(`Quiz de « ${les.titre} » : ${errMsg(e)}`); }
                    }
                    les.files.filter(f => f.include).forEach(f => uploads.push({ lessonId: l.id, f }));
                    if (sp.links.length) linkJobs.push({ lessonId: l.id, links: sp.links });
                }
            }
            await pool(uploads, 3, async ({ lessonId, f }) => {
                let last = 0;
                tick(f.inner);
                try {
                    const raw = await f.getFile();
                    const file = raw.name === f.inner.split('/').pop() ? raw : new File([raw], f.inner.split('/').pop(), { type: raw.type });
                    await uploadLessonFile(lessonId, file, { visibility: f.visibility, titre: f.titre }, (p) => {
                        const now = p * (f.size || 0);
                        doneBytes += now - last; last = now;
                        setProgress(pr => ({ ...pr, done: doneBytes }));
                    });
                    counts.files++;
                } catch (e) { errors.push(`${f.path} : ${errMsg(e)}`); }
                doneBytes += (f.size || 0) - last;
                setProgress(pr => ({ ...pr, done: doneBytes }));
            });
            for (const job of linkJobs) {
                for (const link of job.links) {
                    try {
                        await api.post(`/content/lessons/${job.lessonId}/resources`, { kind: 'LINK', url: link.url, titre: link.titre, visibility: link.teacher ? 'TEACHER' : 'STUDENT' });
                        counts.links++;
                    } catch (e) { errors.push(`Lien ${link.url} : ${errMsg(e)}`); }
                }
            }
        } catch (e) {
            errors.unshift(`Import interrompu : ${errMsg(e)}`);
        }
        setReport({ counts, errors, courseId: cid, skipped: plan.skipped });
        setStep('done');
    };

    const close = () => { if (step !== 'importing') onClose(); };

    return (
        <div style={st.overlay} onClick={close}>
            <div style={st.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                {/* ───────── SOURCE ───────── */}
                {step === 'source' && (
                    <>
                        <h2 style={st.h2}>{targetCourse ? `Importer dans « ${targetCourse.titre} »` : 'Importer un cours'}</h2>
                        <p style={st.p}>Choisissez le dossier du cours : les sous-dossiers deviennent des modules et des leçons, les fichiers sont ajoutés aux leçons. Vous pourrez tout vérifier avant l'import.</p>

                        <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
                             style={{ border: `2px dashed ${drag ? '#6C47FF' : '#D4CCFF'}`, background: drag ? '#F1EDFF' : '#FAF9FF', borderRadius: 16, padding: 16, transition: 'all .15s' }}>
                            <div className="ch-stack-sm" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                                <button type="button" style={st.srcBtn} disabled={reading} onClick={() => folderRef.current?.click()}>
                                    <span style={{ fontSize: 30 }}>📁</span>
                                    <span style={{ fontWeight: 800, color: '#1A1040', fontSize: 15 }}>Dossier de l'ordinateur</span>
                                    <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>Y compris un dossier Google Drive synchronisé sur le PC</span>
                                </button>
                                <button type="button" style={st.srcBtn} disabled={reading} onClick={() => zipRef.current?.click()}>
                                    <span style={{ fontSize: 30 }}>🗜️</span>
                                    <span style={{ fontWeight: 800, color: '#1A1040', fontSize: 15 }}>Fichier ZIP</span>
                                    <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>Dans Google Drive : clic droit sur le dossier → Télécharger</span>
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>… ou glissez le dossier / le ZIP ici</div>
                            <input ref={folderRef} type="file" hidden multiple webkitdirectory="" directory=""
                                   onChange={e => { const fl = e.target.files; if (fl?.length) load(async () => fromFileList(fl)); e.target.value = ''; }} />
                            <input ref={zipRef} type="file" hidden multiple accept=".zip,application/zip"
                                   onChange={e => { const fl = Array.from(e.target.files || []); if (fl.length) load(() => fromZip(fl), fl[0].name.replace(/(-\d{8}T\d+Z?-\d+-\d+)?\.zip$/i, '')); e.target.value = ''; }} />
                        </div>
                        {reading && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, color: '#6C47FF', fontWeight: 700, fontSize: 13 }}><div style={st.spin} /> Lecture des fichiers…</div>}

                        <details style={{ marginTop: 16 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#6C47FF' }}>Comment organiser le dossier ?</summary>
                            <pre style={st.tree}>{`Scratch débutant/              → le cours
  01 - Les bases/              → un module
    Séance 1 - Découverte/     → une leçon
      Support élève.pdf        → visible par les élèves
      Guide prof.pptx          → réservé au prof
      quiz.xlsx                → le quiz de la leçon
      liens.txt                → liens Drive / YouTube
      devoir.txt               → devoir à rendre (consignes)
    Séance 2 - Boucles/
      …`}</pre>
                            <ul style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.7, margin: '8px 0 0 18px' }}>
                                <li>Tout est facultatif : mettez seulement ce dont la leçon a besoin.</li>
                                <li>Un nom contenant <b>prof</b>, <b>guide</b>, <b>enseignant</b>, <b>corrigé</b> ou <b>solution</b> (fichier ou sous-dossier) est réservé au prof.</li>
                                <li>Sans dossier de module, chaque dossier devient une leçon.</li>
                                <li><b>quiz.xlsx</b> : colonnes Question, A, B, C, D, Bonne réponse. <b>liens.txt</b> : une ligne « Titre | https://… » (préfixe [prof] pour réserver).</li>
                                <li>Les numéros devant les noms (« 01 - ») servent à l'ordre et sont retirés du titre.</li>
                                <li>Fichiers de plus de 50 Mo : mettez-les sur Drive et ajoutez le lien dans liens.txt.</li>
                            </ul>
                        </details>
                        <div style={st.foot}><button type="button" style={st.ghost} onClick={onClose}>Fermer</button></div>
                    </>
                )}

                {/* ───────── APERÇU ───────── */}
                {step === 'preview' && plan && (
                    <>
                        <h2 style={st.h2}>Vérifier avant l'import</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                            <span style={st.chip}>{stats.modules} module{stats.modules > 1 ? 's' : ''}</span>
                            <span style={st.chip}>{stats.lessons} leçon{stats.lessons > 1 ? 's' : ''}</span>
                            <span style={st.chip}>{stats.files} fichier{stats.files > 1 ? 's' : ''} · {formatSize(stats.bytes)}</span>
                            {stats.teacher > 0 && <span style={{ ...st.chip, background: '#F0F9FF', color: '#0369A1' }}>🔒 {stats.teacher} réservé{stats.teacher > 1 ? 's' : ''} au prof</span>}
                            {stats.quiz > 0 && <span style={{ ...st.chip, background: '#FFFBEB', color: '#B45309' }}>{stats.quiz} quiz</span>}
                            {stats.homework > 0 && <span style={{ ...st.chip, background: '#FEF2F2', color: '#B91C1C' }}>{stats.homework} devoir{stats.homework > 1 ? 's' : ''}</span>}
                        </div>

                        {!targetCourse && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                {[['new', 'Nouveau cours'], ['existing', 'Ajouter à un cours existant']].map(([v, l]) => (
                                    <button key={v} type="button" onClick={() => setDest(v)} disabled={v === 'existing' && !sameAudience.length}
                                            style={{ ...st.seg, borderColor: dest === v ? '#6C47FF' : '#E5E7EB', background: dest === v ? '#F5F2FF' : '#fff', color: dest === v ? '#6C47FF' : '#6B7280' }}>{l}</button>
                                ))}
                            </div>
                        )}
                        {dest === 'new'
                            ? <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre du cours" style={{ ...st.input, fontWeight: 800, fontSize: 15 }} />
                            : !targetCourse && (
                                <select value={courseId} onChange={e => setCourseId(e.target.value)} style={st.input}>
                                    <option value="">— Choisir le cours —</option>
                                    {sameAudience.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                                </select>
                            )}
                        {dest === 'existing' && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Les modules seront ajoutés à la suite de ceux du cours.</div>}

                        <div style={{ marginTop: 14, maxHeight: '46vh', overflowY: 'auto', border: '1px solid #F1F0F7', borderRadius: 14, padding: 10, background: '#FCFCFF' }}>
                            {plan.modules.map((m, mi) => (
                                <div key={mi} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={st.num}>{mi + 1}</span>
                                        <input value={m.titre} onChange={e => setModule(mi, x => ({ ...x, titre: e.target.value }))} style={st.inline} aria-label="Titre du module" />
                                    </div>
                                    {m.lessons.map((l, li) => (
                                        <div key={li} style={{ margin: '6px 0 0 30px', padding: '8px 10px', background: '#fff', borderRadius: 10, border: '1px solid #EEECF7' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 12 }}>📘</span>
                                                <input value={l.titre} onChange={e => setLesson(mi, li, x => ({ ...x, titre: e.target.value }))} style={{ ...st.inline, fontSize: 13 }} aria-label="Titre de la leçon" />
                                                {l.specials.map((s, si) => (
                                                    <span key={si} title={s.inner} style={{ ...st.tag, ...SPECIAL[s.kind].style }}>{SPECIAL[s.kind].label}</span>
                                                ))}
                                            </div>
                                            {l.files.map((f, fi) => {
                                                const k = KINDS[fileKind(f.inner)] || KINDS.other;
                                                return (
                                                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 0 18px', opacity: f.include ? 1 : 0.45 }}>
                                                        <input type="checkbox" checked={f.include} onChange={e => setFile(mi, li, fi, x => ({ ...x, include: e.target.checked }))} aria-label={`Inclure ${f.inner}`} />
                                                        <span style={{ fontSize: 13 }}>{k.emoji}</span>
                                                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.inner}>{f.inner}</span>
                                                        <span className="ch-hide-sm" style={{ fontSize: 11, color: '#9CA3AF' }}>{formatSize(f.size)}</span>
                                                        <button type="button" onClick={() => setFile(mi, li, fi, x => ({ ...x, visibility: x.visibility === 'TEACHER' ? 'STUDENT' : 'TEACHER' }))}
                                                                style={{ ...st.vis, ...(f.visibility === 'TEACHER' ? { background: '#F0F9FF', color: '#0369A1', borderColor: '#BAE6FD' } : {}) }}>
                                                            {f.visibility === 'TEACHER' ? '🔒 Prof' : '👁 Élèves'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {plan.skipped.length > 0 && (
                            <details style={{ marginTop: 10, fontSize: 12, color: '#92400E' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{plan.skipped.length} fichier{plan.skipped.length > 1 ? 's' : ''} ignoré{plan.skipped.length > 1 ? 's' : ''}</summary>
                                <ul style={{ margin: '6px 0 0 18px', lineHeight: 1.6 }}>{plan.skipped.map((s, i) => <li key={i}>{s.path} — {s.reason}</li>)}</ul>
                            </details>
                        )}
                        <div style={st.foot}>
                            <button type="button" style={st.ghost} onClick={() => { setPlan(null); setStep('source'); }}>← Autre dossier</button>
                            <button type="button" style={st.primary} onClick={runImport}>Importer {stats.files} fichier{stats.files > 1 ? 's' : ''}</button>
                        </div>
                    </>
                )}

                {/* ───────── IMPORT ───────── */}
                {step === 'importing' && (
                    <div style={{ padding: '20px 0' }}>
                        <h2 style={st.h2}>Import en cours…</h2>
                        <p style={st.p}>Gardez cette fenêtre ouverte jusqu'à la fin.</p>
                        <div style={{ height: 10, background: '#EDE8FF', borderRadius: 50, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.round(progress.done / progress.total * 100))}%`, height: '100%', background: 'linear-gradient(90deg,#6C47FF,#9B7FFF)', transition: 'width .3s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6B7280', gap: 10 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{progress.label}</span>
                            <span style={{ fontWeight: 800, color: '#6C47FF' }}>{Math.min(100, Math.round(progress.done / progress.total * 100))}%</span>
                        </div>
                    </div>
                )}

                {/* ───────── TERMINÉ ───────── */}
                {step === 'done' && report && (
                    <>
                        <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
                            <div style={{ fontSize: 44 }}>{report.errors.length ? '⚠️' : '🎉'}</div>
                            <h2 style={{ ...st.h2, marginTop: 6 }}>{report.errors.length ? 'Import terminé avec des erreurs' : 'Cours importé !'}</h2>
                            <p style={st.p}>
                                {report.counts.modules} module{report.counts.modules > 1 ? 's' : ''}, {report.counts.lessons} leçon{report.counts.lessons > 1 ? 's' : ''}, {report.counts.files} fichier{report.counts.files > 1 ? 's' : ''}
                                {report.counts.links ? `, ${report.counts.links} lien${report.counts.links > 1 ? 's' : ''}` : ''}
                                {report.counts.questions ? `, ${report.counts.questions} question${report.counts.questions > 1 ? 's' : ''} de quiz` : ''}.
                            </p>
                        </div>
                        {report.errors.length > 0 && (
                            <div style={{ maxHeight: 200, overflowY: 'auto', background: '#FEF2F2', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
                                {report.errors.map((e, i) => <div key={i}>• {e}</div>)}
                            </div>
                        )}
                        <div style={st.foot}>
                            <button type="button" style={st.ghost} onClick={() => onDone?.(report.courseId, false)}>Fermer</button>
                            {report.courseId && <button type="button" style={st.primary} onClick={() => onDone?.(report.courseId, true)}>Ouvrir le cours →</button>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const SPECIAL = {
    quiz:       { label: '❓ quiz',      style: { background: '#FFFBEB', color: '#B45309' } },
    links:      { label: '🔗 liens',     style: { background: '#E0F2FE', color: '#0369A1' } },
    shortcut:   { label: '🔗 raccourci', style: { background: '#E0F2FE', color: '#0369A1' } },
    homework:   { label: '📥 devoir',    style: { background: '#FEF2F2', color: '#B91C1C' } },
    objectives: { label: '🎯 objectifs', style: { background: '#EDE9FE', color: '#6D28D9' } },
};

const st = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,5,40,0.5)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 720, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', boxSizing: 'border-box' },
    h2: { fontSize: 20, fontWeight: 800, color: '#1A1040', margin: '0 0 6px' },
    p: { fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 },
    srcBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px 14px', borderRadius: 14, border: '1.5px solid #E5E0FF', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
    tree: { background: '#0F172A', color: '#E2E8F0', fontSize: 12, lineHeight: 1.6, padding: 14, borderRadius: 12, overflowX: 'auto', margin: '10px 0 0' },
    chip: { fontSize: 12, fontWeight: 800, color: '#6C47FF', background: '#F0EEFF', padding: '4px 10px', borderRadius: 50 },
    seg: { flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 10, border: '2px solid', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' },
    input: { padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff' },
    inline: { flex: 1, minWidth: 120, padding: '5px 8px', border: '1.5px solid transparent', borderRadius: 7, fontSize: 14, fontWeight: 800, color: '#1A1040', fontFamily: 'inherit', background: 'transparent', outline: 'none' },
    num: { width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg,#6C47FF,#9B7FFF)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    tag: { fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 },
    vis: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 50, border: '1.5px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
    foot: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' },
    ghost: { padding: '10px 16px', background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 10, color: '#6C47FF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primary: { padding: '10px 18px', background: 'linear-gradient(135deg,#6C47FF,#5035CC)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' },
    spin: { width: 16, height: 16, border: '2px solid #EDE8FF', borderTop: '2px solid #6C47FF', borderRadius: '50%', animation: 'chspin 0.8s linear infinite' },
};
