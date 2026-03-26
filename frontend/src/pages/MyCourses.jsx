import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    const [showAddCourse, setShowAddCourse] = useState(false);
    const [showEditCourse, setShowEditCourse] = useState(false);
    const [showAddChapter, setShowAddChapter] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);

    const [courseForm, setCourseForm] = useState({ titre: '', description: '', niveau: 'Débutant', groupId: '' });
    const [chapterForm, setChapterForm] = useState({ titre: '', ordre: 1 });
    const [taskForm, setTaskForm] = useState({ titre: '', type: 'SLIDE', contenuUrl: '' });

    useEffect(() => {
        fetchCourses();
        fetchGroups();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
    };

    const refreshSelectedCourse = async (courseId) => {
        const res = await api.get(`/courses/${courseId}`);
        setSelectedCourse(res.data);
        fetchCourses();
    };

    const createCourse = async () => {
        if (!courseForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.post('/courses', courseForm);
            setShowAddCourse(false);
            setCourseForm({ titre: '', description: '', niveau: 'Débutant', groupId: '' });
            fetchCourses();
        } catch (err) { alert('Erreur création cours'); }
    };

    const editCourse = async () => {
        if (!courseForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.put(`/courses/${selectedCourse.id}`, courseForm);
            setShowEditCourse(false);
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur modification cours'); }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try {
            await api.delete(`/courses/${id}`);
            setCourses(courses.filter(c => c.id !== id));
            if (selectedCourse?.id === id) { setView('list'); setSelectedCourse(null); }
        } catch (err) { alert('Erreur : ' + err.response?.data?.message); }
    };

    const createChapter = async () => {
        if (!chapterForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.post(`/courses/${selectedCourse.id}/chapters`, { ...chapterForm, locked: false });
            setShowAddChapter(false);
            setChapterForm({ titre: '', ordre: 1 });
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur création chapitre'); }
    };

    const toggleChapter = async (chapterId) => {
        try {
            await api.put(`/courses/chapters/${chapterId}/toggle`);
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur'); }
    };

    const deleteChapter = async (chapterId) => {
        if (!window.confirm('Supprimer ce chapitre ?')) return;
        try {
            await api.delete(`/courses/chapters/${chapterId}`);
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur suppression'); }
    };

    const createTask = async () => {
        if (!taskForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.post(`/courses/chapters/${selectedChapter.id}/tasks`, taskForm);
            setShowAddTask(false);
            setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '' });
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur création tâche'); }
    };

    const toggleTask = async (taskId) => {
        try {
            await api.put(`/courses/tasks/${taskId}/toggle`);
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur'); }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Supprimer cette tâche ?')) return;
        try {
            await api.delete(`/courses/tasks/${taskId}`);
            refreshSelectedCourse(selectedCourse.id);
        } catch (err) { alert('Erreur suppression'); }
    };

    if (view === 'list') return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>📚 Mes Cours</h1>
                <button style={s.btnP} onClick={() => setShowAddCourse(true)}>+ Nouveau cours</button>
            </div>

            {loading ? <div style={s.empty}>Chargement...</div>
                : courses.length === 0 ? (
                    <div style={s.emptyBox}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                        <div style={s.emptyTitle}>Aucun cours</div>
                        <button style={{ ...s.btnP, marginTop: '16px' }} onClick={() => setShowAddCourse(true)}>+ Créer un cours</button>
                    </div>
                ) : (
                    <div style={s.grid}>
                        {courses.map(course => (
                            <div key={course.id} style={s.card}>
                                <div style={s.cardTop}>
                                    <div style={s.cardIcon}>📚</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button style={s.btnSmE} onClick={() => {
                                            setSelectedCourse(course);
                                            setCourseForm({ titre: course.titre, description: course.description || '', niveau: course.niveau || 'Débutant', groupId: course.groupId || '' });
                                            setShowEditCourse(true);
                                        }}>✏️</button>
                                        <button style={s.btnSmD} onClick={() => deleteCourse(course.id)}>🗑️</button>
                                    </div>
                                </div>
                                <div style={s.cardTitle}>{course.titre}</div>
                                <div style={s.cardDesc}>{course.description || 'Aucune description'}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                    <span style={s.pill}>{course.niveau || 'Débutant'}</span>
                                    {course.group && <span style={{ ...s.pill, background: '#EDE8FF', color: '#5B2EE8' }}>🏫 {course.group.titre}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{course.chapters?.length || 0} chapitre(s)</span>
                                    <button style={s.cardBtn} onClick={() => { setSelectedCourse(course); setView('detail'); }}>Gérer →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {showAddCourse && (
                <div style={s.modalBg} onClick={() => setShowAddCourse(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>➕ Nouveau cours</h2>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: Python Débutant" value={courseForm.titre} onChange={e => setCourseForm({ ...courseForm, titre: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Description</label>
                            <textarea style={{ ...s.fi, minHeight: '70px', resize: 'vertical' }} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Niveau</label>
                            <select style={s.fi} value={courseForm.niveau} onChange={e => setCourseForm({ ...courseForm, niveau: e.target.value })}>
                                <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                            </select></div>
                        <div style={s.fg}><label style={s.fl}>Groupe assigné *</label>
                            <select style={s.fi} value={courseForm.groupId} onChange={e => setCourseForm({ ...courseForm, groupId: e.target.value })}>
                                <option value="">— Choisir un groupe —</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                            </select>
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>💡 Seuls les étudiants de ce groupe verront ce cours</span>
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddCourse(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createCourse}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditCourse && (
                <div style={s.modalBg} onClick={() => setShowEditCourse(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>✏️ Modifier le cours</h2>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} value={courseForm.titre} onChange={e => setCourseForm({ ...courseForm, titre: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Description</label>
                            <textarea style={{ ...s.fi, minHeight: '70px', resize: 'vertical' }} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Niveau</label>
                            <select style={s.fi} value={courseForm.niveau} onChange={e => setCourseForm({ ...courseForm, niveau: e.target.value })}>
                                <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                            </select></div>
                        <div style={s.fg}><label style={s.fl}>Groupe assigné</label>
                            <select style={s.fi} value={courseForm.groupId} onChange={e => setCourseForm({ ...courseForm, groupId: e.target.value })}>
                                <option value="">— Aucun —</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                            </select></div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEditCourse(false)}>Annuler</button>
                            <button style={s.btnP} onClick={editCourse}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div style={s.ph}>
                <button style={s.btnO} onClick={() => { setView('list'); setSelectedCourse(null); }}>← Mes cours</button>
                <div style={{ flex: 1 }}>
                    <h1 style={s.h1}>{selectedCourse?.titre}</h1>
                    {selectedCourse?.group && <span style={{ fontSize: '12px', color: '#5B2EE8', fontWeight: '700' }}>🏫 {selectedCourse.group.titre}</span>}
                </div>
                <button style={s.btnP} onClick={() => setShowAddChapter(true)}>+ Chapitre</button>
            </div>

            {selectedCourse?.chapters?.length === 0 ? (
                <div style={s.emptyBox}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
                    <div style={s.emptyTitle}>Aucun chapitre</div>
                    <button style={{ ...s.btnP, marginTop: '12px' }} onClick={() => setShowAddChapter(true)}>+ Ajouter</button>
                </div>
            ) : selectedCourse?.chapters?.map((chap, ci) => (
                <div key={chap.id} style={s.chapCard}>
                    <div style={s.chapHeader}>
                        <div style={s.chapNum}>{ci + 1}</div>
                        <div style={s.chapTitle}>{chap.titre}</div>
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{chap.tasks?.length || 0} tâche(s)</span>
                        <button style={{ ...s.lockBtn, background: chap.locked ? '#FFF0F0' : '#ECFDF5', color: chap.locked ? '#CC0033' : '#008060', border: `1px solid ${chap.locked ? '#FFD0D0' : '#BBF7D0'}` }}
                                onClick={() => toggleChapter(chap.id)}>
                            {chap.locked ? '🔒 Verrouillé' : '🔓 Ouvert'}
                        </button>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={s.btnSmP} onClick={() => { setSelectedChapter(chap); setShowAddTask(true); }}>+ Tâche</button>
                            <button style={s.btnSmD} onClick={() => deleteChapter(chap.id)}>🗑️</button>
                        </div>
                    </div>

                    <div style={{ padding: '12px 20px' }}>
                        {chap.tasks?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '16px', color: '#9CA3AF', fontSize: '13px' }}>Aucune tâche</div>
                        ) : chap.tasks?.map(task => (
                            <div key={task.id} style={s.taskItem}>
                                <div style={{ ...s.taskIcon, background: task.type === 'SLIDE' ? 'linear-gradient(135deg,#5B2EE8,#7C52F0)' : 'linear-gradient(135deg,#FF5C35,#FF8C35)' }}>
                                    {task.type === 'SLIDE' ? '📊' : '✏️'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '3px' }}>{task.titre}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ ...s.pill, background: task.type === 'SLIDE' ? '#EDE8FF' : '#FFF0EB', color: task.type === 'SLIDE' ? '#5B2EE8' : '#CC3300' }}>
                      {task.type === 'SLIDE' ? '📊 Slide' : '✏️ Exercice'}
                    </span>
                                        {task.contenuUrl && <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>🔗 Lien</span>}
                                    </div>
                                </div>
                                <button style={{ ...s.lockBtnSm, background: task.locked ? '#FFF0F0' : '#ECFDF5', color: task.locked ? '#CC0033' : '#008060', border: `1px solid ${task.locked ? '#FFD0D0' : '#BBF7D0'}` }}
                                        onClick={() => toggleTask(task.id)}>
                                    {task.locked ? '🔒' : '🔓'}
                                </button>
                                <button style={s.btnSmD} onClick={() => deleteTask(task.id)}>🗑️</button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {showAddChapter && (
                <div style={s.modalBg} onClick={() => setShowAddChapter(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>📖 Nouveau chapitre</h2>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: 1. LES BASES DE PYTHON" value={chapterForm.titre} onChange={e => setChapterForm({ ...chapterForm, titre: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Ordre</label>
                            <input style={s.fi} type="number" min="1" value={chapterForm.ordre} onChange={e => setChapterForm({ ...chapterForm, ordre: parseInt(e.target.value) })} /></div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddChapter(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createChapter}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddTask && (
                <div style={s.modalBg} onClick={() => setShowAddTask(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>➕ Nouvelle tâche</h2>
                        <div style={{ background: '#F8F6FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#5B2EE8', fontWeight: '600' }}>
                            📖 {selectedChapter?.titre}
                        </div>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: Introduction à Python" value={taskForm.titre} onChange={e => setTaskForm({ ...taskForm, titre: e.target.value })} /></div>
                        <div style={s.fg}><label style={s.fl}>Type</label>
                            <select style={s.fi} value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}>
                                <option value="SLIDE">📊 Slide (Présentation)</option>
                                <option value="EXERCISE">✏️ Exercice / Devoir</option>
                            </select></div>
                        {taskForm.type === 'SLIDE' && (
                            <div style={s.fg}><label style={s.fl}>Lien Google Slides</label>
                                <input style={s.fi} placeholder="https://docs.google.com/presentation/..." value={taskForm.contenuUrl} onChange={e => setTaskForm({ ...taskForm, contenuUrl: e.target.value })} /></div>
                        )}
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddTask(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createTask}>Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    btnP: { padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnSmP: { padding: '5px 12px', background: '#5B2EE8', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnSmD: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', color: '#CC0033', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnSmE: { padding: '5px 10px', background: '#EDE8FF', border: 'none', borderRadius: '6px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    lockBtn: { padding: '5px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    lockBtnSm: { padding: '5px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    empty: { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' },
    card: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '20px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    cardIcon: { width: '44px', height: '44px', background: '#EDE8FF', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
    cardTitle: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '6px' },
    cardDesc: { fontSize: '12px', color: '#6B7280', marginBottom: '12px', lineHeight: 1.5 },
    cardBtn: { padding: '7px 14px', background: '#F5F2FF', border: '1.5px solid #EDE8FF', borderRadius: '8px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    pill: { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#F3F4F6', color: '#6B7280' },
    chapCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' },
    chapHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF', flexWrap: 'wrap' },
    chapNum: { width: '28px', height: '28px', background: '#5B2EE8', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 },
    chapTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040', flex: 1 },
    taskItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
    taskIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
};