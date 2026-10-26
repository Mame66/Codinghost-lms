import { useEffect, useMemo, useState } from 'react';
import '../styles/course.css';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import GradeModal, { StatusPill, fmtDate, isLate } from '../components/course/GradeModal';
import { formatSize, errMsg, openSigned } from '../utils/files';
import { AudienceBadge } from '../utils/audience';

// ════════════════════════════════════════════════════════════
// Correction des devoirs rendus sur les leçons
// ════════════════════════════════════════════════════════════
export default function Homeworks() {
    const { user } = useAuth();
    const canGrade = ['ADMIN', 'TEACHER'].includes(user?.role);
    const [subs, setSubs] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('RENDU');
    const [groupId, setGroupId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [search, setSearch] = useState('');
    const [grading, setGrading] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const load = async () => {
        try {
            const [sRes, gRes] = await Promise.all([api.get('/content/submissions'), api.get('/groups')]);
            setSubs(sRes.data); setGroups(gRes.data);
        } catch (e) { notify(errMsg(e), 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const courses = useMemo(() => {
        const m = new Map();
        subs.forEach(s => m.set(s.chapter.course.id, s.chapter.course));
        return [...m.values()].sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
    }, [subs]);

    const filtered = subs.filter(s => {
        if (groupId && !s.student.enrollments.some(e => e.groupId === parseInt(groupId))) return false;
        if (courseId && s.chapter.course.id !== parseInt(courseId)) return false;
        const q = search.trim().toLowerCase();
        if (q && !`${s.student.user.prenom} ${s.student.user.nom} ${s.chapter.titre} ${s.chapter.course.titre}`.toLowerCase().includes(q)) return false;
        return true;
    });
    const pending = filtered.filter(s => s.statut === 'RENDU');
    const done = filtered.filter(s => s.statut === 'CORRIGE');
    const list = tab === 'RENDU' ? pending : tab === 'CORRIGE' ? done : filtered;
    const graded = done.filter(s => s.note != null);
    const avg = graded.length ? (graded.reduce((a, s) => a + s.note, 0) / graded.length).toFixed(1) : '—';

    // regroupement par leçon
    const byLesson = useMemo(() => {
        const m = new Map();
        list.forEach(s => {
            if (!m.has(s.chapter.id)) m.set(s.chapter.id, { chapter: s.chapter, items: [] });
            m.get(s.chapter.id).items.push(s);
        });
        return [...m.values()];
    }, [list]);

    const download = async (s) => {
        try { await openSigned(`/content/submissions/${s.id}/url`); } catch (e) { notify(errMsg(e), 'error'); }
    };

    return (
        <div>
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 20px', borderRadius: 12, background: '#1A1040', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: toast.type === 'error' ? '#F87171' : '#34D399' }} />{toast.msg}
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1040', margin: 0 }}>Correction des devoirs</h1>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                    {user?.role === 'ADMIN' ? 'Tous les devoirs rendus sur les leçons' : 'Devoirs des élèves de vos groupes'}
                </div>
            </div>

            <div className="ch-stack-sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
                {[
                    { label: 'À corriger', value: pending.length, color: '#B45309', bg: '#FFFBEB' },
                    { label: 'Corrigés', value: done.length, color: '#047857', bg: '#ECFDF5' },
                    { label: 'Moyenne', value: avg === '—' ? avg : `${avg}/20`, color: '#6C47FF', bg: '#F5F2FF' },
                ].map(c => (
                    <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3 }}>
                    {[['RENDU', `À corriger (${pending.length})`], ['CORRIGE', `Corrigés (${done.length})`], ['ALL', 'Tous']].map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 12px', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: tab === k ? '#fff' : 'transparent', color: tab === k ? '#1A1040' : '#6B7280', boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>
                    ))}
                </div>
                <select value={groupId} onChange={e => setGroupId(e.target.value)} style={sel}>
                    <option value="">Tous les groupes</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
                <select value={courseId} onChange={e => setCourseId(e.target.value)} style={sel}>
                    <option value="">Tous les cours</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                </select>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève, une leçon…" style={{ ...sel, flex: 1, minWidth: 180 }} />
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
            ) : byLesson.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #EBEBF5', borderRadius: 16, padding: '50px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 40 }}>{tab === 'RENDU' ? '🎉' : '📭'}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1040', marginTop: 8 }}>{tab === 'RENDU' ? 'Rien à corriger' : 'Aucun devoir'}</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Les devoirs apparaissent ici quand une leçon a un « devoir à rendre » activé et qu'un élève dépose son travail.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {byLesson.map(({ chapter, items }) => (
                        <div key={chapter.id} style={{ background: '#fff', border: '1px solid #EBEBF5', borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#FAFAFF', borderBottom: '1px solid #F1F0F7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>{chapter.course.titre}{chapter.module ? ` › ${chapter.module.titre}` : ''}</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1040' }}>{chapter.titre}</div>
                                </div>
                                <AudienceBadge audience={chapter.course.audience} />
                                {chapter.homeworkDueDate && <span style={{ fontSize: 12, color: '#6B7280' }}>Date limite : {fmtDate(chapter.homeworkDueDate, false)}</span>}
                            </div>
                            {items.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F7F7FB', flexWrap: 'wrap' }}>
                                    <Avatar user={s.student.user} size={34} />
                                    <div style={{ flex: 1, minWidth: 160 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1040' }}>{s.student.user.prenom} {s.student.user.nom}</div>
                                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                            {s.student.enrollments.map(e => e.group.titre).join(', ')} · rendu le {fmtDate(s.submittedAt)}
                                            {isLate(s, chapter.homeworkDueDate) && <span style={{ color: '#B45309', fontWeight: 700 }}> · en retard</span>}
                                        </div>
                                    </div>
                                    {s.fileName && (
                                        <button type="button" onClick={() => download(s)} style={fileBtn} title="Télécharger">
                                            📎 <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fileName}</span>
                                            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{formatSize(s.size)}</span>
                                        </button>
                                    )}
                                    {s.lienRendu && <a href={s.lienRendu} target="_blank" rel="noreferrer" style={{ ...fileBtn, textDecoration: 'none' }}>🔗 Lien</a>}
                                    <StatusPill submission={s} dueDate={chapter.homeworkDueDate} />
                                    {canGrade && (
                                        <button type="button" style={btn} onClick={() => setGrading(s)}>{s.statut === 'CORRIGE' ? 'Modifier' : 'Corriger'}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {grading && (
                <GradeModal
                    submission={grading}
                    studentName={`${grading.student.user.prenom} ${grading.student.user.nom}`}
                    lessonTitle={`${grading.chapter.course.titre} › ${grading.chapter.titre}`}
                    dueDate={grading.chapter.homeworkDueDate}
                    notify={notify}
                    onClose={() => setGrading(null)}
                    onSaved={() => { setGrading(null); load(); }}
                />
            )}
        </div>
    );
}

const sel = { padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#374151', outline: 'none' };
const fileBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #EDE8FF', background: '#FAF9FF', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#6C47FF', cursor: 'pointer', fontFamily: 'inherit' };
const btn = { padding: '7px 14px', background: 'linear-gradient(135deg,#6C47FF,#5035CC)', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
