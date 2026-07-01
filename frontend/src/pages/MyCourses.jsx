import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Icônes ─────────────────────────────────────────────────
const Ic = ({ name, size = 16, color = 'currentColor' }) => {
    const a = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' };
    const icons = {
        plus:    <svg {...a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        edit:    <svg {...a}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        trash:   <svg {...a}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
        book:    <svg {...a}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        layers:  <svg {...a}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
        file:    <svg {...a}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
        target:  <svg {...a}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
        slide:   <svg {...a}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        image:   <svg {...a}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        qcm:     <svg {...a}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        code:    <svg {...a}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        teacher: <svg {...a}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6M19 8v6"/></svg>,
        save:    <svg {...a}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        link:    <svg {...a}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
        back:    <svg {...a}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        check:   <svg {...a} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        group:   <svg {...a}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    };
    return icons[name] ? <span style={{ display:'inline-flex', alignItems:'center', flexShrink:0 }}>{icons[name]}</span> : null;
};

// ── Toast ──────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
    <div style={{ position:'fixed', top:'70px', right:'20px', zIndex:999, padding:'12px 20px', borderRadius:'10px', background:type==='error'?'#FEF2F2':'#ECFDF5', border:`1px solid ${type==='error'?'#FECACA':'#A7F3D0'}`, color:type==='error'?'#DC2626':'#059669', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:'8px' }}>
        {type==='error'?'❌':'✅'} {msg}
    </div>
);

// ── Helpers ────────────────────────────────────────────────
const Inp = (props) => <input {...props} style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'13px', color:'#111827', outline:'none', background:'#fff', fontFamily:'inherit', width:'100%', boxSizing:'border-box', ...props.style }}/>;
const Txt = (props) => <textarea {...props} style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'13px', color:'#111827', outline:'none', background:'#fff', fontFamily:'inherit', resize:'vertical', minHeight:'80px', width:'100%', boxSizing:'border-box', ...props.style }}/>;

// Éléments badge pour une leçon
const ELEMENTS = [
    { key:'objectives',    label:'Objectifs',  icon:'target',  color:'#8B5CF6', bg:'#EDE9FE' },
    { key:'teacherGuide',  label:'Guide Prof', icon:'teacher', color:'#0284C7', bg:'#E0F2FE' },
    { key:'studentSlides', label:'Slides',     icon:'slide',   color:'#5B2EE8', bg:'#EDE8FF' },
    { key:'image',         label:'Image',      icon:'image',   color:'#059669', bg:'#ECFDF5' },
    { key:'quiz',          label:'Quiz',       icon:'qcm',     color:'#D97706', bg:'#FFFBEB' },
    { key:'challenge',     label:'Challenge',  icon:'code',    color:'#DC2626', bg:'#FEF2F2' },
];

const hasElement = (lesson, key) => {
    if (key === 'objectives')    return !!lesson.objectives;
    if (key === 'teacherGuide')  return !!lesson.teacherGuideUrl;
    if (key === 'studentSlides') return !!lesson.studentSlidesUrl;
    if (key === 'image')         return !!lesson.imageUrl;
    if (key === 'challenge')     return !!lesson.challengeContent;
    if (key === 'quiz')          return (lesson.quizQuestions||[]).length > 0;
    return false;
};

// GroupSelector — hors composant pour éviter bug curseur
const GroupSelector = ({ selectedIds, onChange, groups }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'180px', overflowY:'auto', border:'1.5px solid #E5E7EB', borderRadius:'8px', padding:'8px', background:'#F9FAFB' }}>
        {groups.length === 0 && <div style={{ color:'#9CA3AF', fontSize:'13px', padding:'8px' }}>Aucun groupe disponible</div>}
        {groups.map(g => (
            <div key={g.id}
                 style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', border: selectedIds.includes(g.id)?'1.5px solid #5B2EE8':'1.5px solid transparent', background: selectedIds.includes(g.id)?'#F5F2FF':'#fff', transition:'all 0.1s' }}
                 onClick={() => {
                     const ids = selectedIds.includes(g.id)
                         ? selectedIds.filter(id => id !== g.id)
                         : [...selectedIds, g.id];
                     onChange(ids);
                 }}>
                <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:`2px solid ${selectedIds.includes(g.id)?'#5B2EE8':'#D1D5DB'}`, background:selectedIds.includes(g.id)?'#5B2EE8':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {selectedIds.includes(g.id) && <Ic name="check" size={11} color="#fff"/>}
                </div>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'#1A1040' }}>{g.titre}</span>
                {g.ville && <span style={{ fontSize:'11px', color: g.ville==='Metz'?'#1D4ED8':'#166534', background: g.ville==='Metz'?'#EFF6FF':'#F0FDF4', padding:'1px 6px', borderRadius:'4px', fontWeight:'700', marginLeft:'auto' }}>{g.ville}</span>}
            </div>
        ))}
    </div>
);

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function MyCourses() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'ADMIN';

    const [courses, setCourses]   = useState([]);
    const [groups,  setGroups]    = useState([]);
    const [loading, setLoading]   = useState(true);
    const [saving,  setSaving]    = useState(false);
    const [toast,   setToast]     = useState(null);

    // Navigation
    const [view,      setView]      = useState('courses');
    const [selCourse, setSelCourse] = useState(null);
    const [selModule, setSelModule] = useState(null);
    const [selLesson, setSelLesson] = useState(null);

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizModal,   setShowQuizModal]   = useState(false);
    const [editingCourse,   setEditingCourse]   = useState(null);
    const [editingModule,   setEditingModule]   = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);

    // Forms
    const emptyCourse = { titre:'', description:'', niveau:'', coverImage:'', groupIds:[] };
    const [courseForm, setCourseForm] = useState(emptyCourse);
    const [moduleForm, setModuleForm] = useState({ titre:'', description:'' });
    const [lessonForm, setLessonForm] = useState({
        titre:'', objectives:'', teacherGuideUrl:'', studentSlidesUrl:'',
        imageUrl:'', challengeContent:'', challengeLang:'python',
    });
    const [quizForm, setQuizForm] = useState({ question:'', options:['','','',''], correct:0 });

    useEffect(() => { fetchAll(); }, []);

    const showToast = (msg, type='success') => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, gRes] = await Promise.all([
                api.get('/courses'),
                api.get('/groups'),
            ]);
            setCourses(cRes.data);
            setGroups(gRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // ── Fetch modules / leçons ────────────────────────────
    const fetchModules = async (courseId) => {
        try { const r = await api.get(`/lessons/courses/${courseId}/modules`); return r.data; }
        catch { return []; }
    };

    const fetchLessons = async (moduleId) => {
        try { const r = await api.get(`/lessons/modules/${moduleId}/lessons`); return r.data; }
        catch { return []; }
    };

    const refreshCourse = async () => {
        if (!selCourse) return;
        const modules = await fetchModules(selCourse.id);
        setSelCourse(prev => ({...prev, modules}));
        if (selModule) {
            const updated = modules.find(m => m.id === selModule.id);
            if (updated) setSelModule(updated);
        }
    };

    // ── Ouvrir cours / module / leçon ─────────────────────
    const openCourse = async (course) => {
        setLoading(true);
        const modules = await fetchModules(course.id);
        setSelCourse({...course, modules});
        setSelModule(null); setSelLesson(null);
        setView('modules');
        setLoading(false);
    };

    const openModule = async (mod) => {
        setLoading(true);
        const lessons = await fetchLessons(mod.id);
        setSelModule({...mod, chapters:lessons});
        setSelLesson(null);
        setView('lessons');
        setLoading(false);
    };

    const openLesson = async (lesson) => {
        try {
            const r = await api.get(`/lessons/lessons/${lesson.id}`);
            setSelLesson(r.data);
            setLessonForm({
                titre:            r.data.titre            || '',
                objectives:       r.data.objectives       || '',
                teacherGuideUrl:  r.data.teacherGuideUrl  || '',
                studentSlidesUrl: r.data.studentSlidesUrl || '',
                imageUrl:         r.data.imageUrl         || '',
                challengeContent: r.data.challengeContent || '',
                challengeLang:    r.data.challengeLang    || 'python',
            });
            setView('lesson-edit');
        } catch { showToast('Erreur chargement leçon','error'); }
    };

    // ════════════════════════════════════════════════════════
    // CRUD COURS
    // ════════════════════════════════════════════════════════
    const saveCourse = async () => {
        if (!courseForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (editingCourse) {
                await api.put(`/courses/${editingCourse.id}`, courseForm);
                showToast('Cours modifié !');
            } else {
                await api.post('/courses', courseForm);
                showToast('Cours créé !');
            }
            setShowCourseModal(false);
            setEditingCourse(null);
            setCourseForm(emptyCourse);
            fetchAll();
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try { await api.delete(`/courses/${id}`); fetchAll(); showToast('Cours supprimé'); }
        catch { showToast('Erreur suppression','error'); }
    };

    // ════════════════════════════════════════════════════════
    // CRUD MODULES
    // ════════════════════════════════════════════════════════
    const saveModule = async () => {
        if (!moduleForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (editingModule) {
                await api.put(`/lessons/modules/${editingModule.id}`, moduleForm);
                showToast('Module modifié !');
            } else {
                await api.post(`/lessons/courses/${selCourse.id}/modules`, moduleForm);
                showToast('Module créé !');
            }
            setShowModuleModal(false);
            setEditingModule(null);
            setModuleForm({ titre:'', description:'' });
            await refreshCourse();
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };

    const deleteModule = async (id) => {
        if (!window.confirm('Supprimer ce module et toutes ses leçons ?')) return;
        try {
            await api.delete(`/lessons/modules/${id}`);
            await refreshCourse();
            if (selModule?.id === id) { setSelModule(null); setView('modules'); }
            showToast('Module supprimé');
        } catch { showToast('Erreur','error'); }
    };

    // ════════════════════════════════════════════════════════
    // CRUD LEÇONS
    // ════════════════════════════════════════════════════════
    const saveLesson = async () => {
        if (!lessonForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (selLesson && view === 'lesson-edit') {
                await api.put(`/lessons/lessons/${selLesson.id}`, lessonForm);
                const r = await api.get(`/lessons/lessons/${selLesson.id}`);
                setSelLesson(r.data);
                showToast('Leçon sauvegardée !');
            } else {
                await api.post(`/lessons/modules/${selModule.id}/lessons`, {
                    ...lessonForm, courseId: selCourse.id,
                });
                showToast('Leçon créée !');
                setShowLessonModal(false);
                setLessonForm({ titre:'', objectives:'', teacherGuideUrl:'', studentSlidesUrl:'', imageUrl:'', challengeContent:'', challengeLang:'python' });
            }
            if (selModule) await openModule(selModule);
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };

    const deleteLesson = async (id) => {
        if (!window.confirm('Supprimer cette leçon ?')) return;
        try {
            await api.delete(`/lessons/lessons/${id}`);
            if (selModule) await openModule(selModule);
            if (selLesson?.id === id) { setSelLesson(null); setView('lessons'); }
            showToast('Leçon supprimée');
        } catch { showToast('Erreur','error'); }
    };

    // ════════════════════════════════════════════════════════
    // CRUD QUIZ
    // ════════════════════════════════════════════════════════
    const saveQuestion = async () => {
        if (!quizForm.question || quizForm.options.some(o => !o)) return alert('Remplissez tous les champs');
        setSaving(true);
        try {
            if (editingQuestion) {
                await api.put(`/lessons/quiz/${editingQuestion.id}`, quizForm);
                showToast('Question modifiée !');
            } else {
                await api.post(`/lessons/lessons/${selLesson.id}/quiz`, quizForm);
                showToast('Question ajoutée !');
            }
            setShowQuizModal(false);
            setEditingQuestion(null);
            setQuizForm({ question:'', options:['','','',''], correct:0 });
            const r = await api.get(`/lessons/lessons/${selLesson.id}`);
            setSelLesson(r.data);
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };

    const deleteQuestion = async (id) => {
        if (!window.confirm('Supprimer cette question ?')) return;
        try {
            await api.delete(`/lessons/quiz/${id}`);
            const r = await api.get(`/lessons/lessons/${selLesson.id}`);
            setSelLesson(r.data);
            showToast('Question supprimée');
        } catch { showToast('Erreur','error'); }
    };

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    const GRADIENTS = [
        ['#5B2EE8','#8B5CF6'], ['#0284C7','#38BDF8'], ['#059669','#34D399'],
        ['#DC2626','#F87171'], ['#D97706','#FCD34D'], ['#7C3AED','#A78BFA'],
    ];

    return (
        <div style={{ position:'relative' }}>
            {toast && <Toast {...toast}/>}

            {/* ════ VUE COURS ════ */}
            {view === 'courses' && (
                <div>
                    <div style={s.ph}>
                        <h1 style={s.h1}>📚 {isAdmin ? 'Tous les cours' : 'Mes Cours'}</h1>
                        <button style={s.btnPri} onClick={() => { setCourseForm(emptyCourse); setEditingCourse(null); setShowCourseModal(true); }}>
                            <Ic name="plus" size={13} color="#fff"/> Nouveau cours
                        </button>
                    </div>

                    {loading ? <div style={s.empty}>Chargement...</div>
                        : courses.length === 0 ? (
                            <div style={s.emptyState}>
                                <div style={s.emptyIco}><Ic name="book" size={36} color="#9CA3AF"/></div>
                                <div style={s.emptyTitle}>Aucun cours</div>
                                <div style={{ fontSize:'13px', color:'#9CA3AF' }}>Créez votre premier cours</div>
                            </div>
                        ) : (
                            <div style={s.courseGrid}>
                                {courses.map((c, idx) => {
                                    const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];
                                    const assignedGroups = c.courseGroups || [];
                                    return (
                                        <div key={c.id} style={s.courseCard}>
                                            {/* ── Bannière avec image de couverture ── */}
                                            <div style={{
                                                height:'130px',
                                                background: `linear-gradient(135deg,${c1},${c2})`,
                                                position:'relative',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                overflow:'hidden',
                                            }}>
                                                {/* ✅ Image via balise img (fonctionne avec base64 ET https) */}
                                                {c.coverImage && (
                                                    <img
                                                        src={c.coverImage}
                                                        alt=""
                                                        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                                                        onError={e => e.target.style.display='none'}
                                                    />
                                                )}
                                                {c.coverImage && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)' }}/>}

                                                {/* Titre sur la bannière */}
                                                <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 12px' }}>
                                                    <div style={{ fontFamily:'sans-serif', fontSize:'17px', fontWeight:'900', color:'#fff', lineHeight:1.3, textShadow:'0 1px 4px rgba(0,0,0,0.3)' }}>{c.titre}</div>
                                                    {c.niveau && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', marginTop:'3px', fontWeight:'600' }}>{c.niveau}</div>}
                                                </div>

                                                {/* Boutons edit/delete */}
                                                <div style={{ position:'absolute', top:'8px', right:'8px', display:'flex', gap:'4px', zIndex:2 }}>
                                                    <button style={s.iconBtn} onClick={() => {
                                                        setCourseForm({ titre:c.titre, description:c.description||'', niveau:c.niveau||'', coverImage:c.coverImage||'', groupIds:c.courseGroups?.map(cg=>cg.groupId)||[] });
                                                        setEditingCourse(c);
                                                        setShowCourseModal(true);
                                                    }}><Ic name="edit" size={13} color="#fff"/></button>
                                                    <button style={{ ...s.iconBtn, background:'rgba(220,38,38,0.7)' }} onClick={() => deleteCourse(c.id)}>
                                                        <Ic name="trash" size={13} color="#fff"/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ── Corps ── */}
                                            <div style={{ padding:'14px 16px' }}>
                                                {c.description && <div style={{ fontSize:'12px', color:'#6B7280', lineHeight:1.5, marginBottom:'10px' }}>{c.description}</div>}

                                                {/* Groupes assignés */}
                                                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'10px' }}>
                                                    {assignedGroups.length === 0
                                                        ? <span style={{ fontSize:'11px', color:'#9CA3AF', fontStyle:'italic' }}>Aucun groupe assigné</span>
                                                        : assignedGroups.map(cg => (
                                                            <span key={cg.id} style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'11px', fontWeight:'700', color:'#5B2EE8', background:'#EDE8FF', padding:'2px 8px', borderRadius:'50px' }}>
                                                            <Ic name="group" size={9} color="#5B2EE8"/> {cg.group?.titre}
                                                        </span>
                                                        ))
                                                    }
                                                </div>

                                                <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
                                                    <span style={s.pill}><Ic name="layers" size={10} color="#5B2EE8"/> {(c.modules||[]).length} module{(c.modules||[]).length>1?'s':''}</span>
                                                </div>

                                                <button style={{ ...s.btnPri, width:'100%', justifyContent:'center' }} onClick={() => openCourse(c)}>
                                                    <Ic name="layers" size={13} color="#fff"/> Gérer les modules
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            )}

            {/* ════ VUE MODULES ════ */}
            {view === 'modules' && (
                <div>
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#5B2EE8"/> Cours</button>
                        <span style={s.breadSep}>›</span>
                        <span style={s.breadCur}>{selCourse?.titre}</span>
                    </div>
                    <div style={s.ph}>
                        <div>
                            <h1 style={s.h1}>{selCourse?.titre}</h1>
                            {selCourse?.niveau && <div style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'2px' }}>{selCourse.niveau}</div>}
                        </div>
                        <button style={s.btnPri} onClick={() => { setModuleForm({titre:'',description:''}); setEditingModule(null); setShowModuleModal(true); }}>
                            <Ic name="plus" size={13} color="#fff"/> Nouveau module
                        </button>
                    </div>

                    {(selCourse?.modules||[]).length === 0 ? (
                        <div style={s.emptyState}>
                            <div style={s.emptyIco}><Ic name="layers" size={36} color="#9CA3AF"/></div>
                            <div style={s.emptyTitle}>Aucun module</div>
                            <div style={{ fontSize:'13px', color:'#9CA3AF' }}>Ajoutez un module pour organiser vos leçons</div>
                        </div>
                    ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            {(selCourse?.modules||[]).map((mod, idx) => (
                                <div key={mod.id} style={s.moduleCard}>
                                    <div style={s.moduleLeft}>
                                        <div style={s.moduleNum}>{idx+1}</div>
                                        <div style={{ flex:1 }}>
                                            <div style={s.moduleTitle}>{mod.titre}</div>
                                            {mod.description && <div style={s.moduleDesc}>{mod.description}</div>}
                                            <span style={s.pill}><Ic name="file" size={10} color="#5B2EE8"/> {(mod.chapters||[]).length} leçon{(mod.chapters||[]).length>1?'s':''}</span>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                                        <button style={s.aBtn} onClick={() => { setModuleForm({titre:mod.titre,description:mod.description||''}); setEditingModule(mod); setShowModuleModal(true); }}>
                                            <Ic name="edit" size={13} color="#5B2EE8"/>
                                        </button>
                                        <button style={{ ...s.aBtn, background:'#FEF2F2' }} onClick={() => deleteModule(mod.id)}>
                                            <Ic name="trash" size={13} color="#DC2626"/>
                                        </button>
                                        <button style={s.btnPri} onClick={() => openModule(mod)}>
                                            <Ic name="file" size={13} color="#fff"/> Leçons
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE LEÇONS ════ */}
            {view === 'lessons' && (
                <div>
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#5B2EE8"/> Cours</button>
                        <span style={s.breadSep}>›</span>
                        <button style={s.breadBtn} onClick={() => setView('modules')}>{selCourse?.titre}</button>
                        <span style={s.breadSep}>›</span>
                        <span style={s.breadCur}>{selModule?.titre}</span>
                    </div>
                    <div style={s.ph}>
                        <h1 style={s.h1}>{selModule?.titre}</h1>
                        <button style={s.btnPri} onClick={() => { setLessonForm({titre:'',objectives:'',teacherGuideUrl:'',studentSlidesUrl:'',imageUrl:'',challengeContent:'',challengeLang:'python'}); setShowLessonModal(true); }}>
                            <Ic name="plus" size={13} color="#fff"/> Nouvelle leçon
                        </button>
                    </div>

                    {(selModule?.chapters||[]).length === 0 ? (
                        <div style={s.emptyState}>
                            <div style={s.emptyIco}><Ic name="file" size={36} color="#9CA3AF"/></div>
                            <div style={s.emptyTitle}>Aucune leçon</div>
                        </div>
                    ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                            {(selModule?.chapters||[]).map((lesson, idx) => (
                                <div key={lesson.id} style={s.lessonCard}>
                                    <div style={s.lessonLeft}>
                                        <div style={s.lessonNum}>{idx+1}</div>
                                        <div style={{ flex:1 }}>
                                            <div style={s.lessonTitle}>{lesson.titre}</div>
                                            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'6px' }}>
                                                {ELEMENTS.map(el => {
                                                    const has = hasElement(lesson, el.key);
                                                    return (
                                                        <span key={el.key} style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:'700', background:has?el.bg:'#F3F4F6', color:has?el.color:'#D1D5DB', border:`1px solid ${has?el.color+'33':'#E5E7EB'}` }}>
                                                            <Ic name={el.icon} size={9} color={has?el.color:'#D1D5DB'}/> {el.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:'6px' }}>
                                        <button style={{ ...s.aBtn, background:'#FEF2F2' }} onClick={() => deleteLesson(lesson.id)}>
                                            <Ic name="trash" size={13} color="#DC2626"/>
                                        </button>
                                        <button style={s.btnPri} onClick={() => openLesson(lesson)}>
                                            <Ic name="edit" size={13} color="#fff"/> Éditer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE ÉDITION LEÇON ════ */}
            {view === 'lesson-edit' && selLesson && (
                <div>
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#5B2EE8"/> Cours</button>
                        <span style={s.breadSep}>›</span>
                        <button style={s.breadBtn} onClick={() => setView('modules')}>{selCourse?.titre}</button>
                        <span style={s.breadSep}>›</span>
                        <button style={s.breadBtn} onClick={() => setView('lessons')}>{selModule?.titre}</button>
                        <span style={s.breadSep}>›</span>
                        <span style={s.breadCur}>{selLesson.titre}</span>
                    </div>
                    <div style={s.ph}>
                        <h1 style={s.h1}>✏️ {selLesson.titre}</h1>
                        <button style={s.btnPri} onClick={saveLesson} disabled={saving}>
                            <Ic name="save" size={13} color="#fff"/> {saving?'Sauvegarde...':'Sauvegarder'}
                        </button>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

                        {/* Titre */}
                        <div style={{ ...s.card, gridColumn:'1/-1' }}>
                            <div style={s.cardH}><Ic name="file" size={14} color="#5B2EE8"/> Titre de la leçon</div>
                            <Inp value={lessonForm.titre} onChange={e => setLessonForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Leçon 1 — Introduction"/>
                        </div>

                        {/* Objectifs */}
                        <div style={s.card}>
                            <div style={s.cardH}><Ic name="target" size={14} color="#8B5CF6"/> Objectifs <span style={s.opt}>optionnel</span></div>
                            <Txt value={lessonForm.objectives} onChange={e => setLessonForm(f=>({...f,objectives:e.target.value}))} placeholder="À la fin de cette leçon, l'élève saura..."/>
                        </div>

                        {/* Image */}
                        <div style={s.card}>
                            <div style={s.cardH}><Ic name="image" size={14} color="#059669"/> Image illustrative <span style={s.opt}>optionnel</span></div>
                            <Inp value={lessonForm.imageUrl} onChange={e => setLessonForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://..."/>
                            {lessonForm.imageUrl && (
                                <div style={{ marginTop:'8px', borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB' }}>
                                    <img src={lessonForm.imageUrl} alt="preview" style={{ width:'100%', maxHeight:'140px', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                                </div>
                            )}
                        </div>

                        {/* Teacher Guide */}
                        <div style={{ ...s.card, borderColor:'#BAE6FD' }}>
                            <div style={s.cardH}>
                                <Ic name="teacher" size={14} color="#0284C7"/> Guide Professeur
                                <span style={{ fontSize:'10px', fontWeight:'800', color:'#0284C7', background:'#E0F2FE', padding:'2px 6px', borderRadius:'4px' }}>🔒 Prof only</span>
                                <span style={s.opt}>optionnel</span>
                            </div>
                            <Inp value={lessonForm.teacherGuideUrl} onChange={e => setLessonForm(f=>({...f,teacherGuideUrl:e.target.value}))} placeholder="https://docs.google.com/presentation/..."/>
                        </div>

                        {/* Student Slides */}
                        <div style={{ ...s.card, borderColor:'#C4B5FD' }}>
                            <div style={s.cardH}><Ic name="slide" size={14} color="#5B2EE8"/> Slides Élèves <span style={s.opt}>optionnel</span></div>
                            <Inp value={lessonForm.studentSlidesUrl} onChange={e => setLessonForm(f=>({...f,studentSlidesUrl:e.target.value}))} placeholder="https://docs.google.com/presentation/..."/>
                        </div>

                        {/* Challenge */}
                        <div style={{ ...s.card, gridColumn:'1/-1', borderColor:'#FECACA' }}>
                            <div style={s.cardH}><Ic name="code" size={14} color="#DC2626"/> Challenge / Script <span style={s.opt}>optionnel</span></div>
                            <select style={{ ...s.select, marginBottom:'8px', width:'160px' }} value={lessonForm.challengeLang} onChange={e => setLessonForm(f=>({...f,challengeLang:e.target.value}))}>
                                {['python','javascript','html','css','scratch'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                            </select>
                            <Txt value={lessonForm.challengeContent} onChange={e => setLessonForm(f=>({...f,challengeContent:e.target.value}))} placeholder="# Code ici..." style={{ fontFamily:'monospace', fontSize:'13px', minHeight:'120px', background:'#0F172A', color:'#E2E8F0', border:'1px solid #374151' }}/>
                        </div>

                        {/* Quiz */}
                        <div style={{ ...s.card, gridColumn:'1/-1', borderColor:'#FDE68A' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                                <div style={s.cardH}><Ic name="qcm" size={14} color="#D97706"/> Quiz <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:'400' }}>({(selLesson.quizQuestions||[]).length} questions)</span> <span style={s.opt}>optionnel</span></div>
                                <button style={{ ...s.btnSec, borderColor:'#FDE68A', color:'#D97706' }}
                                        onClick={() => { setQuizForm({question:'',options:['','','',''],correct:0}); setEditingQuestion(null); setShowQuizModal(true); }}>
                                    <Ic name="plus" size={13} color="#D97706"/> Ajouter une question
                                </button>
                            </div>

                            {(selLesson.quizQuestions||[]).length === 0 ? (
                                <div style={{ textAlign:'center', padding:'24px', color:'#D1D5DB', fontSize:'13px' }}>
                                    Aucune question — cliquez sur "Ajouter une question"
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                    {(selLesson.quizQuestions||[]).map((q, qi) => (
                                        <div key={q.id} style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'14px' }}>
                                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px' }}>
                                                <div style={{ flex:1 }}>
                                                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#111827', marginBottom:'8px' }}>Q{qi+1}. {q.question}</div>
                                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                                                        {q.options.map((opt, oi) => (
                                                            <div key={oi} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 8px', borderRadius:'6px', background:oi===q.correct?'#ECFDF5':'#fff', border:`1px solid ${oi===q.correct?'#A7F3D0':'#E5E7EB'}` }}>
                                                                <span style={{ width:'18px', height:'18px', borderRadius:'4px', background:oi===q.correct?'#059669':'#E5E7EB', color:oi===q.correct?'#fff':'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'800', flexShrink:0 }}>{['A','B','C','D'][oi]}</span>
                                                                <span style={{ fontSize:'12px', color:oi===q.correct?'#059669':'#374151' }}>{opt}</span>
                                                                {oi===q.correct && <Ic name="check" size={11} color="#059669"/>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                                                    <button style={s.aBtn} onClick={() => { setQuizForm({question:q.question,options:[...q.options],correct:q.correct}); setEditingQuestion(q); setShowQuizModal(true); }}>
                                                        <Ic name="edit" size={13} color="#5B2EE8"/>
                                                    </button>
                                                    <button style={{ ...s.aBtn, background:'#FEF2F2' }} onClick={() => deleteQuestion(q.id)}>
                                                        <Ic name="trash" size={13} color="#DC2626"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL COURS ════ */}
            {showCourseModal && (
                <div style={s.overlay} onClick={() => setShowCourseModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingCourse ? 'Modifier le cours' : 'Nouveau cours'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}>Titre *</label>
                                <Inp value={courseForm.titre} onChange={e => setCourseForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Minecraft Game Design"/>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                    <label style={s.lbl}>Niveau</label>
                                    <Inp value={courseForm.niveau} onChange={e => setCourseForm(f=>({...f,niveau:e.target.value}))} placeholder="ex: 8-12 ans"/>
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                    <label style={s.lbl}>Description</label>
                                    <Inp value={courseForm.description} onChange={e => setCourseForm(f=>({...f,description:e.target.value}))} placeholder="Brève description..."/>
                                </div>
                            </div>

                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}>🖼️ Image de couverture (URL)</label>
                                <Inp value={courseForm.coverImage} onChange={e => setCourseForm(f=>({...f,coverImage:e.target.value}))} placeholder="https://images.unsplash.com/..."/>
                                {courseForm.coverImage && (
                                    <div style={{ borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB', marginTop:'4px' }}>
                                        <img src={courseForm.coverImage} alt="cover preview" style={{ width:'100%', height:'120px', objectFit:'cover' }} onError={e => e.target.style.display='none'}/>
                                    </div>
                                )}
                            </div>

                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}><Ic name="group" size={11} color="#5B2EE8"/> Groupes assignés</label>
                                <GroupSelector
                                    selectedIds={courseForm.groupIds}
                                    onChange={ids => setCourseForm(f => ({...f, groupIds:ids}))}
                                    groups={groups}
                                />
                                {courseForm.groupIds.length > 0 && (
                                    <div style={{ fontSize:'12px', color:'#059669', fontWeight:'600', marginTop:'2px' }}>
                                        ✅ {courseForm.groupIds.length} groupe{courseForm.groupIds.length>1?'s':''} sélectionné{courseForm.groupIds.length>1?'s':''}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={() => setShowCourseModal(false)}>Annuler</button>
                            <button style={s.btnPri} onClick={saveCourse} disabled={saving}>
                                {saving ? 'Sauvegarde...' : editingCourse ? '💾 Modifier' : '✅ Créer le cours'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL MODULE ════ */}
            {showModuleModal && (
                <div style={s.overlay} onClick={() => setShowModuleModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingModule ? 'Modifier le module' : 'Nouveau module'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}>Titre *</label>
                                <Inp value={moduleForm.titre} onChange={e => setModuleForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Module 1 — Crafto Minecraft"/>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}>Description</label>
                                <Txt value={moduleForm.description} onChange={e => setModuleForm(f=>({...f,description:e.target.value}))} placeholder="Description du module..."/>
                            </div>
                        </div>
                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={() => setShowModuleModal(false)}>Annuler</button>
                            <button style={s.btnPri} onClick={saveModule} disabled={saving}>{saving?'Sauvegarde...':'Sauvegarder'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL LEÇON ════ */}
            {showLessonModal && (
                <div style={s.overlay} onClick={() => setShowLessonModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>Nouvelle leçon</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'8px' }}>
                            <label style={s.lbl}>Titre *</label>
                            <Inp value={lessonForm.titre} onChange={e => setLessonForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Leçon 1 — Introduction"/>
                        </div>
                        <p style={{ fontSize:'12px', color:'#9CA3AF' }}>💡 Ajoutez les objectifs, slides, quiz et challenge après création.</p>
                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={() => setShowLessonModal(false)}>Annuler</button>
                            <button style={s.btnPri} onClick={saveLesson} disabled={saving}>{saving?'Création...':'Créer'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL QUIZ ════ */}
            {showQuizModal && (
                <div style={s.overlay} onClick={() => setShowQuizModal(false)}>
                    <div style={{ ...s.modal, maxWidth:'560px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingQuestion ? 'Modifier la question' : 'Nouvelle question'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                                <label style={s.lbl}>Question *</label>
                                <Txt value={quizForm.question} onChange={e => setQuizForm(f=>({...f,question:e.target.value}))} placeholder="Quelle est la bonne réponse ?" style={{ minHeight:'60px' }}/>
                            </div>
                            {['A','B','C','D'].map((letter, oi) => (
                                <div key={oi} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                    <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:quizForm.correct===oi?'#059669':'#E5E7EB', color:quizForm.correct===oi?'#fff':'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', flexShrink:0, cursor:'pointer' }}
                                         onClick={() => setQuizForm(f=>({...f,correct:oi}))}>
                                        {letter}
                                    </div>
                                    <Inp value={quizForm.options[oi]} onChange={e => { const opts=[...quizForm.options]; opts[oi]=e.target.value; setQuizForm(f=>({...f,options:opts})); }} placeholder={`Option ${letter}`} style={{ flex:1, width:'auto', border:quizForm.correct===oi?'1.5px solid #059669':undefined }}/>
                                    {quizForm.correct===oi && <span style={{ fontSize:'11px', color:'#059669', fontWeight:'700', whiteSpace:'nowrap' }}>✓ Bonne réponse</span>}
                                </div>
                            ))}
                            <p style={{ fontSize:'12px', color:'#9CA3AF' }}>💡 Cliquez sur la lettre pour choisir la bonne réponse</p>
                        </div>
                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={() => setShowQuizModal(false)}>Annuler</button>
                            <button style={s.btnPri} onClick={saveQuestion} disabled={saving}>{saving?'Sauvegarde...':'Sauvegarder'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Styles ──────────────────────────────────────────────────
const s = {
    ph:         { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' },
    h1:         { fontFamily:'sans-serif', fontSize:'22px', fontWeight:'800', color:'#1A1040', margin:0 },
    breadcrumb: { display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', fontSize:'13px' },
    breadBtn:   { background:'none', border:'none', color:'#5B2EE8', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', borderRadius:'6px' },
    breadSep:   { color:'#D1D5DB', fontWeight:'700' },
    breadCur:   { color:'#374151', fontWeight:'700' },
    btnPri:     { display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 18px', background:'#5B2EE8', border:'none', borderRadius:'9px', color:'#fff', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', flexShrink:0 },
    btnSec:     { display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 16px', background:'#EDE8FF', border:'1px solid #C4B5FD', borderRadius:'9px', color:'#5B2EE8', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    aBtn:       { width:'30px', height:'30px', borderRadius:'7px', border:'none', background:'#EDE8FF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
    iconBtn:    { width:'28px', height:'28px', borderRadius:'7px', border:'none', background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
    pill:       { display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'700', color:'#5B2EE8', background:'#EDE8FF', padding:'3px 8px', borderRadius:'50px' },
    empty:      { textAlign:'center', padding:'40px', color:'#9CA3AF' },
    emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:'12px' },
    emptyIco:   { width:'72px', height:'72px', background:'#F3F4F6', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center' },
    emptyTitle: { fontFamily:'sans-serif', fontSize:'18px', fontWeight:'800', color:'#1A1040' },
    courseGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'18px' },
    courseCard: { background:'#fff', borderRadius:'16px', overflow:'hidden', border:'1px solid #E5E7EB', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
    moduleCard: { background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
    moduleLeft: { display:'flex', alignItems:'flex-start', gap:'12px', flex:1 },
    moduleNum:  { width:'36px', height:'36px', background:'linear-gradient(135deg,#5B2EE8,#8B5CF6)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#fff', flexShrink:0 },
    moduleTitle:{ fontSize:'15px', fontWeight:'800', color:'#1A1040', marginBottom:'2px' },
    moduleDesc: { fontSize:'12px', color:'#9CA3AF', marginBottom:'4px' },
    lessonCard: { background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' },
    lessonLeft: { display:'flex', alignItems:'flex-start', gap:'10px', flex:1 },
    lessonNum:  { width:'30px', height:'30px', background:'#EDE8FF', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#5B2EE8', flexShrink:0 },
    lessonTitle:{ fontSize:'14px', fontWeight:'700', color:'#1A1040' },
    card:       { background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:'12px', padding:'16px' },
    cardH:      { display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px' },
    opt:        { fontSize:'10px', fontWeight:'600', color:'#9CA3AF', background:'#F3F4F6', padding:'2px 6px', borderRadius:'4px', marginLeft:'auto' },
    select:     { padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'13px', color:'#111827', outline:'none', background:'#fff', fontFamily:'inherit' },
    overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
    modal:      { background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' },
    modalTitle: { fontFamily:'sans-serif', fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 18px' },
    mFoot:      { display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'20px', paddingTop:'16px', borderTop:'1px solid #E5E7EB' },
    lbl:        { fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px' },
};