import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Icons ──────────────────────────────────────────────────
const Ic = ({ name, size = 16, color = 'currentColor' }) => {
    const a = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' };
    const icons = {
        plus:      <svg {...a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        edit:      <svg {...a}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        trash:     <svg {...a}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
        book:      <svg {...a}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        layers:    <svg {...a}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
        file:      <svg {...a}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
        target:    <svg {...a}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
        slide:     <svg {...a}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        image:     <svg {...a}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        qcm:       <svg {...a}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        code:      <svg {...a}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        teacher:   <svg {...a}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6M19 8v6"/></svg>,
        save:      <svg {...a}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        link:      <svg {...a}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
        back:      <svg {...a}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        check:     <svg {...a} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        group:     <svg {...a}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        more:      <svg {...a}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
        chevronR:  <svg {...a}><polyline points="9 18 15 12 9 6"/></svg>,
        chevronD:  <svg {...a}><polyline points="6 9 12 15 18 9"/></svg>,
        lock:      <svg {...a}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    };
    return icons[name] ? <span style={{ display:'inline-flex', alignItems:'center', flexShrink:0 }}>{icons[name]}</span> : null;
};

// ── Toast ──────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
    <div style={{ position:'fixed', top:'20px', right:'20px', zIndex:9999, padding:'14px 20px', borderRadius:'12px', background:type==='error'?'#1A1040':'#1A1040', color:'#fff', fontWeight:'600', fontSize:'13px', boxShadow:'0 8px 32px rgba(0,0,0,0.25)', display:'flex', alignItems:'center', gap:'10px', maxWidth:'320px' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:type==='error'?'#F87171':'#34D399', flexShrink:0 }}/>
        {msg}
    </div>
);

// ── Helpers ────────────────────────────────────────────────
const Inp = (props) => (
    <input {...props} style={{ padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px', color:'#111827', outline:'none', background:'#fff', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color 0.15s', ...props.style }}
           onFocus={e => e.target.style.borderColor='#6C47FF'}
           onBlur={e => e.target.style.borderColor='#E5E7EB'}
    />
);
const Txt = (props) => (
    <textarea {...props} style={{ padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px', color:'#111827', outline:'none', background:'#fff', fontFamily:'inherit', resize:'vertical', minHeight:'90px', width:'100%', boxSizing:'border-box', transition:'border-color 0.15s', ...props.style }}
              onFocus={e => e.target.style.borderColor='#6C47FF'}
              onBlur={e => e.target.style.borderColor='#E5E7EB'}
    />
);

const ELEMENTS = [
    { key:'objectives',    label:'Objectifs',  icon:'target',  color:'#7C3AED', bg:'#EDE9FE' },
    { key:'teacherGuide',  label:'Guide Prof', icon:'teacher', color:'#0369A1', bg:'#E0F2FE' },
    { key:'studentSlides', label:'Slides',     icon:'slide',   color:'#6C47FF', bg:'#EEE9FF' },
    { key:'image',         label:'Image',      icon:'image',   color:'#059669', bg:'#ECFDF5' },
    { key:'quiz',          label:'Quiz',       icon:'qcm',     color:'#B45309', bg:'#FEF3C7' },
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

// GroupSelector — hors composant
const GroupSelector = ({ selectedIds, onChange, groups }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'200px', overflowY:'auto', border:'1.5px solid #E5E7EB', borderRadius:'10px', padding:'6px', background:'#FAFAFA' }}>
        {groups.length === 0 && <div style={{ color:'#9CA3AF', fontSize:'13px', padding:'8px 10px' }}>Aucun groupe</div>}
        {groups.map(g => (
            <div key={g.id}
                 style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', background: selectedIds.includes(g.id)?'#F5F2FF':'#fff', border:`1.5px solid ${selectedIds.includes(g.id)?'#6C47FF':'transparent'}`, transition:'all 0.12s' }}
                 onClick={() => { const ids = selectedIds.includes(g.id) ? selectedIds.filter(id=>id!==g.id) : [...selectedIds,g.id]; onChange(ids); }}>
                <div style={{ width:'18px', height:'18px', borderRadius:'5px', border:`2px solid ${selectedIds.includes(g.id)?'#6C47FF':'#D1D5DB'}`, background:selectedIds.includes(g.id)?'#6C47FF':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.12s' }}>
                    {selectedIds.includes(g.id) && <Ic name="check" size={11} color="#fff"/>}
                </div>
                <span style={{ fontSize:'13px', fontWeight:'500', color:'#111827', flex:1 }}>{g.titre}</span>
                {g.ville && (
                    <span style={{ fontSize:'11px', fontWeight:'700', color:g.ville==='Metz'?'#1D4ED8':'#065F46', background:g.ville==='Metz'?'#DBEAFE':'#D1FAE5', padding:'2px 8px', borderRadius:'50px' }}>{g.ville}</span>
                )}
            </div>
        ))}
    </div>
);

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function MyCourses() {
    const { user }  = useAuth();
    const isAdmin   = user?.role === 'ADMIN';

    const [courses,  setCourses]  = useState([]);
    const [groups,   setGroups]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [toast,    setToast]    = useState(null);
    const [menuOpen, setMenuOpen] = useState(null); // id du cours avec menu ouvert

    const [view,      setView]      = useState('courses');
    const [selCourse, setSelCourse] = useState(null);
    const [selModule, setSelModule] = useState(null);
    const [selLesson, setSelLesson] = useState(null);

    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizModal,   setShowQuizModal]   = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null); // cours à supprimer
    const [editingCourse,   setEditingCourse]   = useState(null);
    const [editingModule,   setEditingModule]   = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const emptyCourse = { titre:'', description:'', niveau:'', coverImage:'', groupIds:[] };
    const [courseForm, setCourseForm] = useState(emptyCourse);
    const [moduleForm, setModuleForm] = useState({ titre:'', description:'' });
    const [lessonForm, setLessonForm] = useState({ titre:'', objectives:'', teacherGuideUrl:'', studentSlidesUrl:'', imageUrl:'', challengeContent:'', challengeLang:'python' });
    const [quizForm,   setQuizForm]   = useState({ question:'', options:['','','',''], correct:0 });

    useEffect(() => { fetchAll(); }, []);

    // Fermer menu au clic extérieur
    useEffect(() => {
        const close = () => setMenuOpen(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, gRes] = await Promise.all([api.get('/courses'), api.get('/groups')]);
            setCourses(cRes.data);
            setGroups(gRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchModules = async (courseId) => {
        try { const r = await api.get(`/lessons/courses/${courseId}/modules`); return r.data; } catch { return []; }
    };
    const fetchLessons = async (moduleId) => {
        try { const r = await api.get(`/lessons/modules/${moduleId}/lessons`); return r.data; } catch { return []; }
    };
    const refreshCourse = async () => {
        if (!selCourse) return;
        const modules = await fetchModules(selCourse.id);
        setSelCourse(prev => ({...prev, modules}));
        if (selModule) { const m = modules.find(m=>m.id===selModule.id); if(m) setSelModule(m); }
    };

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
            setLessonForm({ titre:r.data.titre||'', objectives:r.data.objectives||'', teacherGuideUrl:r.data.teacherGuideUrl||'', studentSlidesUrl:r.data.studentSlidesUrl||'', imageUrl:r.data.imageUrl||'', challengeContent:r.data.challengeContent||'', challengeLang:r.data.challengeLang||'python' });
            setView('lesson-edit');
        } catch { showToast('Erreur chargement leçon','error'); }
    };

    // CRUD COURS
    const saveCourse = async () => {
        if (!courseForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (editingCourse) { await api.put(`/courses/${editingCourse.id}`, courseForm); showToast('Cours modifié'); }
            else { await api.post('/courses', courseForm); showToast('Cours créé'); }
            setShowCourseModal(false); setEditingCourse(null); setCourseForm(emptyCourse);
            fetchAll();
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };
    const confirmDeleteCourse = async () => {
        if (!showDeleteModal) return;
        try { await api.delete(`/courses/${showDeleteModal.id}`); fetchAll(); showToast('Cours supprimé'); setShowDeleteModal(null); }
        catch { showToast('Erreur suppression','error'); }
    };

    // CRUD MODULES
    const saveModule = async () => {
        if (!moduleForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (editingModule) { await api.put(`/lessons/modules/${editingModule.id}`, moduleForm); showToast('Module modifié'); }
            else { await api.post(`/lessons/courses/${selCourse.id}/modules`, moduleForm); showToast('Module créé'); }
            setShowModuleModal(false); setEditingModule(null); setModuleForm({titre:'',description:''});
            await refreshCourse();
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };
    const deleteModule = async (id) => {
        if (!window.confirm('Supprimer ce module et toutes ses leçons ?')) return;
        try { await api.delete(`/lessons/modules/${id}`); await refreshCourse(); if(selModule?.id===id){setSelModule(null);setView('modules');} showToast('Module supprimé'); }
        catch { showToast('Erreur','error'); }
    };

    // CRUD LEÇONS
    const saveLesson = async () => {
        if (!lessonForm.titre) return alert('Titre obligatoire');
        setSaving(true);
        try {
            if (selLesson && view==='lesson-edit') {
                await api.put(`/lessons/lessons/${selLesson.id}`, lessonForm);
                const r = await api.get(`/lessons/lessons/${selLesson.id}`);
                setSelLesson(r.data);
                showToast('Leçon sauvegardée');
            } else {
                await api.post(`/lessons/modules/${selModule.id}/lessons`, {...lessonForm, courseId:selCourse.id});
                showToast('Leçon créée');
                setShowLessonModal(false);
                setLessonForm({titre:'',objectives:'',teacherGuideUrl:'',studentSlidesUrl:'',imageUrl:'',challengeContent:'',challengeLang:'python'});
            }
            if (selModule) await openModule(selModule);
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };
    const deleteLesson = async (id) => {
        if (!window.confirm('Supprimer cette leçon ?')) return;
        try { await api.delete(`/lessons/lessons/${id}`); if(selModule) await openModule(selModule); if(selLesson?.id===id){setSelLesson(null);setView('lessons');} showToast('Leçon supprimée'); }
        catch { showToast('Erreur','error'); }
    };

    // CRUD QUIZ
    const saveQuestion = async () => {
        if (!quizForm.question || quizForm.options.some(o=>!o)) return alert('Remplissez tous les champs');
        setSaving(true);
        try {
            if (editingQuestion) { await api.put(`/lessons/quiz/${editingQuestion.id}`, quizForm); showToast('Question modifiée'); }
            else { await api.post(`/lessons/lessons/${selLesson.id}/quiz`, quizForm); showToast('Question ajoutée'); }
            setShowQuizModal(false); setEditingQuestion(null); setQuizForm({question:'',options:['','','',''],correct:0});
            const r = await api.get(`/lessons/lessons/${selLesson.id}`);
            setSelLesson(r.data);
        } catch { showToast('Erreur','error'); }
        setSaving(false);
    };
    const deleteQuestion = async (id) => {
        if (!window.confirm('Supprimer cette question ?')) return;
        try { await api.delete(`/lessons/quiz/${id}`); const r = await api.get(`/lessons/lessons/${selLesson.id}`); setSelLesson(r.data); showToast('Supprimée'); }
        catch { showToast('Erreur','error'); }
    };

    const GRADIENTS = ['135deg,#6C47FF,#9B7FFF','135deg,#0EA5E9,#38BDF8','135deg,#10B981,#34D399','135deg,#F59E0B,#FCD34D','135deg,#EF4444,#F87171','135deg,#8B5CF6,#A78BFA'];

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    return (
        <div style={{ position:'relative', minHeight:'100vh', background:'#F8F7FF' }}>
            {toast && <Toast {...toast}/>}

            {/* ════ VUE COURS ════ */}
            {view==='courses' && (
                <div style={{ padding:'0' }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
                        <div>
                            <h1 style={{ fontFamily:'sans-serif', fontSize:'24px', fontWeight:'800', color:'#1A1040', margin:0 }}>
                                {isAdmin ? 'Tous les cours' : 'Mes cours'}
                            </h1>
                            <p style={{ fontSize:'14px', color:'#9CA3AF', margin:'4px 0 0', fontWeight:'500' }}>
                                {courses.length} cours disponible{courses.length>1?'s':''}
                            </p>
                        </div>
                        <button style={s.btnPrimary} onClick={() => { setCourseForm(emptyCourse); setEditingCourse(null); setShowCourseModal(true); }}>
                            <Ic name="plus" size={16} color="#fff"/> Nouveau cours
                        </button>
                    </div>

                    {loading ? (
                        <div style={s.emptyState}>
                            <div style={{ width:'32px', height:'32px', border:'3px solid #EDE8FF', borderTop:'3px solid #6C47FF', borderRadius:'50%' }}/>
                        </div>
                    ) : courses.length===0 ? (
                        <div style={s.emptyState}>
                            <div style={{ width:'80px', height:'80px', background:'#EDE8FF', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
                                <Ic name="book" size={36} color="#6C47FF"/>
                            </div>
                            <div style={{ fontSize:'18px', fontWeight:'700', color:'#1A1040', marginBottom:'6px' }}>Aucun cours</div>
                            <div style={{ fontSize:'14px', color:'#9CA3AF', marginBottom:'20px' }}>Créez votre premier cours pour commencer</div>
                            <button style={s.btnPrimary} onClick={() => { setCourseForm(emptyCourse); setEditingCourse(null); setShowCourseModal(true); }}>
                                <Ic name="plus" size={14} color="#fff"/> Créer un cours
                            </button>
                        </div>
                    ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'20px' }}>
                            {courses.map((c, idx) => {
                                const grad = GRADIENTS[idx % GRADIENTS.length];
                                const groups_assigned = c.courseGroups || [];
                                const moduleCount = (c.modules||[]).length;
                                return (
                                    <div key={c.id} style={{ background:'#fff', borderRadius:'16px', overflow:'hidden', border:'1px solid #EBEBF5', boxShadow:'0 1px 4px rgba(108,71,255,0.06)', transition:'box-shadow 0.2s', cursor:'default' }}
                                         onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 24px rgba(108,71,255,0.12)'}
                                         onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(108,71,255,0.06)'}>

                                        {/* Bannière */}
                                        <div style={{ height:'140px', background:`linear-gradient(${grad})`, position:'relative', overflow:'hidden' }}>
                                            {c.coverImage && (
                                                <img src={c.coverImage} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                                            )}
                                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}/>

                                            {/* Titre sur la bannière */}
                                            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 16px' }}>
                                                <div style={{ fontSize:'16px', fontWeight:'800', color:'#fff', lineHeight:1.3, textShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>{c.titre}</div>
                                                {c.niveau && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)', marginTop:'2px', fontWeight:'500' }}>{c.niveau}</div>}
                                            </div>

                                            {/* Menu ⋯ */}
                                            <div style={{ position:'absolute', top:'10px', right:'10px' }} onClick={e => e.stopPropagation()}>
                                                <button style={{ width:'32px', height:'32px', borderRadius:'8px', border:'none', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}
                                                        onClick={() => setMenuOpen(menuOpen===c.id ? null : c.id)}>
                                                    <Ic name="more" size={16} color="#fff"/>
                                                </button>
                                                {menuOpen===c.id && (
                                                    <div style={{ position:'absolute', top:'38px', right:0, background:'#fff', border:'1px solid #EBEBF5', borderRadius:'12px', padding:'6px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', minWidth:'160px', zIndex:50 }}>
                                                        <button style={s.menuItem} onClick={() => { setCourseForm({titre:c.titre,description:c.description||'',niveau:c.niveau||'',coverImage:c.coverImage||'',groupIds:c.courseGroups?.map(cg=>cg.groupId)||[]}); setEditingCourse(c); setShowCourseModal(true); setMenuOpen(null); }}>
                                                            <Ic name="edit" size={14} color="#6C47FF"/> Modifier le cours
                                                        </button>
                                                        <div style={{ height:'1px', background:'#F3F4F6', margin:'4px 0' }}/>
                                                        <button style={{ ...s.menuItem, color:'#DC2626' }} onClick={() => { setShowDeleteModal(c); setMenuOpen(null); }}>
                                                            <Ic name="trash" size={14} color="#DC2626"/> Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Corps */}
                                        <div style={{ padding:'16px' }}>
                                            {c.description && <div style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.6, marginBottom:'12px' }}>{c.description}</div>}

                                            {/* Groupes */}
                                            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'14px', minHeight:'22px' }}>
                                                {groups_assigned.length===0
                                                    ? <span style={{ fontSize:'12px', color:'#D1D5DB', fontStyle:'italic' }}>Aucun groupe assigné</span>
                                                    : groups_assigned.map(cg => (
                                                        <span key={cg.id} style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'600', color:'#6C47FF', background:'#F0EEFF', padding:'3px 9px', borderRadius:'50px', border:'1px solid #DDD5FF' }}>
                                                            <Ic name="group" size={9} color="#6C47FF"/> {cg.group?.titre}
                                                        </span>
                                                    ))
                                                }
                                            </div>

                                            {/* Stats + bouton */}
                                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                                <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:'600', color:'#9CA3AF' }}>
                                                    <Ic name="layers" size={13} color="#9CA3AF"/> {moduleCount} module{moduleCount!==1?'s':''}
                                                </span>
                                                <button style={s.btnOutline} onClick={() => openCourse(c)}>
                                                    Gérer <Ic name="chevronR" size={14} color="#6C47FF"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE MODULES ════ */}
            {view==='modules' && (
                <div>
                    {/* Breadcrumb */}
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#6C47FF"/> Cours</button>
                        <span style={s.breadSep}>/</span>
                        <span style={s.breadCur}>{selCourse?.titre}</span>
                    </div>

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', gap:'12px', flexWrap:'wrap' }}>
                        <div>
                            <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:'800', color:'#1A1040', margin:'0 0 4px' }}>{selCourse?.titre}</h1>
                            {selCourse?.niveau && <span style={{ fontSize:'12px', fontWeight:'600', color:'#6C47FF', background:'#F0EEFF', padding:'3px 10px', borderRadius:'50px' }}>{selCourse.niveau}</span>}
                        </div>
                        <button style={s.btnPrimary} onClick={() => { setModuleForm({titre:'',description:''}); setEditingModule(null); setShowModuleModal(true); }}>
                            <Ic name="plus" size={14} color="#fff"/> Ajouter un module
                        </button>
                    </div>

                    {(selCourse?.modules||[]).length===0 ? (
                        <div style={s.emptyState}>
                            <div style={{ width:'64px', height:'64px', background:'#EDE8FF', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                                <Ic name="layers" size={28} color="#6C47FF"/>
                            </div>
                            <div style={{ fontSize:'16px', fontWeight:'700', color:'#1A1040' }}>Aucun module</div>
                            <div style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'4px' }}>Ajoutez un module pour organiser vos leçons</div>
                        </div>
                    ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                            {(selCourse?.modules||[]).map((mod, idx) => {
                                const lessonCount = (mod.chapters||[]).length;
                                return (
                                    <div key={mod.id} style={{ background:'#fff', border:'1px solid #EBEBF5', borderRadius:'14px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                                        {/* Numéro */}
                                        <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,#6C47FF,#9B7FFF)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#fff', flexShrink:0 }}>
                                            {idx+1}
                                        </div>
                                        {/* Infos */}
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontSize:'15px', fontWeight:'700', color:'#1A1040' }}>{mod.titre}</div>
                                            {mod.description && <div style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'2px' }}>{mod.description}</div>}
                                            <div style={{ marginTop:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
                                                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:'600', color:'#6B7280', background:'#F3F4F6', padding:'3px 9px', borderRadius:'50px' }}>
                                                    <Ic name="file" size={11} color="#9CA3AF"/> {lessonCount} leçon{lessonCount!==1?'s':''}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                            <button style={s.iconBtnLight} title="Modifier" onClick={() => { setModuleForm({titre:mod.titre,description:mod.description||''}); setEditingModule(mod); setShowModuleModal(true); }}>
                                                <Ic name="edit" size={14} color="#6C47FF"/>
                                            </button>
                                            <button style={{ ...s.iconBtnLight, background:'#FEF2F2', border:'1px solid #FECACA' }} title="Supprimer" onClick={() => deleteModule(mod.id)}>
                                                <Ic name="trash" size={14} color="#DC2626"/>
                                            </button>
                                            <button style={s.btnOutline} onClick={() => openModule(mod)}>
                                                Leçons <Ic name="chevronR" size={13} color="#6C47FF"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE LEÇONS ════ */}
            {view==='lessons' && (
                <div>
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#6C47FF"/> Cours</button>
                        <span style={s.breadSep}>/</span>
                        <button style={s.breadBtn} onClick={() => setView('modules')}>{selCourse?.titre}</button>
                        <span style={s.breadSep}>/</span>
                        <span style={s.breadCur}>{selModule?.titre}</span>
                    </div>

                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', gap:'12px' }}>
                        <div>
                            <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:'800', color:'#1A1040', margin:'0 0 4px' }}>{selModule?.titre}</h1>
                            {selModule?.description && <div style={{ fontSize:'14px', color:'#9CA3AF' }}>{selModule.description}</div>}
                        </div>
                        <button style={s.btnPrimary} onClick={() => { setLessonForm({titre:'',objectives:'',teacherGuideUrl:'',studentSlidesUrl:'',imageUrl:'',challengeContent:'',challengeLang:'python'}); setShowLessonModal(true); }}>
                            <Ic name="plus" size={14} color="#fff"/> Nouvelle leçon
                        </button>
                    </div>

                    {(selModule?.chapters||[]).length===0 ? (
                        <div style={s.emptyState}>
                            <div style={{ width:'64px', height:'64px', background:'#EDE8FF', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                                <Ic name="file" size={28} color="#6C47FF"/>
                            </div>
                            <div style={{ fontSize:'16px', fontWeight:'700', color:'#1A1040' }}>Aucune leçon</div>
                        </div>
                    ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                            {(selModule?.chapters||[]).map((lesson, idx) => {
                                const filledElements = ELEMENTS.filter(el => hasElement(lesson, el.key));
                                return (
                                    <div key={lesson.id} style={{ background:'#fff', border:'1px solid #EBEBF5', borderRadius:'12px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', transition:'border-color 0.15s' }}
                                         onMouseEnter={e => e.currentTarget.style.borderColor='#DDD5FF'}
                                         onMouseLeave={e => e.currentTarget.style.borderColor='#EBEBF5'}>
                                        {/* Numéro */}
                                        <div style={{ width:'32px', height:'32px', background:'#F0EEFF', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#6C47FF', flexShrink:0 }}>
                                            {idx+1}
                                        </div>
                                        {/* Titre + éléments */}
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A1040', marginBottom:'6px' }}>{lesson.titre}</div>
                                            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                                                {ELEMENTS.map(el => {
                                                    const has = hasElement(lesson, el.key);
                                                    return has ? (
                                                        <span key={el.key} style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:'700', background:el.bg, color:el.color }}>
                                                            <Ic name={el.icon} size={9} color={el.color}/> {el.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {filledElements.length===0 && <span style={{ fontSize:'12px', color:'#D1D5DB', fontStyle:'italic' }}>Aucun contenu ajouté</span>}
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                                            <button style={{ ...s.iconBtnLight, background:'#FEF2F2', border:'1px solid #FECACA' }} title="Supprimer" onClick={() => deleteLesson(lesson.id)}>
                                                <Ic name="trash" size={13} color="#DC2626"/>
                                            </button>
                                            <button style={s.btnOutline} onClick={() => openLesson(lesson)}>
                                                Éditer <Ic name="chevronR" size={13} color="#6C47FF"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE ÉDITION LEÇON ════ */}
            {view==='lesson-edit' && selLesson && (
                <div>
                    <div style={s.breadcrumb}>
                        <button style={s.breadBtn} onClick={() => setView('courses')}><Ic name="back" size={13} color="#6C47FF"/> Cours</button>
                        <span style={s.breadSep}>/</span>
                        <button style={s.breadBtn} onClick={() => setView('modules')}>{selCourse?.titre}</button>
                        <span style={s.breadSep}>/</span>
                        <button style={s.breadBtn} onClick={() => setView('lessons')}>{selModule?.titre}</button>
                        <span style={s.breadSep}>/</span>
                        <span style={s.breadCur}>{selLesson.titre}</span>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', gap:'12px' }}>
                        <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:'800', color:'#1A1040', margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
                            <span style={{ fontSize:'20px' }}>✏️</span> {selLesson.titre}
                        </h1>
                        <button style={{ ...s.btnPrimary, background:'linear-gradient(135deg,#10B981,#059669)' }} onClick={saveLesson} disabled={saving}>
                            <Ic name="save" size={14} color="#fff"/> {saving?'Sauvegarde...':'Sauvegarder'}
                        </button>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

                        {/* Titre */}
                        <div style={{ ...s.card, gridColumn:'1/-1' }}>
                            <div style={s.cardHeader}><Ic name="file" size={14} color="#6C47FF"/> Titre de la leçon</div>
                            <Inp value={lessonForm.titre} onChange={e=>setLessonForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Leçon 1 — Introduction à Python"/>
                        </div>

                        {/* Objectifs */}
                        <div style={s.card}>
                            <div style={s.cardHeader}><Ic name="target" size={14} color="#7C3AED"/> Objectifs <span style={s.optTag}>optionnel</span></div>
                            <Txt value={lessonForm.objectives} onChange={e=>setLessonForm(f=>({...f,objectives:e.target.value}))} placeholder="À la fin de cette leçon, l'élève saura..."/>
                        </div>

                        {/* Image */}
                        <div style={s.card}>
                            <div style={s.cardHeader}><Ic name="image" size={14} color="#059669"/> Image illustrative <span style={s.optTag}>optionnel</span></div>
                            <Inp value={lessonForm.imageUrl} onChange={e=>setLessonForm(f=>({...f,imageUrl:e.target.value}))} placeholder="https://..."/>
                            {lessonForm.imageUrl && (
                                <div style={{ marginTop:'10px', borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB', height:'100px' }}>
                                    <img src={lessonForm.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                                </div>
                            )}
                        </div>

                        {/* Teacher Guide */}
                        <div style={{ ...s.card, borderColor:'#BAE6FD', background:'#F0F9FF' }}>
                            <div style={s.cardHeader}>
                                <Ic name="teacher" size={14} color="#0369A1"/> Guide Professeur
                                <span style={{ fontSize:'10px', fontWeight:'800', color:'#0369A1', background:'#DBEAFE', padding:'2px 7px', borderRadius:'4px' }}>🔒 Prof uniquement</span>
                                <span style={s.optTag}>optionnel</span>
                            </div>
                            <Inp value={lessonForm.teacherGuideUrl} onChange={e=>setLessonForm(f=>({...f,teacherGuideUrl:e.target.value}))} placeholder="https://docs.google.com/presentation/..." style={{ borderColor:'#BAE6FD' }}/>
                        </div>

                        {/* Student Slides */}
                        <div style={{ ...s.card, borderColor:'#DDD5FF', background:'#F8F6FF' }}>
                            <div style={s.cardHeader}><Ic name="slide" size={14} color="#6C47FF"/> Slides Élèves <span style={s.optTag}>optionnel</span></div>
                            <Inp value={lessonForm.studentSlidesUrl} onChange={e=>setLessonForm(f=>({...f,studentSlidesUrl:e.target.value}))} placeholder="https://docs.google.com/presentation/..." style={{ borderColor:'#DDD5FF' }}/>
                        </div>

                        {/* Challenge */}
                        <div style={{ ...s.card, gridColumn:'1/-1', borderColor:'#FECACA', background:'#FFF5F5' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                                <div style={s.cardHeader}><Ic name="code" size={14} color="#DC2626"/> Challenge / Script <span style={s.optTag}>optionnel</span></div>
                                <select style={{ padding:'7px 12px', border:'1.5px solid #FECACA', borderRadius:'8px', fontSize:'13px', color:'#374151', outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' }} value={lessonForm.challengeLang} onChange={e=>setLessonForm(f=>({...f,challengeLang:e.target.value}))}>
                                    {['python','javascript','html','css','scratch'].map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                                </select>
                            </div>
                            <Txt value={lessonForm.challengeContent} onChange={e=>setLessonForm(f=>({...f,challengeContent:e.target.value}))} placeholder="# Écris ton code ici..." style={{ fontFamily:'"Fira Code",monospace', fontSize:'13px', minHeight:'140px', background:'#0F172A', color:'#E2E8F0', border:'1px solid #334155', borderRadius:'10px' }}/>
                        </div>

                        {/* Quiz */}
                        <div style={{ ...s.card, gridColumn:'1/-1', borderColor:'#FDE68A', background:'#FFFDF0' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                                <div style={s.cardHeader}>
                                    <Ic name="qcm" size={14} color="#B45309"/> Quiz
                                    <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:'500' }}>({(selLesson.quizQuestions||[]).length} question{(selLesson.quizQuestions||[]).length!==1?'s':''})</span>
                                    <span style={s.optTag}>optionnel</span>
                                </div>
                                <button style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'#fff', border:'1.5px solid #FDE68A', borderRadius:'9px', color:'#B45309', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}
                                        onClick={() => { setQuizForm({question:'',options:['','','',''],correct:0}); setEditingQuestion(null); setShowQuizModal(true); }}>
                                    <Ic name="plus" size={13} color="#B45309"/> Ajouter une question
                                </button>
                            </div>

                            {(selLesson.quizQuestions||[]).length===0 ? (
                                <div style={{ textAlign:'center', padding:'28px', color:'#D1D5DB', fontSize:'14px' }}>
                                    Aucune question pour l'instant — cliquez sur "Ajouter une question"
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                    {(selLesson.quizQuestions||[]).map((q,qi) => (
                                        <div key={q.id} style={{ background:'#fff', border:'1px solid #FDE68A', borderRadius:'12px', padding:'16px' }}>
                                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                                                <div style={{ flex:1 }}>
                                                    <div style={{ fontSize:'14px', fontWeight:'700', color:'#111827', marginBottom:'10px' }}>
                                                        <span style={{ background:'#FEF3C7', color:'#92400E', fontWeight:'800', fontSize:'11px', padding:'2px 8px', borderRadius:'5px', marginRight:'8px' }}>Q{qi+1}</span>
                                                        {q.question}
                                                    </div>
                                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                                                        {q.options.map((opt,oi) => (
                                                            <div key={oi} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', background:oi===q.correct?'#ECFDF5':'#F9FAFB', border:`1.5px solid ${oi===q.correct?'#6EE7B7':'#E5E7EB'}` }}>
                                                                <span style={{ width:'20px', height:'20px', borderRadius:'5px', background:oi===q.correct?'#059669':'#E5E7EB', color:oi===q.correct?'#fff':'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'800', flexShrink:0 }}>{['A','B','C','D'][oi]}</span>
                                                                <span style={{ fontSize:'12px', color:oi===q.correct?'#065F46':'#374151', fontWeight:oi===q.correct?'700':'400' }}>{opt}</span>
                                                                {oi===q.correct && <Ic name="check" size={12} color="#059669"/>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                                                    <button style={s.iconBtnLight} onClick={() => { setQuizForm({question:q.question,options:[...q.options],correct:q.correct}); setEditingQuestion(q); setShowQuizModal(true); }}>
                                                        <Ic name="edit" size={13} color="#6C47FF"/>
                                                    </button>
                                                    <button style={{ ...s.iconBtnLight, background:'#FEF2F2', border:'1px solid #FECACA' }} onClick={() => deleteQuestion(q.id)}>
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

            {/* ════ MODAL SUPPRIMER (confirmation) ════ */}
            {showDeleteModal && (
                <div style={s.overlay} onClick={() => setShowDeleteModal(null)}>
                    <div style={{ ...s.modal, maxWidth:'400px', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
                        <div style={{ width:'64px', height:'64px', background:'#FEF2F2', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                            <Ic name="trash" size={28} color="#DC2626"/>
                        </div>
                        <h2 style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:'800', color:'#1A1040', margin:'0 0 8px' }}>Supprimer ce cours ?</h2>
                        <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 24px', lineHeight:1.6 }}>
                            Vous allez supprimer <strong>"{showDeleteModal.titre}"</strong> et tout son contenu (modules, leçons, quiz). Cette action est irréversible.
                        </p>
                        <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
                            <button style={{ ...s.btnOutline, padding:'10px 20px' }} onClick={() => setShowDeleteModal(null)}>Annuler</button>
                            <button style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px', background:'#DC2626', border:'none', borderRadius:'10px', color:'#fff', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit' }} onClick={confirmDeleteCourse}>
                                <Ic name="trash" size={14} color="#fff"/> Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL COURS ════ */}
            {showCourseModal && (
                <div style={s.overlay} onClick={() => setShowCourseModal(false)}>
                    <div style={s.modal} onClick={e=>e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingCourse ? 'Modifier le cours' : 'Nouveau cours'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                            <div style={s.formGroup}><label style={s.lbl}>Titre *</label><Inp value={courseForm.titre} onChange={e=>setCourseForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Minecraft Game Design"/></div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                <div style={s.formGroup}><label style={s.lbl}>Niveau</label><Inp value={courseForm.niveau} onChange={e=>setCourseForm(f=>({...f,niveau:e.target.value}))} placeholder="ex: 8-12 ans, Débutant"/></div>
                                <div style={s.formGroup}><label style={s.lbl}>Description</label><Inp value={courseForm.description} onChange={e=>setCourseForm(f=>({...f,description:e.target.value}))} placeholder="Brève description..."/></div>
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.lbl}>🖼️ Image de couverture (URL)</label>
                                <Inp value={courseForm.coverImage} onChange={e=>setCourseForm(f=>({...f,coverImage:e.target.value}))} placeholder="https://..."/>
                                {courseForm.coverImage && (
                                    <div style={{ marginTop:'8px', borderRadius:'10px', overflow:'hidden', height:'100px', border:'1px solid #E5E7EB' }}>
                                        <img src={courseForm.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                                    </div>
                                )}
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.lbl}>Groupes assignés</label>
                                <GroupSelector selectedIds={courseForm.groupIds} onChange={ids=>setCourseForm(f=>({...f,groupIds:ids}))} groups={groups}/>
                                {courseForm.groupIds.length>0 && <div style={{ fontSize:'12px', color:'#059669', fontWeight:'600', marginTop:'4px' }}>✅ {courseForm.groupIds.length} groupe{courseForm.groupIds.length>1?'s':''} sélectionné{courseForm.groupIds.length>1?'s':''}</div>}
                            </div>
                        </div>
                        <div style={s.mFoot}>
                            <button style={{ ...s.btnOutline, padding:'10px 18px' }} onClick={() => setShowCourseModal(false)}>Annuler</button>
                            <button style={s.btnPrimary} onClick={saveCourse} disabled={saving}>{saving?'Sauvegarde...': editingCourse?'Enregistrer les modifications':'Créer le cours'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL MODULE ════ */}
            {showModuleModal && (
                <div style={s.overlay} onClick={() => setShowModuleModal(false)}>
                    <div style={{ ...s.modal, maxWidth:'460px' }} onClick={e=>e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingModule ? 'Modifier le module' : 'Nouveau module'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                            <div style={s.formGroup}><label style={s.lbl}>Titre *</label><Inp value={moduleForm.titre} onChange={e=>setModuleForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Module 1 — Les bases"/></div>
                            <div style={s.formGroup}><label style={s.lbl}>Description</label><Txt value={moduleForm.description} onChange={e=>setModuleForm(f=>({...f,description:e.target.value}))} placeholder="Décrivez ce module..." style={{ minHeight:'80px' }}/></div>
                        </div>
                        <div style={s.mFoot}>
                            <button style={{ ...s.btnOutline, padding:'10px 18px' }} onClick={() => setShowModuleModal(false)}>Annuler</button>
                            <button style={s.btnPrimary} onClick={saveModule} disabled={saving}>{saving?'Sauvegarde...':'Enregistrer'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL LEÇON ════ */}
            {showLessonModal && (
                <div style={s.overlay} onClick={() => setShowLessonModal(false)}>
                    <div style={{ ...s.modal, maxWidth:'420px' }} onClick={e=>e.stopPropagation()}>
                        <h2 style={s.modalTitle}>Nouvelle leçon</h2>
                        <div style={s.formGroup}><label style={s.lbl}>Titre *</label><Inp value={lessonForm.titre} onChange={e=>setLessonForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Leçon 1 — Introduction"/></div>
                        <p style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'10px', lineHeight:1.5 }}>💡 Vous pourrez ajouter les objectifs, slides, images, quiz et challenge après création.</p>
                        <div style={s.mFoot}>
                            <button style={{ ...s.btnOutline, padding:'10px 18px' }} onClick={() => setShowLessonModal(false)}>Annuler</button>
                            <button style={s.btnPrimary} onClick={saveLesson} disabled={saving}>{saving?'Création...':'Créer la leçon'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL QUIZ ════ */}
            {showQuizModal && (
                <div style={s.overlay} onClick={() => setShowQuizModal(false)}>
                    <div style={{ ...s.modal, maxWidth:'520px' }} onClick={e=>e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editingQuestion ? 'Modifier la question' : 'Nouvelle question'}</h2>
                        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                            <div style={s.formGroup}><label style={s.lbl}>Question *</label><Txt value={quizForm.question} onChange={e=>setQuizForm(f=>({...f,question:e.target.value}))} placeholder="Posez votre question ici..." style={{ minHeight:'70px' }}/></div>
                            <div><label style={{ ...s.lbl, display:'block', marginBottom:'8px' }}>Options <span style={{ color:'#9CA3AF', fontWeight:'500', textTransform:'none', letterSpacing:'0' }}>— cliquez sur la lettre pour choisir la bonne réponse</span></label>
                                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                    {['A','B','C','D'].map((letter,oi) => (
                                        <div key={oi} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:quizForm.correct===oi?'#059669':'#F3F4F6', color:quizForm.correct===oi?'#fff':'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', flexShrink:0, cursor:'pointer', transition:'all 0.15s', border:`2px solid ${quizForm.correct===oi?'#059669':'transparent'}` }}
                                                 onClick={() => setQuizForm(f=>({...f,correct:oi}))}>
                                                {letter}
                                            </div>
                                            <Inp value={quizForm.options[oi]} onChange={e=>{ const opts=[...quizForm.options]; opts[oi]=e.target.value; setQuizForm(f=>({...f,options:opts})); }} placeholder={`Réponse ${letter}`} style={{ flex:1, width:'auto', border:quizForm.correct===oi?'1.5px solid #059669':'1.5px solid #E5E7EB' }}/>
                                            {quizForm.correct===oi && <span style={{ fontSize:'12px', color:'#059669', fontWeight:'700', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'3px' }}><Ic name="check" size={12} color="#059669"/> Bonne</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={s.mFoot}>
                            <button style={{ ...s.btnOutline, padding:'10px 18px' }} onClick={() => setShowQuizModal(false)}>Annuler</button>
                            <button style={s.btnPrimary} onClick={saveQuestion} disabled={saving}>{saving?'Sauvegarde...':'Enregistrer la question'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Styles ──────────────────────────────────────────────────
const s = {
    btnPrimary:  { display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:'linear-gradient(135deg,#6C47FF,#5035CC)', border:'none', borderRadius:'11px', color:'#fff', fontWeight:'700', fontSize:'14px', cursor:'pointer', fontFamily:'inherit', flexShrink:0, boxShadow:'0 2px 8px rgba(108,71,255,0.3)' },
    btnOutline:  { display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'#fff', border:'1.5px solid #DDD5FF', borderRadius:'9px', color:'#6C47FF', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    iconBtnLight:{ width:'32px', height:'32px', borderRadius:'8px', border:'1.5px solid #E5E7EB', background:'#F8F7FF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
    menuItem:    { display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'8px 12px', border:'none', background:'transparent', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#374151', cursor:'pointer', fontFamily:'inherit', textAlign:'left' },
    breadcrumb:  { display:'flex', alignItems:'center', gap:'6px', marginBottom:'20px', fontSize:'13px' },
    breadBtn:    { background:'none', border:'none', color:'#6C47FF', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', borderRadius:'6px' },
    breadSep:    { color:'#D1D5DB', fontWeight:'400', fontSize:'16px' },
    breadCur:    { color:'#374151', fontWeight:'700' },
    emptyState:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px' },
    card:        { background:'#fff', border:'1.5px solid #EBEBF5', borderRadius:'14px', padding:'18px 20px' },
    cardHeader:  { display:'flex', alignItems:'center', gap:'7px', fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'12px' },
    optTag:      { fontSize:'10px', fontWeight:'600', color:'#9CA3AF', background:'#F3F4F6', padding:'2px 7px', borderRadius:'4px', marginLeft:'auto' },
    overlay:     { position:'fixed', inset:0, background:'rgba(15,5,40,0.5)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
    modal:       { background:'#fff', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' },
    modalTitle:  { fontFamily:'sans-serif', fontSize:'20px', fontWeight:'800', color:'#1A1040', margin:'0 0 22px' },
    formGroup:   { display:'flex', flexDirection:'column', gap:'6px' },
    lbl:         { fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px' },
    mFoot:       { display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'24px', paddingTop:'18px', borderTop:'1px solid #F3F4F6' },
};