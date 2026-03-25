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
    const [showAddChapter, setShowAddChapter] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);

    const [courseForm, setCourseForm] = useState({ titre: '', description: '', niveau: 'Débutant' });
    const [chapterForm, setChapterForm] = useState({ titre: '', ordre: 1 });
    const [taskForm, setTaskForm] = useState({ titre: '', type: 'SLIDE', contenuUrl: '', groupId: '' });

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

    const createCourse = async () => {
        if (!courseForm.titre) return alert('Le titre est obligatoire');
        try {
            const res = await api.post('/courses', courseForm);
            setCourses([...courses, { ...res.data, chapters: [] }]);
            setShowAddCourse(false);
            setCourseForm({ titre: '', description: '', niveau: 'Débutant' });
        } catch (err) { alert('Erreur création cours'); }
    };

    const createChapter = async () => {
        if (!chapterForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.post(`/courses/${selectedCourse.id}/chapters`, {
                ...chapterForm,
                locked: false,
            });
            setShowAddChapter(false);
            setChapterForm({ titre: '', ordre: 1 });
            const res = await api.get(`/courses/${selectedCourse.id}`);
            setSelectedCourse(res.data);
            fetchCourses();
        } catch (err) { alert('Erreur création chapitre'); }
    };

    const createTask = async () => {
        if (!taskForm.titre) return alert('Le titre est obligatoire');
        try {
            await api.post(`/courses/chapters/${selectedChapter.id}/tasks`, {
                ...taskForm,
                groupId: taskForm.groupId || null,
            });
            setShowAddTask(false);
            setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '', groupId: '' });
            const res = await api.get(`/courses/${selectedCourse.id}`);
            setSelectedCourse(res.data);
            const updatedChapter = res.data.chapters.find(c => c.id === selectedChapter.id);
            setSelectedChapter(updatedChapter);
            fetchCourses();
        } catch (err) { alert('Erreur création tâche'); }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try {
            await api.delete(`/courses/${id}`);
            setCourses(courses.filter(c => c.id !== id));
            if (selectedCourse?.id === id) { setView('list'); setSelectedCourse(null); }
        } catch (err) { alert('Erreur suppression : ' + err.response?.data?.message); }
    };

    const deleteChapter = async (chapterId) => {
        if (!window.confirm('Supprimer ce chapitre ?')) return;
        try {
            await api.delete(`/courses/chapters/${chapterId}`);
            const res = await api.get(`/courses/${selectedCourse.id}`);
            setSelectedCourse(res.data);
        } catch (err) { alert('Erreur suppression : ' + err.response?.data?.message); }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Supprimer cette tâche ?')) return;
        try {
            await api.delete(`/courses/tasks/${taskId}`);
            const res = await api.get(`/courses/${selectedCourse.id}`);
            setSelectedCourse(res.data);
            const updatedChapter = res.data.chapters.find(c => c.id === selectedChapter?.id);
            if (updatedChapter) setSelectedChapter(updatedChapter);
        } catch (err) { alert('Erreur suppression : ' + err.response?.data?.message); }
    };

    // ===== LIST VIEW =====
    if (view === 'list') return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>📚 Mes Cours</h1>
                <button style={styles.btnP} onClick={() => setShowAddCourse(true)}>
                    + Nouveau cours
                </button>
            </div>

            {loading ? (
                <div style={styles.empty}>Chargement...</div>
            ) : courses.length === 0 ? (
                <div style={styles.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                    <div style={styles.emptyTitle}>Aucun cours pour l'instant</div>
                    <div style={styles.emptySub}>Créez votre premier cours !</div>
                    <button style={{ ...styles.btnP, marginTop: '16px' }} onClick={() => setShowAddCourse(true)}>
                        + Créer un cours
                    </button>
                </div>
            ) : (
                <div style={styles.courseGrid}>
                    {courses.map(course => (
                        <div key={course.id} style={styles.courseCard}>
                            <div style={styles.ccTop}>
                                <div style={styles.ccIcon}>📚</div>
                                <div style={styles.ccActions}>
                                    <button style={styles.ccDelBtn} onClick={() => deleteCourse(course.id)}>🗑️</button>
                                </div>
                            </div>
                            <div style={styles.ccTitle}>{course.titre}</div>
                            <div style={styles.ccDesc}>{course.description || 'Aucune description'}</div>
                            <div style={styles.ccMeta}>
                                <span style={styles.pill}>{course.niveau || 'Débutant'}</span>
                                <span style={styles.ccChaps}>{course.chapters?.length || 0} chapitre(s)</span>
                            </div>
                            <button
                                style={styles.ccBtn}
                                onClick={() => { setSelectedCourse(course); setView('detail'); }}
                            >
                                Gérer le cours →
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Ajouter cours */}
            {showAddCourse && (
                <div style={styles.modalBg} onClick={() => setShowAddCourse(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>➕ Nouveau cours</h2>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Titre <span style={{ color: 'red' }}>*</span></label>
                            <input style={styles.fi} placeholder="ex: Python Débutant"
                                   value={courseForm.titre}
                                   onChange={e => setCourseForm({ ...courseForm, titre: e.target.value })} />
                        </div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Description</label>
                            <textarea style={{ ...styles.fi, minHeight: '80px', resize: 'vertical' }}
                                      placeholder="Description du cours..."
                                      value={courseForm.description}
                                      onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
                        </div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Niveau</label>
                            <select style={styles.fi}
                                    value={courseForm.niveau}
                                    onChange={e => setCourseForm({ ...courseForm, niveau: e.target.value })}>
                                <option>Débutant</option>
                                <option>Intermédiaire</option>
                                <option>Avancé</option>
                            </select>
                        </div>
                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowAddCourse(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={createCourse}>Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ===== DETAIL VIEW =====
    return (
        <div>
            <div style={styles.ph}>
                <button style={styles.btnO} onClick={() => { setView('list'); setSelectedCourse(null); }}>
                    ← Mes cours
                </button>
                <h1 style={styles.h1}>{selectedCourse?.titre}</h1>
                <button style={styles.btnP} onClick={() => setShowAddChapter(true)}>
                    + Ajouter chapitre
                </button>
            </div>

            {selectedCourse?.chapters?.length === 0 ? (
                <div style={styles.emptyBox}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
                    <div style={styles.emptyTitle}>Aucun chapitre</div>
                    <button style={{ ...styles.btnP, marginTop: '12px' }} onClick={() => setShowAddChapter(true)}>
                        + Ajouter un chapitre
                    </button>
                </div>
            ) : (
                <div>
                    {selectedCourse?.chapters?.map((chap, ci) => (
                        <div key={chap.id} style={styles.chapCard}>
                            <div style={styles.chapHeader}>
                                <div style={styles.chapNum}>{ci + 1}</div>
                                <div style={styles.chapTitle}>{chap.titre}</div>
                                <div style={styles.chapMeta}>{chap.tasks?.length || 0} tâche(s)</div>
                                <div style={styles.chapActions}>
                                    <button style={styles.btnSmP} onClick={() => {
                                        setSelectedChapter(chap);
                                        setShowAddTask(true);
                                    }}>
                                        + Tâche
                                    </button>
                                    <button style={styles.btnSmD} onClick={() => deleteChapter(chap.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div style={styles.taskList}>
                                {chap.tasks?.length === 0 ? (
                                    <div style={styles.noTasks}>Aucune tâche — cliquez sur "+ Tâche"</div>
                                ) : (
                                    chap.tasks?.map((task) => (
                                        <div key={task.id} style={styles.taskItem}>
                                            <div style={{
                                                ...styles.taskIcon,
                                                background: task.type === 'SLIDE'
                                                    ? 'linear-gradient(135deg,#5B2EE8,#7C52F0)'
                                                    : 'linear-gradient(135deg,#FF5C35,#FF8C35)',
                                            }}>
                                                {task.type === 'SLIDE' ? '📊' : '✏️'}
                                            </div>
                                            <div style={styles.taskInfo}>
                                                <div style={styles.taskTitle}>{task.titre}</div>
                                                <div style={styles.taskMeta}>
                          <span style={{
                              ...styles.pill,
                              background: task.type === 'SLIDE' ? '#EDE8FF' : '#FFF0EB',
                              color: task.type === 'SLIDE' ? '#5B2EE8' : '#CC3300',
                          }}>
                            {task.type === 'SLIDE' ? '📊 Slide' : '✏️ Exercice'}
                          </span>
                                                    {task.groupId && (
                                                        <span style={{ ...styles.pill, background: '#ECFDF5', color: '#008060' }}>
                              👥 Groupe assigné
                            </span>
                                                    )}
                                                    {task.contenuUrl && (
                                                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                              🔗 Lien ajouté
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button style={styles.btnSmD} onClick={() => deleteTask(task.id)}>🗑️</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Ajouter chapitre */}
            {showAddChapter && (
                <div style={styles.modalBg} onClick={() => setShowAddChapter(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>📖 Nouveau chapitre</h2>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Titre <span style={{ color: 'red' }}>*</span></label>
                            <input style={styles.fi} placeholder="ex: 1. LES BASES DE PYTHON"
                                   value={chapterForm.titre}
                                   onChange={e => setChapterForm({ ...chapterForm, titre: e.target.value })} />
                        </div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Ordre</label>
                            <input style={styles.fi} type="number" min="1"
                                   value={chapterForm.ordre}
                                   onChange={e => setChapterForm({ ...chapterForm, ordre: parseInt(e.target.value) })} />
                        </div>
                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowAddChapter(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={createChapter}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ajouter tâche */}
            {showAddTask && (
                <div style={styles.modalBg} onClick={() => setShowAddTask(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>➕ Nouvelle tâche</h2>
                        <div style={{ background: '#F8F6FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#5B2EE8', fontWeight: '600' }}>
                            📖 Chapitre : {selectedChapter?.titre}
                        </div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Titre <span style={{ color: 'red' }}>*</span></label>
                            <input style={styles.fi} placeholder="ex: Introduction à Python"
                                   value={taskForm.titre}
                                   onChange={e => setTaskForm({ ...taskForm, titre: e.target.value })} />
                        </div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Type</label>
                            <select style={styles.fi}
                                    value={taskForm.type}
                                    onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}>
                                <option value="SLIDE">📊 Slide (Présentation)</option>
                                <option value="EXERCISE">✏️ Exercice / Devoir</option>
                            </select>
                        </div>
                        {taskForm.type === 'SLIDE' && (
                            <div style={styles.fg}>
                                <label style={styles.fl}>Lien Google Slides</label>
                                <input style={styles.fi}
                                       placeholder="https://docs.google.com/presentation/..."
                                       value={taskForm.contenuUrl}
                                       onChange={e => setTaskForm({ ...taskForm, contenuUrl: e.target.value })} />
                                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  💡 Collez le lien de partage Google Slides
                </span>
                            </div>
                        )}
                        <div style={styles.fg}>
                            <label style={styles.fl}>Assigner à un groupe</label>
                            <select style={styles.fi}
                                    value={taskForm.groupId}
                                    onChange={e => setTaskForm({ ...taskForm, groupId: e.target.value })}>
                                <option value="">— Tous les groupes —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.titre}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                💡 Si non assigné, tous les étudiants peuvent voir cette tâche
              </span>
                        </div>
                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowAddTask(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={createTask}>Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    ph: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', flex: 1 },
    btnP: { padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnSmP: { padding: '5px 12px', background: '#5B2EE8', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnSmD: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', color: '#CC0033', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    empty: { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    emptySub: { fontSize: '13px', color: '#6B7280' },
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' },
    courseCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '20px' },
    ccTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    ccIcon: { width: '44px', height: '44px', background: '#EDE8FF', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
    ccActions: { display: 'flex', gap: '6px' },
    ccDelBtn: { padding: '5px 8px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    ccTitle: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '6px' },
    ccDesc: { fontSize: '12px', color: '#6B7280', marginBottom: '12px', lineHeight: 1.5 },
    ccMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
    ccChaps: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    ccBtn: { width: '100%', padding: '9px', background: '#F5F2FF', border: '1.5px solid #EDE8FF', borderRadius: '8px', color: '#5B2EE8', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    chapCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' },
    chapHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF' },
    chapNum: { width: '28px', height: '28px', background: '#5B2EE8', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 },
    chapTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040', flex: 1 },
    chapMeta: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    chapActions: { display: 'flex', gap: '6px' },
    taskList: { padding: '12px 20px' },
    noTasks: { textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '13px' },
    taskItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
    taskIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '4px' },
    taskMeta: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
    pill: { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
};