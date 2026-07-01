import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ════════════════════════════════════════════════════════════
// ICÔNES
// ════════════════════════════════════════════════════════════
const Ic = ({ name, size = 16, color = 'currentColor', sw = 1.8 }) => {
    const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round' };
    const icons = {
        back:     <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        check:    <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        lock:     <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
        send:     <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
        copy:     <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        target:   <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
        slide:    <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        image:    <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        qcm:      <svg {...p}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        code:     <svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        book:     <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        layers:   <svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
        star:     <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        chevron:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
        play:     <svg {...p}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
        check_circle: <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    };
    return icons[name] ? <span style={{ display:'inline-flex', alignItems:'center', flexShrink:0 }}>{icons[name]}</span> : null;
};

// ── Cercle progression SVG ────────────────────────────────
const Ring = ({ pct=0, size=44, stroke=3.5, color='#5B2EE8', track='#E9E4FF', children }) => {
    const r    = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = Math.min((pct / 100) * circ, circ);
    return (
        <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
                {pct > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>}
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</div>
        </div>
    );
};

const LANG_CFG = {
    python:     { bg:'#FFF9C4', color:'#7B6000', label:'Python' },
    javascript: { bg:'#FFF3E0', color:'#E65100', label:'JavaScript' },
    html:       { bg:'#FCE4EC', color:'#880E4F', label:'HTML' },
    css:        { bg:'#E3F2FD', color:'#0D47A1', label:'CSS' },
    scratch:    { bg:'#E8F5E9', color:'#1B5E20', label:'Scratch' },
};

const GRADIENTS = [
    ['#5B2EE8','#8B5CF6'], ['#0284C7','#38BDF8'], ['#059669','#34D399'],
    ['#DC2626','#F87171'], ['#D97706','#FCD34D'], ['#7C3AED','#A78BFA'],
];

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Course() {
    const { user } = useAuth();

    const [courses,     setCourses]     = useState([]);
    const [selCourse,   setSelCourse]   = useState(null);
    const [selModule,   setSelModule]   = useState(null);
    const [selLesson,   setSelLesson]   = useState(null);
    const [view,        setView]        = useState('home');
    const [loading,     setLoading]     = useState(true);
    const [studentId,   setStudentId]   = useState(null);
    const [progress,    setProgress]    = useState({});
    const [copiedCode,  setCopiedCode]  = useState(false);

    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizAnswers,   setQuizAnswers]   = useState({});
    const [quizDone,      setQuizDone]      = useState(false);
    const [quizResult,    setQuizResult]    = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const meRes = await api.get('/auth/me');
            const res   = await api.get('/courses/my');
            setCourses(res.data);
            try {
                const stRes = await api.get('/students');
                const st    = stRes.data.find(s => s.user?.login === meRes.data.login);
                if (st) {
                    setStudentId(st.id);
                    await loadAllProgress(res.data, st.id);
                }
            } catch {}
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const loadAllProgress = async (courseList, stId) => {
        const map = {};
        for (const course of courseList) {
            try {
                const res = await api.get(`/lessons/progress/course/${course.id}/student/${stId}`);
                res.data.forEach(mod => { mod.lessons.forEach(l => { map[l.lessonId] = l; }); });
            } catch {}
        }
        setProgress(map);
    };

    const getLessonProg = (lessonId) => progress[lessonId] || { pct:0, done:0, total:0 };

    const courseProgress = (course) => {
        const modules = course.modules || [];
        if (modules.length === 0) return { pct:0, done:0, total:0 };
        const allLessons = modules.flatMap(m => m.chapters || []);
        if (allLessons.length === 0) return { pct:0, done:0, total:0 };
        const total = allLessons.length;
        const done  = allLessons.filter(l => (getLessonProg(l.id)?.pct || 0) === 100).length;
        return { pct: Math.round((done / total) * 100), done, total };
    };

    const markDone = async (element) => {
        if (!studentId || !selLesson) return;
        try {
            await api.post(`/lessons/progress/lesson/${selLesson.id}`, { studentId, element });
            const res = await api.get(`/lessons/progress/course/${selCourse.id}/student/${studentId}`);
            const map = { ...progress };
            res.data.forEach(mod => { mod.lessons.forEach(l => { map[l.lessonId] = l; }); });
            setProgress(map);
        } catch (err) { console.error(err); }
    };

    const openCourse = (course) => {
        setSelCourse(course);
        const modules = course.modules || [];
        if (modules.length > 0) setSelModule(modules[0]);
        setView('modules');
    };

    const openLesson = async (lesson) => {
        try {
            const res = await api.get(`/lessons/lessons/${lesson.id}`);
            setSelLesson(res.data);
            setView('lesson');
        } catch { console.error('Erreur chargement leçon'); }
    };

    const openQuiz = async () => {
        try {
            const res = await api.get(`/lessons/lessons/${selLesson.id}/quiz`);
            setQuizQuestions(res.data);
            const prog = getLessonProg(selLesson.id);
            if (prog?.progress?.quizSoumis) {
                setQuizAnswers(prog.progress.quizAnswers || {});
                setQuizDone(true);
                setQuizResult({ score:prog.progress.quizScore, correct:prog.progress.quizCorrect, total:prog.progress.quizTotal });
            } else {
                setQuizAnswers({}); setQuizDone(false); setQuizResult(null);
            }
            setView('quiz');
        } catch { console.error('Erreur chargement quiz'); }
    };

    const submitQuiz = async () => {
        if (Object.keys(quizAnswers).length < quizQuestions.length) return alert('Répondez à toutes les questions');
        if (!window.confirm('Confirmer la soumission ? Impossible de modifier après.')) return;
        try {
            const res = await api.post(`/lessons/progress/lesson/${selLesson.id}/quiz`, { studentId, answers:quizAnswers });
            setQuizDone(true);
            setQuizResult(res.data);
            const pRes = await api.get(`/lessons/progress/course/${selCourse.id}/student/${studentId}`);
            const map  = { ...progress };
            pRes.data.forEach(mod => { mod.lessons.forEach(l => { map[l.lessonId] = l; }); });
            setProgress(map);
        } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    };

    // ════════════════════════════════════════════════════════
    // LOADING
    // ════════════════════════════════════════════════════════
    if (loading) return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'16px' }}>
            <div style={{ width:'40px', height:'40px', border:'3px solid #EDE8FF', borderTop:'3px solid #5B2EE8', borderRadius:'50%' }}/>
            <span style={{ color:'#9CA3AF', fontSize:'14px' }}>Chargement de vos cours...</span>
        </div>
    );

    // ════════════════════════════════════════════════════════
    // VUE SLIDE
    // ════════════════════════════════════════════════════════
    if (view === 'slide') {
        const url = selLesson?.studentSlidesUrl;
        return (
            <div style={s.fs}>
                <div style={s.fsBar}>
                    <button style={s.fsBack} onClick={() => { setView('lesson'); markDone('slides'); }}>
                        <Ic name="back" size={14} color="#5B2EE8"/> Retour
                    </button>
                    <div style={{ flex:1, fontWeight:'700', color:'#1A1040', fontSize:'14px' }}>{selLesson?.titre} — Slides</div>
                    <span style={{ fontSize:'12px', fontWeight:'700', color:'#5B2EE8', background:'#EDE8FF', padding:'4px 12px', borderRadius:'50px' }}>Slides</span>
                </div>
                <div style={{ flex:1, background:'#0F172A' }}>
                    {url
                        ? <iframe style={{ width:'100%', height:'100%', border:'none' }} src={url.replace('/edit','/embed').replace('/pub','/embed')} allowFullScreen title="slides"/>
                        : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#6B7280' }}>Aucun slide disponible</div>
                    }
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // VUE CHALLENGE
    // ════════════════════════════════════════════════════════
    if (view === 'challenge') {
        const lang = selLesson?.challengeLang || 'python';
        const lc   = LANG_CFG[lang] || LANG_CFG.python;
        return (
            <div style={s.fs}>
                <div style={s.fsBar}>
                    <button style={s.fsBack} onClick={() => { setView('lesson'); markDone('challenge'); }}>
                        <Ic name="back" size={14} color="#5B2EE8"/> Retour
                    </button>
                    <div style={{ flex:1, fontWeight:'700', color:'#1A1040', fontSize:'14px' }}>{selLesson?.titre} — Challenge</div>
                    <span style={{ fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'50px', background:lc.bg, color:lc.color }}>{lc.label}</span>
                </div>
                <div style={{ flex:1, overflowY:'auto', background:'#F8F8FC', padding:'32px' }}>
                    <div style={{ maxWidth:'800px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'16px' }}>
                        {selLesson?.challengeContent && (
                            <div style={{ background:'#0F172A', borderRadius:'14px', overflow:'hidden' }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                                    <span style={{ fontSize:'11px', fontWeight:'800', padding:'3px 10px', borderRadius:'50px', background:lc.bg, color:lc.color }}>{lc.label}</span>
                                    <button style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'6px', color:copiedCode?'#059669':'#9CA3AF', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
                                            onClick={() => { navigator.clipboard.writeText(selLesson.challengeContent); setCopiedCode(true); setTimeout(()=>setCopiedCode(false),2000); }}>
                                        <Ic name={copiedCode?'check':'copy'} size={13} color={copiedCode?'#059669':'#9CA3AF'}/> {copiedCode?'Copié !':'Copier'}
                                    </button>
                                </div>
                                <pre style={{ margin:0, padding:'22px', fontFamily:"'Courier New',monospace", fontSize:'14px', lineHeight:1.7, color:'#E2E8F0', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                                    <code>{selLesson.challengeContent}</code>
                                </pre>
                            </div>
                        )}
                        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px 16px', fontSize:'12px', color:'#6B7280', display:'flex', alignItems:'center', gap:'8px' }}>
                            <Ic name="play" size={13} color="#5B2EE8"/> Copiez ce code et exécutez-le dans {lc.label}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // VUE QUIZ
    // ════════════════════════════════════════════════════════
    if (view === 'quiz') return (
        <div style={s.fs}>
            <div style={{ ...s.fsBar, background:'#5B2EE8' }}>
                <button style={{ ...s.fsBack, background:'rgba(255,255,255,0.15)', color:'#fff', border:'none' }} onClick={() => setView('lesson')}>
                    <Ic name="back" size={14} color="#fff"/> Retour
                </button>
                <div style={{ flex:1, fontWeight:'700', color:'#fff', fontSize:'14px' }}>{selLesson?.titre} — Quiz</div>
                {quizDone
                    ? <span style={{ fontSize:'12px', fontWeight:'700', color:'#fff', background:'rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:'50px' }}>✅ Soumis</span>
                    : <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.8)', fontWeight:'600' }}>{Object.keys(quizAnswers).length}/{quizQuestions.length}</span>
                }
            </div>
            <div style={{ flex:1, overflowY:'auto', background:'#F8F8FC', padding:'32px' }}>
                <div style={{ maxWidth:'680px', margin:'0 auto' }}>
                    {quizDone && quizResult ? (
                        <>
                            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'20px', padding:'48px', textAlign:'center', marginBottom:'28px' }}>
                                <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:quizResult.score>=10?'#ECFDF5':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                                    <Ic name={quizResult.score>=10?'check_circle':'qcm'} size={38} color={quizResult.score>=10?'#059669':'#DC2626'}/>
                                </div>
                                <div style={{ fontFamily:'sans-serif', fontSize:'24px', fontWeight:'800', color:'#1A1040', marginBottom:'8px' }}>{quizResult.score>=10 ? 'Bravo !' : 'Continuez à pratiquer !'}</div>
                                <div style={{ color:'#9CA3AF', marginBottom:'20px' }}>{quizResult.correct}/{quizResult.total} bonnes réponses</div>
                                <div style={{ fontFamily:'sans-serif', fontSize:'60px', fontWeight:'900', color:quizResult.score>=10?'#059669':'#DC2626', lineHeight:1 }}>
                                    {Number(quizResult.score||0).toFixed(1)}<span style={{ fontSize:'24px', color:'#D1D5DB' }}>/20</span>
                                </div>
                            </div>
                            <button style={{ ...s.btnPri, margin:'0 auto', display:'flex' }} onClick={() => setView('lesson')}>
                                <Ic name="back" size={14} color="#fff"/> Retour à la leçon
                            </button>
                        </>
                    ) : (
                        <>
                            {quizQuestions.map((q, qi) => (
                                <div key={qi} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'16px', padding:'24px', marginBottom:'16px' }}>
                                    <div style={{ fontSize:'11px', fontWeight:'800', color:'#5B2EE8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>Question {qi+1}/{quizQuestions.length}</div>
                                    <div style={{ fontFamily:'sans-serif', fontSize:'16px', fontWeight:'700', color:'#1A1040', marginBottom:'18px', lineHeight:1.5 }}>{q.question}</div>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderRadius:'12px', cursor:'pointer', border:`2px solid ${quizAnswers[qi]===oi?'#5B2EE8':'#E5E7EB'}`, background:quizAnswers[qi]===oi?'#F5F2FF':'#fff', marginBottom:'8px', transition:'all 0.15s' }}
                                             onClick={() => setQuizAnswers({...quizAnswers,[qi]:oi})}>
                                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'13px', background:quizAnswers[qi]===oi?'#5B2EE8':'#F3F4F6', color:quizAnswers[qi]===oi?'#fff':'#6B7280', flexShrink:0 }}>{['A','B','C','D'][oi]}</div>
                                            <span style={{ fontSize:'14px', color:'#1A1040', flex:1 }}>{opt}</span>
                                            {quizAnswers[qi]===oi && <Ic name="check" size={16} color="#5B2EE8"/>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div style={{ display:'flex', justifyContent:'center', gap:'12px', padding:'16px 0 40px' }}>
                                <button style={s.btnSec} onClick={() => setView('lesson')}>Annuler</button>
                                <button style={{ ...s.btnPri, opacity:Object.keys(quizAnswers).length<quizQuestions.length?0.6:1 }} onClick={submitQuiz}>
                                    <Ic name="send" size={14} color="#fff"/> Soumettre ({Object.keys(quizAnswers).length}/{quizQuestions.length})
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
    if (view === 'home') {
        if (courses.length === 0) return (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'14px' }}>
                <div style={{ width:'72px', height:'72px', background:'#F3F4F6', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Ic name="book" size={34} color="#9CA3AF"/>
                </div>
                <div style={{ fontWeight:'800', fontSize:'20px', color:'#1A1040' }}>Aucun cours disponible</div>
                <div style={{ color:'#9CA3AF', fontSize:'14px' }}>Vous n'êtes pas encore inscrit à un groupe avec un cours.</div>
            </div>
        );

        return (
            <div>
                <div style={{ marginBottom:'24px' }}>
                    <div style={{ fontFamily:'sans-serif', fontSize:'24px', fontWeight:'900', color:'#1A1040' }}>Bonjour{user?.prenom ? `, ${user.prenom}` : ''} 👋</div>
                    <div style={{ fontSize:'14px', color:'#9CA3AF', marginTop:'4px' }}>Choisissez un cours pour continuer votre apprentissage</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'20px' }}>
                    {courses.map((course, idx) => {
                        const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];
                        const prog     = courseProgress(course);
                        const modules  = course.modules || [];
                        const totalLessons = modules.reduce((a, m) => a + (m.chapters||[]).length, 0);

                        return (
                            <div key={course.id} style={{ background:'#fff', borderRadius:'20px', overflow:'hidden', border:'1px solid #E5E7EB', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', transition:'transform 0.15s' }}
                                 onClick={() => openCourse(course)}
                                 onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                                 onMouseLeave={e => e.currentTarget.style.transform='none'}>

                                {/* ✅ BANNIÈRE — image via balise img */}
                                <div style={{ height:'120px', background:`linear-gradient(135deg,${c1},${c2})`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    {/* Image de couverture — fonctionne avec base64 ET https */}
                                    {course.coverImage && (
                                        <img
                                            src={course.coverImage}
                                            alt=""
                                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                                            onError={e => e.target.style.display='none'}
                                        />
                                    )}
                                    {/* Overlay sombre si image présente */}
                                    {course.coverImage && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)' }}/>}
                                    {/* Emoji si pas d'image */}
                                    {!course.coverImage && <div style={{ fontSize:'40px' }}>📚</div>}
                                    {prog.pct === 100 && (
                                        <div style={{ position:'absolute', top:'10px', right:'10px', zIndex:2, display:'flex', alignItems:'center', gap:'4px', background:'rgba(0,0,0,0.25)', color:'#fff', fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'50px' }}>
                                            ✅ Complété
                                        </div>
                                    )}
                                </div>

                                {/* Infos */}
                                <div style={{ padding:'18px' }}>
                                    <div style={{ fontFamily:'sans-serif', fontSize:'16px', fontWeight:'800', color:'#1A1040', marginBottom:'4px' }}>{course.titre}</div>
                                    {course.niveau && <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'10px' }}>{course.niveau}</div>}

                                    <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'700', color:'#5B2EE8', background:'#EDE8FF', padding:'3px 9px', borderRadius:'50px' }}>
                                            <Ic name="layers" size={10} color="#5B2EE8"/> {modules.length} module{modules.length>1?'s':''}
                                        </span>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'700', color:'#5B2EE8', background:'#EDE8FF', padding:'3px 9px', borderRadius:'50px' }}>
                                            <Ic name="book" size={10} color="#5B2EE8"/> {totalLessons} leçon{totalLessons>1?'s':''}
                                        </span>
                                    </div>

                                    <div style={{ marginBottom:'14px' }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                                            <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'600' }}>Progression</span>
                                            <span style={{ fontSize:'12px', fontWeight:'800', color:prog.pct===100?'#059669':'#5B2EE8' }}>{prog.pct}%</span>
                                        </div>
                                        <div style={{ height:'6px', background:'#F3F4F6', borderRadius:'50px', overflow:'hidden' }}>
                                            <div style={{ width:`${prog.pct}%`, height:'100%', background:prog.pct===100?'#059669':`linear-gradient(90deg,${c1},${c2})`, borderRadius:'50px', transition:'width 0.5s' }}/>
                                        </div>
                                        <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>{prog.done}/{prog.total} leçons complétées</div>
                                    </div>

                                    <button style={{ ...s.btnPri, width:'100%', justifyContent:'center', background:`linear-gradient(135deg,${c1},${c2})` }}>
                                        {prog.done===0?'Commencer':prog.pct===100?'Revoir':'Continuer'} →
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
    // VUE MODULES + LEÇONS
    // ════════════════════════════════════════════════════════
    if (view === 'modules') {
        const modules = selCourse?.modules || [];

        return (
            <div style={s.layout}>
                <div style={s.sidebar}>
                    {/* Sélecteur de cours */}
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid #F3F4F6' }}>
                        <div style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px' }}>Cours</div>
                        <select style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#1A1040', background:'#F8F6FF', outline:'none', fontFamily:'inherit', cursor:'pointer' }}
                                value={selCourse?.id}
                                onChange={e => { const c = courses.find(c => c.id === parseInt(e.target.value)); if (c) openCourse(c); }}>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                        </select>
                    </div>

                    {/* Progression globale */}
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid #F3F4F6' }}>
                        {(() => {
                            const prog = courseProgress(selCourse);
                            return (
                                <>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                                        <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'600' }}>Progression globale</span>
                                        <span style={{ fontSize:'12px', fontWeight:'800', color:'#5B2EE8' }}>{prog.pct}%</span>
                                    </div>
                                    <div style={{ height:'5px', background:'#F3F4F6', borderRadius:'50px', overflow:'hidden' }}>
                                        <div style={{ width:`${prog.pct}%`, height:'100%', background:'linear-gradient(90deg,#5B2EE8,#8B5CF6)', borderRadius:'50px' }}/>
                                    </div>
                                    <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>{prog.done}/{prog.total} leçons</div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Bouton retour */}
                    <div style={{ padding:'10px 14px', borderBottom:'1px solid #F3F4F6' }}>
                        <button style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#F5F2FF', border:'1px solid #EDE8FF', borderRadius:'8px', color:'#5B2EE8', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}
                                onClick={() => { setView('home'); setSelCourse(null); setSelModule(null); }}>
                            <Ic name="back" size={13} color="#5B2EE8"/> Mes cours
                        </button>
                    </div>

                    {/* Liste modules */}
                    <div style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.8px', padding:'10px 16px 4px' }}>Modules</div>
                    <div style={{ flex:1, overflowY:'auto', padding:'4px 10px 20px', display:'flex', flexDirection:'column', gap:'2px' }}>
                        {modules.map((mod, idx) => {
                            const lessons    = mod.chapters || [];
                            const modDone    = lessons.filter(l => getLessonProg(l.id)?.pct === 100).length;
                            const modPct     = lessons.length > 0 ? Math.round((modDone / lessons.length) * 100) : 0;
                            const isSelected = selModule?.id === mod.id;

                            return (
                                <div key={mod.id}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 10px', borderRadius:'10px', cursor:'pointer', background:isSelected?'#F5F2FF':'transparent', border:`1px solid ${isSelected?'#EDE8FF':'transparent'}`, transition:'all 0.15s' }}
                                         onClick={() => setSelModule(isSelected ? null : mod)}>
                                        <Ring pct={modPct} size={36} stroke={3} color={modPct===100?'#059669':'#5B2EE8'} track={isSelected?'rgba(91,46,232,0.15)':'#E9E4FF'}>
                                            {modPct===100
                                                ? <Ic name="check" size={12} color="#059669" sw={2.5}/>
                                                : <span style={{ fontSize:'11px', fontWeight:'800', color:isSelected?'#5B2EE8':'#6B7280' }}>{idx+1}</span>
                                            }
                                        </Ring>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:'13px', fontWeight:isSelected?'700':'500', color:isSelected?'#5B2EE8':'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mod.titre}</div>
                                            <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>{modDone}/{lessons.length} leçon{lessons.length>1?'s':''}</div>
                                        </div>
                                        <Ic name="chevron" size={13} color={isSelected?'#5B2EE8':'#9CA3AF'}/>
                                    </div>

                                    {isSelected && lessons.map((lesson, li) => {
                                        const lp  = getLessonProg(lesson.id);
                                        const pct = lp?.pct || 0;
                                        return (
                                            <div key={lesson.id}
                                                 style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px 7px 20px', borderRadius:'8px', cursor:'pointer', marginLeft:'4px', borderLeft:'2px solid #EDE8FF' }}
                                                 onClick={() => openLesson(lesson)}>
                                                <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:pct===100?'#059669':pct>0?'#5B2EE8':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    {pct===100
                                                        ? <Ic name="check" size={11} color="#fff" sw={2.5}/>
                                                        : <span style={{ fontSize:'10px', fontWeight:'800', color:pct>0?'#fff':'#9CA3AF' }}>{li+1}</span>
                                                    }
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:'12px', fontWeight:'600', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lesson.titre}</div>
                                                    {pct > 0 && pct < 100 && (
                                                        <div style={{ height:'2px', background:'#F3F4F6', borderRadius:'50px', marginTop:'4px', overflow:'hidden' }}>
                                                            <div style={{ width:`${pct}%`, height:'100%', background:'#5B2EE8', borderRadius:'50px' }}/>
                                                        </div>
                                                    )}
                                                </div>
                                                {pct > 0 && <span style={{ fontSize:'10px', fontWeight:'700', color:pct===100?'#059669':'#5B2EE8' }}>{pct}%</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CONTENU PRINCIPAL */}
                <div style={s.main}>
                    {!selModule ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70%', gap:'12px' }}>
                            <Ic name="layers" size={48} color="#C4B5FD"/>
                            <div style={{ fontWeight:'700', color:'#6B7280' }}>Sélectionnez un module dans la sidebar</div>
                        </div>
                    ) : (
                        <>
                            <div style={s.mainHeader}>
                                <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{selCourse?.titre}</div>
                                <h1 style={s.mainTitle}>{selModule.titre}</h1>
                                {selModule.description && <div style={{ fontSize:'14px', color:'#6B7280', lineHeight:1.6, marginTop:'4px' }}>{selModule.description}</div>}
                            </div>

                            <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'16px' }}>
                                {(selModule.chapters||[]).map((lesson, li) => {
                                    const lp  = getLessonProg(lesson.id);
                                    const pct = lp?.pct || 0;
                                    return (
                                        <div key={lesson.id} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'14px', padding:'18px', cursor:'pointer', transition:'all 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
                                             onClick={() => openLesson(lesson)}
                                             onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(91,46,232,0.12)'; }}
                                             onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'; }}>
                                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                                                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:pct===100?'#059669':pct>0?'#5B2EE8':'#EDE8FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    {pct===100
                                                        ? <Ic name="check" size={18} color="#fff" sw={2.5}/>
                                                        : <span style={{ fontSize:'15px', fontWeight:'800', color:pct>0?'#fff':'#5B2EE8' }}>{li+1}</span>
                                                    }
                                                </div>
                                                <span style={{ fontSize:'11px', fontWeight:'800', color:pct===100?'#059669':pct>0?'#5B2EE8':'#9CA3AF' }}>{pct}%</span>
                                            </div>
                                            <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A1040', marginBottom:'8px', lineHeight:1.3 }}>{lesson.titre}</div>
                                            <div style={{ height:'4px', background:'#F3F4F6', borderRadius:'50px', overflow:'hidden' }}>
                                                <div style={{ width:`${pct}%`, height:'100%', background:pct===100?'#059669':'#5B2EE8', borderRadius:'50px' }}/>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // VUE LEÇON
    // ════════════════════════════════════════════════════════
    if (view === 'lesson' && selLesson) {
        const lesson  = selLesson;
        const lp      = getLessonProg(lesson.id);
        const hasQuiz = (lesson.quizQuestions||[]).length > 0;
        const prog    = lp?.progress || {};

        const ELEMENTS_DISPLAY = [
            lesson.objectives       && { key:'objectives', label:'Objectifs', icon:'target',  color:'#8B5CF6', bg:'#EDE9FE', done:prog.objectivesDone },
            lesson.studentSlidesUrl && { key:'slides',     label:'Slides',    icon:'slide',   color:'#5B2EE8', bg:'#EDE8FF', done:prog.slidesDone },
            lesson.imageUrl         && { key:'images',     label:'Image',     icon:'image',   color:'#059669', bg:'#ECFDF5', done:prog.imagesDone },
            hasQuiz                 && { key:'quiz',       label:'Quiz',      icon:'qcm',     color:'#D97706', bg:'#FFFBEB', done:prog.quizSoumis },
            lesson.challengeContent && { key:'challenge',  label:'Challenge', icon:'code',    color:'#DC2626', bg:'#FEF2F2', done:prog.challengeDone },
        ].filter(Boolean);

        return (
            <div style={s.layout}>
                <div style={s.sidebar}>
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid #F3F4F6' }}>
                        <button style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#F5F2FF', border:'1px solid #EDE8FF', borderRadius:'8px', color:'#5B2EE8', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}
                                onClick={() => setView('modules')}>
                            <Ic name="back" size={13} color="#5B2EE8"/> {selModule?.titre}
                        </button>
                    </div>

                    <div style={{ padding:'14px 16px', borderBottom:'1px solid #F3F4F6' }}>
                        <div style={{ fontFamily:'sans-serif', fontSize:'14px', fontWeight:'800', color:'#1A1040', marginBottom:'10px', lineHeight:1.3 }}>{lesson.titre}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                            <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'600' }}>Progression</span>
                            <span style={{ fontSize:'12px', fontWeight:'800', color:'#5B2EE8' }}>{lp?.pct||0}%</span>
                        </div>
                        <div style={{ height:'6px', background:'#F3F4F6', borderRadius:'50px', overflow:'hidden' }}>
                            <div style={{ width:`${lp?.pct||0}%`, height:'100%', background:'linear-gradient(90deg,#5B2EE8,#8B5CF6)', borderRadius:'50px', transition:'width 0.5s' }}/>
                        </div>
                        <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'4px' }}>{lp?.done||0}/{lp?.total||0} éléments complétés</div>
                    </div>

                    <div style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.8px', padding:'10px 16px 4px' }}>Éléments</div>
                    <div style={{ flex:1, padding:'4px 10px 20px', display:'flex', flexDirection:'column', gap:'2px' }}>
                        {ELEMENTS_DISPLAY.map(el => (
                            <div key={el.key} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', background:el.done?'#ECFDF5':'transparent', border:`1px solid ${el.done?'#A7F3D0':'transparent'}` }}>
                                <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:el.done?'#059669':el.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <Ic name={el.done?'check':el.icon} size={12} color={el.done?'#fff':el.color}/>
                                </div>
                                <span style={{ fontSize:'12px', fontWeight:'600', color:el.done?'#059669':'#374151', flex:1 }}>{el.label}</span>
                                {el.done && <span style={{ fontSize:'10px', color:'#059669', fontWeight:'700' }}>✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={s.main}>
                    <div style={s.mainHeader}>
                        <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{selModule?.titre}</div>
                        <h1 style={s.mainTitle}>{lesson.titre}</h1>
                    </div>

                    <div style={{ padding:'24px 32px', display:'flex', flexDirection:'column', gap:'20px' }}>

                        {/* Objectifs */}
                        {lesson.objectives && (
                            <div style={{ background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:'14px', padding:'20px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                                    <div style={{ width:'32px', height:'32px', background:'#8B5CF6', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Ic name="target" size={16} color="#fff"/>
                                    </div>
                                    <div style={{ fontFamily:'sans-serif', fontSize:'15px', fontWeight:'800', color:'#5B21B6' }}>Objectifs</div>
                                </div>
                                <div style={{ fontSize:'14px', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{lesson.objectives}</div>
                                {!prog.objectivesDone && (
                                    <button style={{ ...s.btnSec, marginTop:'12px', borderColor:'#C4B5FD', color:'#7C3AED' }} onClick={() => markDone('objectives')}>
                                        <Ic name="check" size={13} color="#7C3AED"/> Marquer comme lu
                                    </button>
                                )}
                                {prog.objectivesDone && <div style={{ marginTop:'8px', fontSize:'12px', color:'#059669', fontWeight:'700', display:'flex', alignItems:'center', gap:'4px' }}><Ic name="check" size={12} color="#059669"/> Lu ✓</div>}
                            </div>
                        )}

                        {/* Image */}
                        {lesson.imageUrl && (
                            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'14px', overflow:'hidden' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'14px 18px', borderBottom:'1px solid #E5E7EB' }}>
                                    <div style={{ width:'30px', height:'30px', background:'#ECFDF5', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Ic name="image" size={15} color="#059669"/>
                                    </div>
                                    <div style={{ fontFamily:'sans-serif', fontSize:'14px', fontWeight:'700', color:'#1A1040' }}>Image</div>
                                </div>
                                <img src={lesson.imageUrl} alt="leçon" style={{ width:'100%', maxHeight:'400px', objectFit:'contain', background:'#F9FAFB' }}
                                     onLoad={() => !prog.imagesDone && markDone('images')}
                                     onError={e => e.target.style.display='none'}/>
                            </div>
                        )}

                        {/* Slides */}
                        {lesson.studentSlidesUrl && (
                            <div style={{ background:'#F5F2FF', border:'1px solid #C4B5FD', borderRadius:'14px', padding:'20px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                                    <div style={{ width:'32px', height:'32px', background:'#5B2EE8', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Ic name="slide" size={16} color="#fff"/>
                                    </div>
                                    <div style={{ fontFamily:'sans-serif', fontSize:'15px', fontWeight:'800', color:'#1A1040' }}>Slides du cours</div>
                                </div>
                                <button style={s.btnPri} onClick={() => setView('slide')}>
                                    <Ic name="play" size={14} color="#fff"/> Ouvrir les slides
                                </button>
                                {prog.slidesDone && <span style={{ marginLeft:'10px', fontSize:'12px', color:'#059669', fontWeight:'700' }}>✅ Vus</span>}
                            </div>
                        )}

                        {/* Quiz */}
                        {hasQuiz && (
                            <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'14px', padding:'20px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                                    <div style={{ width:'32px', height:'32px', background:'#D97706', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Ic name="qcm" size={16} color="#fff"/>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily:'sans-serif', fontSize:'15px', fontWeight:'800', color:'#1A1040' }}>Quiz</div>
                                        <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{(lesson.quizQuestions||[]).length} question{(lesson.quizQuestions||[]).length>1?'s':''}</div>
                                    </div>
                                    {prog.quizSoumis && <span style={{ marginLeft:'auto', fontSize:'12px', color:'#059669', fontWeight:'700', background:'#ECFDF5', padding:'3px 10px', borderRadius:'50px' }}>✅ Score : {lp?.progress?.quizScore}/20</span>}
                                </div>
                                <button style={{ ...s.btnPri, background:prog.quizSoumis?'#059669':'#D97706' }} onClick={openQuiz}>
                                    <Ic name="qcm" size={14} color="#fff"/> {prog.quizSoumis ? 'Revoir le quiz' : 'Commencer le quiz'}
                                </button>
                            </div>
                        )}

                        {/* Challenge */}
                        {lesson.challengeContent && (
                            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'14px', padding:'20px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                                    <div style={{ width:'32px', height:'32px', background:'#DC2626', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Ic name="code" size={16} color="#fff"/>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily:'sans-serif', fontSize:'15px', fontWeight:'800', color:'#1A1040' }}>Challenge</div>
                                        <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{(LANG_CFG[lesson.challengeLang]||LANG_CFG.python).label}</div>
                                    </div>
                                    {prog.challengeDone && <span style={{ marginLeft:'auto', fontSize:'12px', color:'#059669', fontWeight:'700' }}>✅ Fait</span>}
                                </div>
                                <button style={{ ...s.btnPri, background:'#DC2626' }} onClick={() => setView('challenge')}>
                                    <Ic name="code" size={14} color="#fff"/> Voir le challenge
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

const s = {
    layout:    { display:'flex', height:'calc(100vh - 100px)', margin:'-24px', overflow:'hidden', background:'#F7F7FB' },
    sidebar:   { width:'280px', background:'#fff', flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid #EBEBF0', overflowY:'auto' },
    main:      { flex:1, overflowY:'auto', background:'#fff' },
    mainHeader:{ padding:'28px 32px 18px', borderBottom:'1px solid #F3F4F6' },
    mainTitle: { fontFamily:'sans-serif', fontSize:'24px', fontWeight:'900', color:'#1A1040', margin:0, letterSpacing:'-0.3px' },
    fs:        { position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', background:'#fff' },
    fsBar:     { height:'56px', background:'#fff', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:'14px', padding:'0 20px', flexShrink:0 },
    fsBack:    { display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'#F5F2FF', border:'1px solid #EDE8FF', borderRadius:'9px', color:'#5B2EE8', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    btnPri:    { display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px', background:'#5B2EE8', border:'none', borderRadius:'10px', color:'#fff', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    btnSec:    { display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 16px', background:'transparent', border:'1.5px solid #E5E7EB', borderRadius:'9px', color:'#374151', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
};