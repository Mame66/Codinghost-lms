import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ════════════════════════════════════════════════════════════
// ICÔNES SVG
// ════════════════════════════════════════════════════════════
const Ic = ({ name, size = 16, color = 'currentColor', sw = 1.8 }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const icons = {
        arrow_left:   <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        check:        <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        check_circle: <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
        lock:         <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
        send:         <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
        copy:         <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        play:         <svg {...p}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
        slide:        <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        qcm:          <svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        file:         <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
        code:         <svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        book:         <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        book_open:    <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
        star:         <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        link:         <svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
        note:         <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        clock:        <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        chevron:      <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
        layers:       <svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    };
    const el = icons[name];
    if (!el) return null;
    return <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{el}</span>;
};

// Cercle SVG de progression
const Ring = ({ pct = 0, size = 44, stroke = 3.5, color = '#5B2EE8', track = '#E9E4FF', children }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = Math.min((pct / 100) * circ, circ);
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                {pct > 0 && (
                    <circle cx={size/2} cy={size/2} r={r} fill="none"
                            stroke={color} strokeWidth={stroke}
                            strokeDasharray={`${dash} ${circ}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${size/2} ${size/2})`} />
                )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

const TASK_CFG = {
    SLIDE:  { icon: 'slide',  color: '#5B2EE8', bg: '#EDE8FF', label: 'Slide' },
    QCM:    { icon: 'qcm',    color: '#059669', bg: '#ECFDF5', label: 'QCM' },
    DEVOIR: { icon: 'file',   color: '#DC2626', bg: '#FEF2F2', label: 'Devoir' },
    SCRIPT: { icon: 'code',   color: '#0284C7', bg: '#E0F2FE', label: 'Script' },
};

const LANG_CFG = {
    python:     { bg: '#FFF9C4', color: '#7B6000', label: 'Python' },
    javascript: { bg: '#FFF3E0', color: '#E65100', label: 'JavaScript' },
    html:       { bg: '#FCE4EC', color: '#880E4F', label: 'HTML' },
    css:        { bg: '#E3F2FD', color: '#0D47A1', label: 'CSS' },
    scratch:    { bg: '#E8F5E9', color: '#1B5E20', label: 'Scratch' },
};

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Course() {
    const { user } = useAuth();

    const [courses, setCourses]       = useState([]);
    const [activeCourse, setActiveCourse] = useState(null); // cours sélectionné
    const [activeModule, setActiveModule] = useState(null); // module sélectionné (si modules)
    const [activeTask, setActiveTask]     = useState(null);
    const [view, setView]                 = useState('home'); // home | lessons | slide | qcm | script
    const [loading, setLoading]           = useState(true);
    const [studentId, setStudentId]       = useState(null);
    const [hwMap, setHwMap]               = useState({});
    const [copiedCode, setCopiedCode]     = useState(false);

    const [qcmQ, setQcmQ]             = useState([]);
    const [qcmA, setQcmA]             = useState({});
    const [qcmDone, setQcmDone]       = useState(false);
    const [qcmRes, setQcmRes]         = useState(null);

    const [devoirTask, setDevoirTask] = useState(null);
    const [devoirLien, setDevoirLien] = useState('');
    const [devoirTxt, setDevoirTxt]   = useState('');
    const [existingDev, setExistingDev] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDevoir, setShowDevoir] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/courses/my');
            setCourses(res.data);
            const meRes   = await api.get('/auth/me');
            const studRes = await api.get('/students');
            const student = studRes.data.find(s => s.user?.login === meRes.data.login);
            if (student) {
                setStudentId(student.id);
                const hwRes = await api.get(`/homeworks/student/${student.id}`);
                const map = {};
                hwRes.data.forEach(hw => { map[hw.taskId] = hw; });
                setHwMap(map);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // ── Helpers ──
    const isDone  = (t) => { const h = hwMap[t.id]; return h?.qcmSoumis || h?.statut === 'RENDU' || h?.statut === 'CORRIGE'; };
    const getHw   = (t) => hwMap[t.id];

    const progOf = (chapters) => {
        const tasks = chapters.flatMap(c => c.tasks || []);
        const done  = tasks.filter(t => isDone(t)).length;
        return { done, total: tasks.length, pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 };
    };

    // Chapitres visibles selon le module ou cours sélectionné
    const visibleChapters = () => {
        if (!activeCourse) return [];
        if (activeCourse.modules?.length > 0 && activeModule) return activeModule.chapters || [];
        if (activeCourse.modules?.length > 0 && !activeModule) return [];
        return activeCourse.chapters || [];
    };

    // ── Ouvrir un cours ──
    const openCourse = (course) => {
        setActiveCourse(course);
        const mods  = course.modules  || [];
        const chaps = course.chapters || [];
        if (mods.length > 0) {
            setActiveModule(mods.find(m => !m.locked) || mods[0]);
        } else {
            setActiveModule(null);
        }
        setView('lessons');
    };

    // ── Ouvrir une tâche ──
    const openTask = async (task) => {
        if (task.locked) return;
        setActiveTask(task);
        if (task.type === 'SLIDE')  { setView('slide');  return; }
        if (task.type === 'SCRIPT') { setView('script'); return; }
        if (task.type === 'QCM') {
            const existing = hwMap[task.id];
            try {
                const qRes = await api.get(`/courses/tasks/${task.id}/questions`);
                setQcmQ(qRes.data);
                if (existing?.qcmSoumis) {
                    const ans = typeof existing.qcmAnswers === 'string' ? JSON.parse(existing.qcmAnswers) : existing.qcmAnswers || {};
                    setQcmA(ans); setQcmDone(true);
                    let correct = 0;
                    qRes.data.forEach((q, i) => { if (parseInt(ans[i]) === q.correct) correct++; });
                    setQcmRes({ correct, total: qRes.data.length, score: existing.note ?? Math.round((correct / qRes.data.length) * 20) });
                } else { setQcmA({}); setQcmDone(false); setQcmRes(null); }
                setView('qcm');
            } catch { alert('Erreur chargement QCM'); }
            return;
        }
        if (task.type === 'DEVOIR') {
            const ex = hwMap[task.id];
            setDevoirTask(task); setExistingDev(ex || null);
            setDevoirLien(ex?.lienRendu || ''); setDevoirTxt(ex?.contenu || '');
            setShowDevoir(true);
        }
    };

    const submitQcm = async () => {
        if (Object.keys(qcmA).length < qcmQ.length) return alert('Répondez à toutes les questions');
        if (!window.confirm('Êtes-vous sûr ? Impossible de modifier après soumission.')) return;
        let correct = 0;
        qcmQ.forEach((q, i) => { if (parseInt(qcmA[i]) === q.correct) correct++; });
        const score = Math.round((correct / qcmQ.length) * 20);
        try {
            await api.post('/homeworks', { taskId: activeTask.id, studentId, contenu: `QCM ${correct}/${qcmQ.length}`, qcmAnswers: JSON.stringify(qcmA), qcmSoumis: true });
            setQcmDone(true);
            setQcmRes({ correct, total: qcmQ.length, score });
            setHwMap(prev => ({ ...prev, [activeTask.id]: { ...prev[activeTask.id], qcmSoumis: true, statut: 'RENDU', note: score } }));
        } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    };

    const submitDevoir = async () => {
        if (!devoirLien && !devoirTxt) return alert('Ajoutez un lien ou une réponse');
        setSubmitting(true);
        try {
            await api.post('/homeworks', { taskId: devoirTask.id, studentId, contenu: devoirTxt, lienRendu: devoirLien || null });
            setShowDevoir(false);
            setHwMap(prev => ({ ...prev, [devoirTask.id]: { ...prev[devoirTask.id], statut: 'RENDU', lienRendu: devoirLien, contenu: devoirTxt } }));
        } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
        setSubmitting(false);
    };

    // ════════════════════════════════════════════════════════
    // LOADING
    // ════════════════════════════════════════════════════════
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #EDE8FF', borderTop: '3px solid #5B2EE8', borderRadius: '50%' }} />
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Chargement de vos cours...</span>
        </div>
    );

    // ════════════════════════════════════════════════════════
    // VUE SLIDE — plein écran
    // ════════════════════════════════════════════════════════
    if (view === 'slide') return (
        <div style={s.fullscreen}>
            <div style={s.fsBar}>
                <button style={s.fsBack} onClick={() => setView('lessons')}>
                    <Ic name="arrow_left" size={15} color="#5B2EE8" /> Retour
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#EDE8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic name="slide" size={15} color="#5B2EE8" />
                    </div>
                    <span style={{ fontWeight: '700', color: '#1A1040', fontSize: '15px' }}>{activeTask?.titre}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#5B2EE8', background: '#EDE8FF', padding: '4px 14px', borderRadius: '50px' }}>Slide</span>
            </div>
            <div style={{ flex: 1, background: '#0F172A' }}>
                {activeTask?.contenuUrl
                    ? <iframe style={{ width: '100%', height: '100%', border: 'none' }} src={activeTask.contenuUrl.replace('/edit', '/embed').replace('/pub', '/embed')} allowFullScreen title={activeTask.titre} />
                    : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#6B7280' }}>
                        <Ic name="slide" size={44} color="#374151" />
                        <div>Aucun contenu disponible</div>
                    </div>
                }
            </div>
        </div>
    );

    // ════════════════════════════════════════════════════════
    // VUE SCRIPT — plein écran
    // ════════════════════════════════════════════════════════
    if (view === 'script') {
        const lang = activeTask?.scriptLanguage || 'python';
        const lc = LANG_CFG[lang] || LANG_CFG.python;
        return (
            <div style={s.fullscreen}>
                <div style={s.fsBar}>
                    <button style={s.fsBack} onClick={() => setView('lessons')}><Ic name="arrow_left" size={15} color="#5B2EE8" /> Retour</button>
                    <span style={{ fontWeight: '700', color: '#1A1040', fontSize: '15px', flex: 1 }}>{activeTask?.titre}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 14px', borderRadius: '50px', background: lc.bg, color: lc.color }}>{lc.label}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', background: '#F8F8FC', padding: '32px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {activeTask?.description && (
                            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '22px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#5B2EE8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Instructions</div>
                                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{activeTask.description}</div>
                            </div>
                        )}
                        <div style={{ background: '#0F172A', borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '50px', background: lc.bg, color: lc.color }}>{lc.label}</span>
                                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#9CA3AF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                        onClick={() => { navigator.clipboard.writeText(activeTask?.scriptContent || ''); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}>
                                    <Ic name={copiedCode ? 'check' : 'copy'} size={13} color={copiedCode ? '#059669' : '#9CA3AF'} />
                                    {copiedCode ? 'Copié !' : 'Copier'}
                                </button>
                            </div>
                            <pre style={{ margin: 0, padding: '22px', fontFamily: "'Courier New',monospace", fontSize: '14px', lineHeight: 1.7, color: '#E2E8F0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                <code>{activeTask?.scriptContent || '# Aucun script disponible'}</code>
                            </pre>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6B7280', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px 14px' }}>
                            <Ic name="play" size={13} color="#5B2EE8" /> Copiez ce code et exécutez-le dans {lc.label}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // VUE QCM — plein écran
    // ════════════════════════════════════════════════════════
    if (view === 'qcm') return (
        <div style={s.fullscreen}>
            <div style={{ ...s.fsBar, background: '#5B2EE8' }}>
                <button style={{ ...s.fsBack, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }} onClick={() => setView('lessons')}>
                    <Ic name="arrow_left" size={15} color="#fff" /> Retour
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic name="qcm" size={15} color="#fff" />
                    </div>
                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>{activeTask?.titre}</span>
                </div>
                {qcmDone
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '50px' }}><Ic name="lock" size={11} color="#fff" /> Soumis</span>
                    : <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{Object.keys(qcmA).length}/{qcmQ.length}</span>
                }
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: '#F8F8FC', padding: '32px' }}>
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                    {qcmDone && qcmRes ? (
                        <>
                            {/* Score */}
                            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '48px', textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: qcmRes.score >= 10 ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <Ic name={qcmRes.score >= 10 ? 'check_circle' : 'file'} size={40} color={qcmRes.score >= 10 ? '#059669' : '#DC2626'} />
                                </div>
                                <div style={{ fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' }}>{qcmRes.score >= 10 ? 'Bravo !' : 'Continuez à pratiquer !'}</div>
                                <div style={{ color: '#9CA3AF', marginBottom: '20px', fontSize: '14px' }}>{qcmRes.correct}/{qcmRes.total} bonnes réponses</div>
                                <div style={{ fontFamily: 'sans-serif', fontSize: '64px', fontWeight: '900', color: qcmRes.score >= 10 ? '#059669' : '#DC2626', lineHeight: 1 }}>
                                    {qcmRes.score}<span style={{ fontSize: '28px', fontWeight: '600', color: '#D1D5DB' }}>/20</span>
                                </div>
                            </div>
                            {/* Révision */}
                            <div style={{ fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Ic name="note" size={16} color="#5B2EE8" /> Vos réponses
                            </div>
                            {qcmQ.map((q, qi) => {
                                const ua = parseInt(qcmA[qi]);
                                const ok = ua === q.correct;
                                return (
                                    <div key={qi} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', display: 'flex', gap: '14px', marginBottom: '12px' }}>
                                        <div style={{ width: '30px', height: '30px', background: '#5B2EE8', color: '#fff', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>Q{qi+1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1A1040', marginBottom: '12px' }}>{q.question}</div>
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', marginBottom: '6px', background: oi === q.correct ? 'rgba(5,150,105,0.07)' : oi === ua && !ok ? 'rgba(220,38,38,0.07)' : '#F9FAFB', border: `1.5px solid ${oi === q.correct ? '#6EE7B7' : oi === ua && !ok ? '#FECACA' : '#F3F4F6'}` }}>
                                                    <span style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0, background: oi === q.correct ? '#059669' : oi === ua && !ok ? '#DC2626' : '#E5E7EB', color: (oi === q.correct || (oi === ua && !ok)) ? '#fff' : '#6B7280' }}>{['A','B','C','D'][oi]}</span>
                                                    <span style={{ fontSize: '13px', flex: 1 }}>{opt}</span>
                                                    {oi === q.correct && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#059669', fontSize: '12px', fontWeight: '700' }}><Ic name="check" size={12} color="#059669" sw={2.5} /> Bonne</span>}
                                                    {oi === ua && !ok && <span style={{ color: '#DC2626', fontSize: '12px', fontWeight: '700' }}>✗ Votre réponse</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                                <button style={s.btnPri} onClick={() => setView('lessons')}><Ic name="arrow_left" size={14} color="#fff" /> Retour au cours</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {qcmQ.map((q, qi) => (
                                <div key={qi} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#5B2EE8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Ic name="qcm" size={12} color="#5B2EE8" /> Question {qi+1}/{qcmQ.length}
                                    </div>
                                    <div style={{ fontFamily: 'sans-serif', fontSize: '17px', fontWeight: '700', color: '#1A1040', marginBottom: '20px', lineHeight: 1.5 }}>{q.question}</div>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${qcmA[qi] === oi ? '#5B2EE8' : '#E5E7EB'}`, background: qcmA[qi] === oi ? '#F5F2FF' : '#fff', marginBottom: '8px', transition: 'all 0.15s' }}
                                             onClick={() => setQcmA({ ...qcmA, [qi]: oi })}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0, background: qcmA[qi] === oi ? '#5B2EE8' : '#F3F4F6', color: qcmA[qi] === oi ? '#fff' : '#6B7280' }}>{['A','B','C','D'][oi]}</div>
                                            <span style={{ fontSize: '14px', fontWeight: qcmA[qi] === oi ? '700' : '400', color: '#1A1040', flex: 1 }}>{opt}</span>
                                            {qcmA[qi] === oi && <Ic name="check_circle" size={18} color="#5B2EE8" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '16px 0 40px' }}>
                                <button style={s.btnSec} onClick={() => setView('lessons')}>Annuler</button>
                                <button style={{ ...s.btnPri, opacity: Object.keys(qcmA).length < qcmQ.length ? 0.6 : 1 }} onClick={submitQcm}>
                                    <Ic name="send" size={14} color="#fff" /> Soumettre ({Object.keys(qcmA).length}/{qcmQ.length})
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // ════════════════════════════════════════════════════════
    // VUE ACCUEIL — grille de cours
    // ════════════════════════════════════════════════════════
    if (view === 'home' || !activeCourse) {
        if (courses.length === 0) return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
                <div style={{ width: '72px', height: '72px', background: '#F3F4F6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ic name="book" size={34} color="#9CA3AF" />
                </div>
                <div style={{ fontWeight: '800', fontSize: '20px', color: '#1A1040' }}>Aucun cours disponible</div>
                <div style={{ color: '#9CA3AF', fontSize: '14px' }}>Vous n'êtes pas encore inscrit à un groupe avec un cours.</div>
            </div>
        );

        return (
            <div style={{ padding: '4px 0' }}>
                {/* Salutation */}
                <div style={s.greeting}>
                    <div>
                        <div style={s.greetTitle}>Bonjour{user?.prenom ? `, ${user.prenom}` : ''} 👋</div>
                        <div style={s.greetSub}>Choisissez un cours pour continuer votre apprentissage</div>
                    </div>
                    <div style={s.statsRow}>
                        <div style={s.statChip}>
                            <Ic name="book_open" size={15} color="#5B2EE8" />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>{courses.length} cours</span>
                        </div>
                        <div style={s.statChip}>
                            <Ic name="check_circle" size={15} color="#059669" />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>
                                {Object.values(hwMap).filter(h => h.statut === 'CORRIGE').length} corrigés
                            </span>
                        </div>
                    </div>
                </div>

                {/* Grille de cours */}
                <div style={s.courseGrid}>
                    {courses.map((course, idx) => {
                        const mods  = course.modules  || [];
                        const chaps = course.chapters || [];
                        const allChaps = mods.length > 0 ? mods.flatMap(m => m.chapters || []) : chaps;
                        const prog  = progOf(allChaps);
                        const totalLessons = mods.length > 0 ? mods.length : chaps.length;
                        const GRADIENTS = [
                            ['#5B2EE8', '#8B5CF6'],
                            ['#0284C7', '#38BDF8'],
                            ['#059669', '#34D399'],
                            ['#DC2626', '#F87171'],
                            ['#D97706', '#FCD34D'],
                            ['#7C3AED', '#A78BFA'],
                        ];
                        const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];

                        return (
                            <div key={course.id} style={s.courseCard} onClick={() => openCourse(course)}>
                                {/* Bannière colorée */}
                                <div style={{ ...s.courseBanner, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                    <div style={s.courseEmojiWrap}>
                                        <div style={s.courseEmoji}>📚</div>
                                    </div>
                                    {prog.pct === 100 && (
                                        <div style={s.completedBadge}>
                                            <Ic name="check" size={12} color="#fff" sw={2.5} /> Complété
                                        </div>
                                    )}
                                </div>

                                {/* Infos cours */}
                                <div style={s.courseBody}>
                                    <div style={s.courseTitle}>{course.titre}</div>
                                    {course.niveau && <div style={s.courseLevel}>{course.niveau}</div>}

                                    <div style={s.courseMeta}>
                                        <span style={s.coursePill}><Ic name="layers" size={11} color="#5B2EE8" /> {totalLessons} leçon{totalLessons > 1 ? 's' : ''}</span>
                                        <span style={s.coursePill}><Ic name="note" size={11} color="#5B2EE8" /> {prog.total} tâches</span>
                                    </div>

                                    {/* Progress */}
                                    <div style={s.progressWrap}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF' }}>Progression</span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: prog.pct === 100 ? '#059669' : '#5B2EE8' }}>{prog.pct}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '50px', overflow: 'hidden' }}>
                                            <div style={{ width: `${prog.pct}%`, height: '100%', background: prog.pct === 100 ? '#059669' : `linear-gradient(90deg, ${c1}, ${c2})`, borderRadius: '50px', transition: 'width 0.5s' }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{prog.done}/{prog.total} tâches complétées</div>
                                    </div>

                                    <button style={{ ...s.courseBtn, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                        {prog.done === 0 ? 'Commencer' : prog.pct === 100 ? 'Revoir' : 'Continuer'} <Ic name="chevron" size={14} color="#fff" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // VUE LEÇONS — layout 2 colonnes
    // ════════════════════════════════════════════════════════
    const mods   = activeCourse.modules  || [];
    const chaps  = activeCourse.chapters || [];
    const hasModules = mods.length > 0;
    const chapters   = visibleChapters();

    // Numérotation globale des tâches
    let taskCounter = 0;

    return (
        <div style={s.layout}>

            {/* ══════════════════════════════════════
                SIDEBAR — fond blanc élégant
            ══════════════════════════════════════ */}
            <div style={s.sidebar}>

                {/* Bouton retour aux cours */}
                <div style={s.sideTop}>
                    <button style={s.backBtn} onClick={() => { setView('home'); setActiveCourse(null); }}>
                        <Ic name="arrow_left" size={14} color="#5B2EE8" /> Mes cours
                    </button>
                </div>

                {/* Carte cours actif */}
                <div style={s.sideInfo}>
                    <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg,#5B2EE8,#8B5CF6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📚</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A1040', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeCourse.titre}</div>
                        {activeCourse.niveau && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{activeCourse.niveau}</div>}
                    </div>
                </div>

                {/* Barre de progression globale */}
                {(() => {
                    const allC  = hasModules ? mods.flatMap(m => m.chapters || []) : chaps;
                    const prog  = progOf(allC);
                    return (
                        <div style={s.sideProgress}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600' }}>Progression globale</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#5B2EE8' }}>{prog.pct}%</span>
                            </div>
                            <div style={{ height: '5px', background: '#F3F4F6', borderRadius: '50px', overflow: 'hidden' }}>
                                <div style={{ width: `${prog.pct}%`, height: '100%', background: 'linear-gradient(90deg,#5B2EE8,#8B5CF6)', borderRadius: '50px' }} />
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{prog.done}/{prog.total} tâches</div>
                        </div>
                    );
                })()}

                <div style={s.sideLabel}>{hasModules ? 'Modules' : 'Leçons'}</div>

                {/* Liste modules ou chapitres */}
                <div style={s.sideList}>
                    {(hasModules ? mods : chaps).map((item, idx) => {
                        const itemChaps = hasModules ? (item.chapters || []) : [item];
                        const prog  = progOf(itemChaps);
                        const isOn  = hasModules
                            ? activeModule?.id === item.id
                            : true; // sans modules, tout est affiché
                        const locked = item.locked;

                        return (
                            <div key={item.id}
                                 style={{ ...s.sideItem, ...(isOn ? s.sideItemOn : {}), ...(locked ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}
                                 onClick={() => { if (!locked && hasModules) setActiveModule(item); }}>

                                {/* Cercle de progression */}
                                <Ring pct={prog.pct} size={42} stroke={3.5}
                                      color={prog.pct === 100 ? '#059669' : '#5B2EE8'}
                                      track={isOn ? 'rgba(91,46,232,0.15)' : '#E9E4FF'}>
                                    {locked ? <Ic name="lock" size={14} color="#9CA3AF" />
                                        : prog.pct === 100 ? <Ic name="check" size={14} color="#059669" sw={2.5} />
                                            : <span style={{ fontSize: '13px', fontWeight: '800', color: isOn ? '#5B2EE8' : '#6B7280' }}>{idx+1}</span>}
                                </Ring>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: isOn ? '700' : '500', color: isOn ? '#5B2EE8' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                                        {idx+1}. {item.titre}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                        {locked ? 'Verrouillé' : `${prog.done}/${prog.total} tâche${prog.total > 1 ? 's' : ''}`}
                                    </div>
                                    {!locked && prog.total > 0 && (
                                        <div style={{ height: '2px', background: '#F3F4F6', borderRadius: '50px', marginTop: '6px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${prog.pct}%`, background: prog.pct === 100 ? '#059669' : '#5B2EE8', borderRadius: '50px' }} />
                                        </div>
                                    )}
                                </div>

                                {isOn && <div style={{ width: '3px', height: '30px', background: '#5B2EE8', borderRadius: '50px', flexShrink: 0 }} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════
                CONTENU PRINCIPAL
            ══════════════════════════════════════ */}
            <div style={s.main}>

                {hasModules && !activeModule ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%', gap: '14px' }}>
                        <div style={{ width: '64px', height: '64px', background: '#F5F2FF', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ic name="layers" size={30} color="#5B2EE8" />
                        </div>
                        <div style={{ fontWeight: '700', color: '#6B7280', fontSize: '15px' }}>Sélectionnez un module dans la sidebar</div>
                    </div>
                ) : chapters.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%', gap: '14px' }}>
                        <div style={{ fontWeight: '700', color: '#9CA3AF' }}>Aucune leçon disponible</div>
                    </div>
                ) : (
                    <>
                        {/* En-tête du module */}
                        <div style={s.mainHeader}>
                            {activeModule ? (
                                <>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Ic name="book" size={12} color="#9CA3AF" /> {activeCourse.titre}
                                    </div>
                                    <h1 style={s.mainTitle}>{(mods.indexOf(activeModule)+1)}. {activeModule.titre}</h1>
                                    {activeModule.description && <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{activeModule.description}</div>}
                                </>
                            ) : (
                                <h1 style={s.mainTitle}>{activeCourse.titre}</h1>
                            )}
                        </div>

                        {/* Leçons */}
                        <div style={s.lessonsWrap}>
                            {chapters.map((chap, ci) => {
                                const tasks = [...(chap.tasks || [])].sort((a, b) => a.ordre - b.ordre);
                                return (
                                    <div key={chap.id} style={s.lessonCard}>
                                        {/* Titre leçon avec barre colorée */}
                                        <div style={s.lessonHeader}>
                                            <div style={s.lessonHeaderLeft}>
                                                {chap.locked
                                                    ? <div style={{ width: '30px', height: '30px', background: '#F3F4F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic name="lock" size={14} color="#9CA3AF" /></div>
                                                    : <div style={s.lessonNum}>{ci+1}</div>
                                                }
                                                <div>
                                                    <div style={s.lessonTitle}>
                                                        Leçon {ci+1} — {chap.titre}
                                                    </div>
                                                    <div style={s.lessonMeta}>
                                                        {chap.locked ? <span style={{ color: '#9CA3AF' }}>Verrouillée</span>
                                                            : <span>{tasks.filter(t => isDone(t)).length}/{tasks.length} tâches complétées</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {!chap.locked && tasks.length > 0 && (
                                                <div style={s.lessonProg}>
                                                    <Ring pct={progOf([chap]).pct} size={38} stroke={3}
                                                          color={progOf([chap]).pct === 100 ? '#059669' : '#5B2EE8'}
                                                          track="#E9E4FF">
                                                        <span style={{ fontSize: '10px', fontWeight: '800', color: progOf([chap]).pct === 100 ? '#059669' : '#5B2EE8' }}>{progOf([chap]).pct}%</span>
                                                    </Ring>
                                                </div>
                                            )}
                                        </div>

                                        {/* Grille de tâches */}
                                        <div style={s.tasksRow}>
                                            {tasks.map((task) => {
                                                taskCounter++;
                                                const idx    = taskCounter;
                                                const tc     = TASK_CFG[task.type] || TASK_CFG.SLIDE;
                                                const hw     = getHw(task);
                                                const done   = isDone(task);
                                                const locked = task.locked || chap.locked;

                                                return (
                                                    <div key={task.id} style={s.taskWrap} onClick={() => !locked && openTask(task)}>
                                                        {/* Grand cercle */}
                                                        <div style={{ position: 'relative' }}>
                                                            <div style={{
                                                                ...s.taskCircle,
                                                                background: locked ? '#E9E4FF' : done ? 'linear-gradient(135deg,#059669,#34D399)' : `linear-gradient(135deg,${tc.color},${tc.color}CC)`,
                                                                boxShadow: locked ? 'none' : done ? '0 8px 24px rgba(5,150,105,0.35)' : `0 8px 24px ${tc.color}45`,
                                                                cursor: locked ? 'not-allowed' : 'pointer',
                                                                opacity: locked ? 0.55 : 1,
                                                            }}>
                                                                {locked
                                                                    ? <Ic name="lock" size={26} color="#9CA3AF" />
                                                                    : done
                                                                        ? <Ic name="check" size={30} color="#fff" sw={2.5} />
                                                                        : <span style={{ fontSize: '28px', fontWeight: '900', color: '#fff', fontFamily: 'sans-serif' }}>{idx}</span>
                                                                }
                                                            </div>
                                                            {/* Badge ✓ vert (style Algorithmics) */}
                                                            {done && !locked && (
                                                                <div style={s.doneBadge}>
                                                                    <Ic name="check" size={10} color="#fff" sw={2.5} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Nom */}
                                                        <div style={s.taskName}>{task.titre}</div>

                                                        {/* Type */}
                                                        <span style={{ ...s.taskType, background: locked ? '#F3F4F6' : tc.bg, color: locked ? '#9CA3AF' : tc.color }}>
                                                            <Ic name={tc.icon} size={9} color={locked ? '#9CA3AF' : tc.color} /> {tc.label}
                                                        </span>

                                                        {/* Note si corrigé */}
                                                        {hw?.note !== null && hw?.note !== undefined && (
                                                            <span style={s.noteTag}><Ic name="star" size={10} color="#5B2EE8" /> {hw.note}/20</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {tasks.length === 0 && (
                                                <div style={{ color: '#D1D5DB', fontSize: '13px', fontStyle: 'italic' }}>Aucune tâche</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal Devoir */}
            {showDevoir && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     onClick={() => setShowDevoir(false)}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '540px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
                         onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <div style={{ width: '46px', height: '46px', background: '#FEF2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Ic name="file" size={22} color="#DC2626" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '17px', color: '#111827' }}>{devoirTask?.titre}</div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '5px', marginTop: '3px' }}>
                                    <Ic name="file" size={10} color="#DC2626" /> Devoir à rendre
                                </span>
                            </div>
                        </div>
                        {devoirTask?.description && (
                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8B6200', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Instructions</div>
                                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{devoirTask.description}</div>
                            </div>
                        )}
                        {existingDev && existingDev.statut !== 'EN_ATTENTE' && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                                <Ic name="check_circle" size={17} color="#059669" />
                                <div>
                                    <div style={{ fontWeight: '700', color: '#059669', fontSize: '13px' }}>Devoir déjà rendu</div>
                                    {existingDev.note !== null && existingDev.note !== undefined && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '800', color: '#5B2EE8', marginTop: '2px' }}>
                                            <Ic name="star" size={13} color="#5B2EE8" /> Note : {existingDev.note}/20
                                        </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Vous pouvez soumettre un nouveau lien</div>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Ic name="link" size={11} color="#9CA3AF" /> Lien Google Drive
                            </label>
                            <input style={{ padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', color: '#111827', outline: 'none', background: '#F9FAFB', fontFamily: 'inherit' }} type="url" placeholder="https://drive.google.com/..." value={devoirLien} onChange={e => setDevoirLien(e.target.value)} />
                        </div>
                        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', fontWeight: '600', margin: '8px 0' }}>— ou —</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Ic name="note" size={11} color="#9CA3AF" /> Réponse texte
                            </label>
                            <textarea style={{ padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', color: '#111827', outline: 'none', background: '#F9FAFB', fontFamily: 'inherit', minHeight: '90px', resize: 'vertical' }} placeholder="Écrivez votre réponse..." value={devoirTxt} onChange={e => setDevoirTxt(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button style={s.btnSec} onClick={() => setShowDevoir(false)}>Annuler</button>
                            <button style={{ ...s.btnPri, background: '#DC2626', opacity: submitting ? 0.7 : 1 }} onClick={submitDevoir} disabled={submitting}>
                                <Ic name="send" size={14} color="#fff" />
                                {submitting ? 'Envoi...' : existingDev?.statut === 'RENDU' ? 'Remplacer' : 'Rendre le devoir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════
const s = {
    // ── Accueil ──────────────────────────────────────────────
    greeting:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
    greetTitle: { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '900', color: '#1A1040', marginBottom: '4px' },
    greetSub:   { fontSize: '14px', color: '#9CA3AF' },
    statsRow:   { display: 'flex', gap: '10px' },
    statChip:   { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '7px 14px' },
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    courseCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    courseBanner: { height: '110px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    courseEmojiWrap: { width: '56px', height: '56px', background: 'rgba(255,255,255,0.25)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
    courseEmoji: { fontSize: '28px' },
    completedBadge: { position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px', backdropFilter: 'blur(4px)' },
    courseBody:  { padding: '18px' },
    courseTitle: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '4px', lineHeight: 1.3 },
    courseLevel: { fontSize: '12px', color: '#9CA3AF', fontWeight: '600', marginBottom: '10px' },
    courseMeta:  { display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' },
    coursePill:  { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#5B2EE8', background: '#EDE8FF', padding: '3px 9px', borderRadius: '50px' },
    progressWrap:{ marginBottom: '14px' },
    courseBtn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },

    // ── Layout leçons ─────────────────────────────────────────
    layout:  { display: 'flex', height: 'calc(100vh - 100px)', margin: '-24px', overflow: 'hidden', background: '#F7F7FB' },

    // ── Sidebar blanche ───────────────────────────────────────
    sidebar: { width: '296px', background: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #EBEBF0', overflowY: 'auto' },
    sideTop: { padding: '14px 16px', borderBottom: '1px solid #F3F4F6' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#F5F2FF', border: '1px solid #EDE8FF', borderRadius: '9px', color: '#5B2EE8', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    sideInfo:    { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' },
    sideProgress:{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' },
    sideLabel:   { fontSize: '10px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '12px 18px 6px' },
    sideList:    { flex: 1, padding: '4px 10px 20px', display: 'flex', flexDirection: 'column', gap: '2px' },
    sideItem:    { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent' },
    sideItemOn:  { background: '#F5F2FF', border: '1px solid #EDE8FF' },

    // ── Main ──────────────────────────────────────────────────
    main:       { flex: 1, overflowY: 'auto', background: '#fff' },
    mainHeader: { padding: '32px 40px 20px', borderBottom: '1px solid #F3F4F6' },
    mainTitle:  { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '900', color: '#1A1040', margin: '0 0 4px', letterSpacing: '-0.4px' },
    lessonsWrap:{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '24px' },

    // ── Leçon ─────────────────────────────────────────────────
    lessonCard:      { background: '#FAFAFA', borderRadius: '18px', border: '1px solid #F0EFF6', overflow: 'hidden' },
    lessonHeader:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: '#fff', borderBottom: '1px solid #F0EFF6' },
    lessonHeaderLeft:{ display: 'flex', alignItems: 'center', gap: '12px' },
    lessonNum:       { width: '30px', height: '30px', background: '#5B2EE8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#fff', flexShrink: 0 },
    lessonTitle:     { fontSize: '14px', fontWeight: '800', color: '#1A1040', letterSpacing: '0.1px' },
    lessonMeta:      { fontSize: '11px', color: '#9CA3AF', fontWeight: '600', marginTop: '2px' },
    lessonProg:      { flexShrink: 0 },
    tasksRow:        { display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '24px 22px' },

    // ── Tâche ─────────────────────────────────────────────────
    taskWrap:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '96px' },
    taskCircle: { width: '86px', height: '86px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s, box-shadow 0.15s' },
    doneBadge:  { position: 'absolute', top: '2px', right: '2px', width: '22px', height: '22px', background: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #fff' },
    taskName:   { fontSize: '12px', fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 1.3, maxWidth: '90px' },
    taskType:   { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '800' },
    noteTag:    { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '800', color: '#5B2EE8', background: '#EDE8FF', padding: '2px 8px', borderRadius: '50px' },

    // ── Fullscreen ────────────────────────────────────────────
    fullscreen: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#fff' },
    fsBar:      { height: '56px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '14px', padding: '0 20px', flexShrink: 0 },
    fsBack:     { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#F5F2FF', border: '1px solid #EDE8FF', borderRadius: '9px', color: '#5B2EE8', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },

    // ── Boutons ───────────────────────────────────────────────
    btnPri: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 22px', background: '#5B2EE8', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnSec: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 18px', background: 'transparent', border: '1.5px solid #E5E7EB', borderRadius: '10px', color: '#374151', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
};