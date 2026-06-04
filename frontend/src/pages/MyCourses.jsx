import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function MyCourses() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [courses, setCourses]               = useState([]);
    const [groups, setGroups]                 = useState([]);
    const [loading, setLoading]               = useState(true);
    const [view, setView]                     = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    const [showAddCourse, setShowAddCourse]   = useState(false);
    const [showEditCourse, setShowEditCourse] = useState(false);
    const [showAddChapter, setShowAddChapter] = useState(false);
    const [showAddTask, setShowAddTask]       = useState(false);
    const [showQcmEditor, setShowQcmEditor]   = useState(false);
    const [editingTask, setEditingTask]       = useState(null);

    const [courseForm, setCourseForm] = useState({ titre: '', description: '', niveau: 'Débutant', groupIds: [] });
    const [chapterForm, setChapterForm] = useState({ titre: '' });
    const [taskForm, setTaskForm] = useState({
        titre: '', type: 'SLIDE', contenuUrl: '', description: '',
        scriptContent: '', scriptLanguage: 'python'
    });
    const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: 0 }]);

    // Drag refs
    const dragItem    = useRef(null);
    const dragOver    = useRef(null);
    const taskDragItem = useRef(null);
    const taskDragOver = useRef(null);

    useEffect(() => { fetchCourses(); fetchGroups(); }, []);

    const fetchCourses = async () => {
        try { const res = await api.get('/courses'); setCourses(res.data); }
        catch (err) { console.error(err); }
        setLoading(false);
    };
    const fetchGroups = async () => {
        try { const res = await api.get('/groups'); setGroups(res.data); }
        catch (err) { console.error(err); }
    };
    const refreshCourse = async (id) => {
        const res = await api.get(`/courses/${id}`);
        setSelectedCourse(res.data);
        fetchCourses();
    };

    // ── COURS ───────────────────────────────────
    const createCourse = async () => {
        if (!courseForm.titre) return alert('Titre obligatoire');
        try {
            await api.post('/courses', courseForm);
            setShowAddCourse(false);
            setCourseForm({ titre: '', description: '', niveau: 'Débutant', groupIds: [] });
            fetchCourses();
        } catch (err) { alert('Erreur création'); }
    };
    const editCourse = async () => {
        if (!courseForm.titre) return alert('Titre obligatoire');
        try {
            await api.put(`/courses/${selectedCourse.id}`, courseForm);
            setShowEditCourse(false);
            refreshCourse(selectedCourse.id);
        } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    };
    const deleteCourse = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try {
            await api.delete(`/courses/${id}`);
            setCourses(courses.filter(c => c.id !== id));
            if (selectedCourse?.id === id) { setView('list'); setSelectedCourse(null); }
        } catch (err) { alert('Erreur'); }
    };
    const toggleAdminLock = async (course) => {
        try {
            await api.put(`/courses/${course.id}`, { lockedByAdmin: !course.lockedByAdmin });
            fetchCourses();
            if (selectedCourse?.id === course.id) refreshCourse(course.id);
        } catch (err) { alert('Erreur'); }
    };

    // ── CHAPITRES ────────────────────────────────
    const createChapter = async () => {
        if (!chapterForm.titre) return alert('Titre obligatoire');
        try {
            await api.post(`/courses/${selectedCourse.id}/chapters`, { titre: chapterForm.titre });
            setShowAddChapter(false);
            setChapterForm({ titre: '' });
            refreshCourse(selectedCourse.id);
        } catch (err) { alert('Erreur'); }
    };
    const toggleChapter = async (id) => {
        try { await api.put(`/courses/chapters/${id}/toggle`); refreshCourse(selectedCourse.id); }
        catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    };
    const deleteChapter = async (id) => {
        if (!window.confirm('Supprimer ce chapitre et ses tâches ?')) return;
        try { await api.delete(`/courses/chapters/${id}`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    // ── DRAG & DROP CHAPITRES ────────────────────
    const handleChapterDragStart = (e, index) => { dragItem.current = index; };
    const handleChapterDragEnter = (e, index) => { dragOver.current = index; };
    const handleChapterDragEnd   = async () => {
        if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
            dragItem.current = null; dragOver.current = null; return;
        }
        const chapters = [...(selectedCourse?.chapters || [])].sort((a, b) => a.ordre - b.ordre);
        const dragged = chapters[dragItem.current];
        chapters.splice(dragItem.current, 1);
        chapters.splice(dragOver.current, 0, dragged);
        dragItem.current = null; dragOver.current = null;
        // ✅ FIX: envoyer orderedIds (tableau d'IDs)
        const orderedIds = chapters.map(c => c.id);
        try { await api.put(`/courses/${selectedCourse.id}/chapters/reorder`, { orderedIds }); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur réorganisation'); }
    };

    // ── DRAG & DROP TÂCHES ───────────────────────
    const handleTaskDragStart = (e, index) => { taskDragItem.current = index; };
    const handleTaskDragEnter = (e, index) => { taskDragOver.current = index; };
    const handleTaskDragEnd   = async (chap) => {
        if (taskDragItem.current === null || taskDragOver.current === null || taskDragItem.current === taskDragOver.current) {
            taskDragItem.current = null; taskDragOver.current = null; return;
        }
        const tasks = [...(chap.tasks || [])].sort((a, b) => a.ordre - b.ordre);
        const dragged = tasks[taskDragItem.current];
        tasks.splice(taskDragItem.current, 1);
        tasks.splice(taskDragOver.current, 0, dragged);
        taskDragItem.current = null; taskDragOver.current = null;
        // ✅ FIX: envoyer orderedIds (tableau d'IDs)
        const orderedIds = tasks.map(t => t.id);
        try { await api.put(`/courses/chapters/${chap.id}/tasks/reorder`, { orderedIds }); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur réorganisation tâches'); }
    };

    // ── TÂCHES ───────────────────────────────────
    const createTask = async () => {
        if (!taskForm.titre) return alert('Titre obligatoire');
        try {
            const payload = {
                titre:       taskForm.titre,
                type:        taskForm.type,
                contenuUrl:  taskForm.contenuUrl  || null,
                description: taskForm.description || null,
            };
            // Champs script
            if (taskForm.type === 'SCRIPT') {
                payload.scriptContent  = taskForm.scriptContent  || null;
                payload.scriptLanguage = taskForm.scriptLanguage || 'python';
            }
            const res = await api.post(`/courses/chapters/${selectedChapter.id}/tasks`, payload);
            if (taskForm.type === 'QCM') {
                setEditingTask(res.data);
                setShowAddTask(false);
                setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                setShowQcmEditor(true);
            } else {
                setShowAddTask(false);
                setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '', description: '', scriptContent: '', scriptLanguage: 'python' });
                refreshCourse(selectedCourse.id);
            }
        } catch (err) { alert(err.response?.data?.message || 'Erreur création tâche'); }
    };

    const saveQcm = async () => {
        const valid = questions.every(q => q.question && q.options.every(o => o));
        if (!valid) return alert('Remplissez toutes les questions et options');
        try {
            await api.post(`/courses/tasks/${editingTask.id}/questions`, { questions });
            setShowQcmEditor(false);
            setEditingTask(null);
            setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '', description: '', scriptContent: '', scriptLanguage: 'python' });
            refreshCourse(selectedCourse.id);
        } catch (err) { alert('Erreur QCM'); }
    };

    const toggleTask = async (id) => {
        try { await api.put(`/courses/tasks/${id}/toggle`); refreshCourse(selectedCourse.id); }
        catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    };
    const deleteTask = async (id) => {
        if (!window.confirm('Supprimer cette tâche ?')) return;
        try { await api.delete(`/courses/tasks/${id}`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    // QCM helpers
    const addQuestion    = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }]);
    const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
    const updateQuestion = (i, field, val) => { const q = [...questions]; q[i] = { ...q[i], [field]: val }; setQuestions(q); };
    const updateOption   = (qi, oi, val) => { const q = [...questions]; q[qi].options[oi] = val; setQuestions(q); };
    const canModify      = (course) => isAdmin || course?.createdBy === user?.id;

    const typeConfig = {
        SLIDE:  { emoji: '📊', label: 'Slide',  desc: 'Présentation',           color: '#5B2EE8', bg: '#EDE8FF' },
        QCM:    { emoji: '✅', label: 'QCM',    desc: 'Questions choix multiples', color: '#059669', bg: '#ECFDF5' },
        DEVOIR: { emoji: '📁', label: 'Devoir', desc: 'Rendu fichier/texte',     color: '#DC2626', bg: '#FEF2F2' },
        SCRIPT: { emoji: '💻', label: 'Script', desc: 'Code Python/JS/HTML',     color: '#0284C7', bg: '#E0F2FE' },
    };

    const LANGUAGES = ['python', 'javascript', 'html', 'css', 'scratch'];

    // GroupSelector — OUTSIDE render pour éviter le bug curseur
    const GroupSelector = ({ selectedIds, onChange }) => (
        <div style={gs.wrap}>
            {groups.map(g => (
                <div key={g.id} style={{ ...gs.item, border: selectedIds.includes(g.id) ? '2px solid #5B2EE8' : '2px solid #E5E0F5', background: selectedIds.includes(g.id) ? '#F5F2FF' : '#fff' }}
                     onClick={() => {
                         const ids = selectedIds.includes(g.id) ? selectedIds.filter(id => id !== g.id) : [...selectedIds, g.id];
                         onChange(ids);
                     }}>
                    <span style={{ fontSize: '14px' }}>{selectedIds.includes(g.id) ? '✅' : '○'}</span>
                    <span style={gs.name}>{g.titre}</span>
                </div>
            ))}
        </div>
    );

    // ── VUE LISTE ────────────────────────────────
    if (view === 'list') return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>{isAdmin ? 'Tous les cours' : 'Mes Cours'}</h1>
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
                            <div key={course.id} style={{ ...s.card, border: course.lockedByAdmin ? '1px solid #FECACA' : '1px solid #E5E0F5' }}>
                                <div style={s.cardTop}>
                                    <div style={s.cardIcon}>📚</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {isAdmin && (
                                            <button style={{ ...s.btnSmE, background: course.lockedByAdmin ? '#FEF2F2' : '#ECFDF5', color: course.lockedByAdmin ? '#DC2626' : '#059669' }}
                                                    onClick={() => toggleAdminLock(course)}>
                                                {course.lockedByAdmin ? '🔒 Admin' : '🔓 Libre'}
                                            </button>
                                        )}
                                        {canModify(course) && (
                                            <>
                                                <button style={s.btnSmE} onClick={() => {
                                                    setSelectedCourse(course);
                                                    setCourseForm({ titre: course.titre, description: course.description || '', niveau: course.niveau || 'Débutant', groupIds: course.courseGroups?.map(cg => cg.groupId) || [] });
                                                    setShowEditCourse(true);
                                                }}>✏️</button>
                                                <button style={s.btnSmD} onClick={() => deleteCourse(course.id)}>🗑️</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {course.lockedByAdmin && !isAdmin && <div style={s.adminLockBadge}>🔒 Verrouillé par l'admin</div>}
                                <div style={s.cardTitle}>{course.titre}</div>
                                <div style={s.cardDesc}>{course.description || 'Aucune description'}</div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {course.courseGroups?.map(cg => (
                                        <span key={cg.id} style={s.groupTag}>🏫 {cg.group?.titre}</span>
                                    ))}
                                    {(!course.courseGroups || course.courseGroups.length === 0) && <span style={s.noGroup}>Aucun groupe</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                    {course.chapters?.length || 0} chapitre(s)
                  </span>
                                    <button style={s.cardBtn} onClick={() => { setSelectedCourse(course); setView('detail'); }}>
                                        Gérer →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* Modal Add Course */}
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
                        <div style={s.fg}>
                            <label style={s.fl}>Groupes assignés</label>
                            <GroupSelector selectedIds={courseForm.groupIds} onChange={ids => setCourseForm({ ...courseForm, groupIds: ids })} />
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddCourse(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createCourse}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Course */}
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
                        <div style={s.fg}>
                            <label style={s.fl}>Groupes assignés</label>
                            <GroupSelector selectedIds={courseForm.groupIds} onChange={ids => setCourseForm({ ...courseForm, groupIds: ids })} />
                        </div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEditCourse(false)}>Annuler</button>
                            <button style={s.btnP} onClick={editCourse}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ── VUE DÉTAIL ───────────────────────────────
    const sortedChapters = [...(selectedCourse?.chapters || [])].sort((a, b) => a.ordre - b.ordre);

    return (
        <div>
            <div style={s.ph}>
                <button style={s.btnO} onClick={() => { setView('list'); setSelectedCourse(null); }}>← Cours</button>
                <div style={{ flex: 1 }}>
                    <h1 style={s.h1}>{selectedCourse?.titre}</h1>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {selectedCourse?.courseGroups?.map(cg => (
                            <span key={cg.id} style={s.groupTag}>🏫 {cg.group?.titre}</span>
                        ))}
                    </div>
                </div>
                {canModify(selectedCourse) && !selectedCourse?.lockedByAdmin && (
                    <button style={s.btnP} onClick={() => setShowAddChapter(true)}>+ Chapitre</button>
                )}
            </div>

            {/* Bandeau verrouillé admin */}
            {selectedCourse?.lockedByAdmin && !isAdmin && (
                <div style={s.lockedBanner}>
                    🔒 Ce cours est verrouillé par l'administrateur — vous ne pouvez pas le modifier
                </div>
            )}

            <div style={s.dragInfo}>🖱️ Glissez-déposez les chapitres et tâches pour les réordonner</div>

            {sortedChapters.length === 0 ? (
                <div style={s.emptyBox}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
                    <div style={s.emptyTitle}>Aucun chapitre</div>
                    {canModify(selectedCourse) && !selectedCourse?.lockedByAdmin && (
                        <button style={{ ...s.btnP, marginTop: '12px' }} onClick={() => setShowAddChapter(true)}>+ Ajouter</button>
                    )}
                </div>
            ) : sortedChapters.map((chap, ci) => {
                const sortedTasks = [...(chap.tasks || [])].sort((a, b) => a.ordre - b.ordre);
                return (
                    <div key={chap.id} style={s.chapCard}
                         draggable={canModify(selectedCourse) && !selectedCourse?.lockedByAdmin}
                         onDragStart={e => handleChapterDragStart(e, ci)}
                         onDragEnter={e => handleChapterDragEnter(e, ci)}
                         onDragEnd={handleChapterDragEnd}
                         onDragOver={e => e.preventDefault()}>
                        <div style={s.chapHeader}>
                            {canModify(selectedCourse) && <div style={s.dragHandle}>⠿</div>}
                            <div style={s.chapNum}>{ci + 1}</div>
                            <div style={s.chapTitle}>{chap.titre}</div>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{chap.tasks?.length || 0} tâche(s)</span>
                            {canModify(selectedCourse) && !selectedCourse?.lockedByAdmin && (
                                <>
                                    <button style={{ ...s.lockBtn, background: chap.locked ? '#FEF2F2' : '#ECFDF5', color: chap.locked ? '#DC2626' : '#059669', border: `1px solid ${chap.locked ? '#FECACA' : '#BBF7D0'}` }}
                                            onClick={() => toggleChapter(chap.id)}>
                                        {chap.locked ? '🔒 Verrouillé' : '🔓 Ouvert'}
                                    </button>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button style={s.btnSmP} onClick={() => { setSelectedChapter(chap); setShowAddTask(true); }}>+ Tâche</button>
                                        <button style={s.btnSmD} onClick={() => deleteChapter(chap.id)}>🗑️</button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ padding: '8px 20px' }}>
                            {sortedTasks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '14px', color: '#9CA3AF', fontSize: '13px' }}>Aucune tâche</div>
                            ) : sortedTasks.map((task, ti) => {
                                const tc = typeConfig[task.type] || typeConfig.SLIDE;
                                return (
                                    <div key={task.id} style={s.taskItem}
                                         draggable={canModify(selectedCourse) && !selectedCourse?.lockedByAdmin}
                                         onDragStart={e => handleTaskDragStart(e, ti)}
                                         onDragEnter={e => handleTaskDragEnter(e, ti)}
                                         onDragEnd={() => handleTaskDragEnd(chap)}
                                         onDragOver={e => e.preventDefault()}>
                                        {canModify(selectedCourse) && <div style={s.dragHandleSm}>⠿</div>}
                                        <div style={{ ...s.taskIcon, background: tc.bg }}>
                                            <span style={{ fontSize: '18px' }}>{tc.emoji}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '3px' }}>{task.titre}</div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>{tc.emoji} {tc.label}</span>
                                                {task.contenuUrl && <span style={{ fontSize: '11px', color: '#6B7280' }}>🔗 Lien</span>}
                                                {task.scriptLanguage && task.type === 'SCRIPT' && (
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284C7', background: '#E0F2FE', padding: '2px 7px', borderRadius: '5px' }}>{task.scriptLanguage}</span>
                                                )}
                                                {task.questions?.length > 0 && <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>{task.questions.length} Q</span>}
                                            </div>
                                        </div>
                                        {canModify(selectedCourse) && !selectedCourse?.lockedByAdmin && (
                                            <>
                                                <button style={{ ...s.lockBtnSm, background: task.locked ? '#FEF2F2' : '#ECFDF5', color: task.locked ? '#DC2626' : '#059669', border: `1px solid ${task.locked ? '#FECACA' : '#BBF7D0'}` }}
                                                        onClick={() => toggleTask(task.id)}>
                                                    {task.locked ? '🔒' : '🔓'}
                                                </button>
                                                <button style={s.btnSmD} onClick={() => deleteTask(task.id)}>🗑️</button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Modal Add Chapter */}
            {showAddChapter && (
                <div style={s.modalBg} onClick={() => setShowAddChapter(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>📖 Nouveau chapitre</h2>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: 1. Les bases de Python" value={chapterForm.titre} onChange={e => setChapterForm({ titre: e.target.value })} /></div>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddChapter(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createChapter}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Task — avec SCRIPT */}
            {showAddTask && (
                <div style={s.modalBg} onClick={() => setShowAddTask(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>Nouvelle tâche</h2>
                        <div style={{ background: '#F8F6FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#5B2EE8', fontWeight: '600' }}>
                            📖 {selectedChapter?.titre}
                        </div>

                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: Introduction à Python" value={taskForm.titre} onChange={e => setTaskForm({ ...taskForm, titre: e.target.value })} /></div>

                        {/* Sélecteur de type — 4 options avec SCRIPT */}
                        <div style={s.fg}>
                            <label style={s.fl}>Type</label>
                            <div style={s.typeGrid}>
                                {Object.entries(typeConfig).map(([type, tc]) => (
                                    <div key={type} style={{ ...s.typeCard, border: taskForm.type === type ? `2px solid ${tc.color}` : '2px solid #E5E0F5', background: taskForm.type === type ? tc.bg : '#fff' }}
                                         onClick={() => setTaskForm({ ...taskForm, type })}>
                                        <div style={{ fontSize: '26px', marginBottom: '4px' }}>{tc.emoji}</div>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: taskForm.type === type ? tc.color : '#1A1040' }}>{tc.label}</div>
                                        <div style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center', lineHeight: 1.3 }}>{tc.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Champs selon le type */}
                        {taskForm.type === 'SLIDE' && (
                            <div style={s.fg}><label style={s.fl}>Lien Google Slides</label>
                                <input style={s.fi} placeholder="https://docs.google.com/presentation/..." value={taskForm.contenuUrl} onChange={e => setTaskForm({ ...taskForm, contenuUrl: e.target.value })} /></div>
                        )}
                        {taskForm.type === 'DEVOIR' && (
                            <div style={s.fg}><label style={s.fl}>Sujet / Instructions</label>
                                <textarea style={{ ...s.fi, minHeight: '80px', resize: 'vertical' }} placeholder="Décrivez le sujet..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
                        )}
                        {taskForm.type === 'QCM' && (
                            <div style={s.infoBox}>✅ Après création vous pourrez ajouter les questions</div>
                        )}
                        {taskForm.type === 'SCRIPT' && (
                            <>
                                <div style={s.fg}>
                                    <label style={s.fl}>Langage</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {['python', 'javascript', 'html', 'css', 'scratch'].map(lang => (
                                            <button key={lang} type="button"
                                                    style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', border: taskForm.scriptLanguage === lang ? '2px solid #0284C7' : '2px solid #E5E0F5', background: taskForm.scriptLanguage === lang ? '#E0F2FE' : '#fff', color: taskForm.scriptLanguage === lang ? '#0284C7' : '#6B7280' }}
                                                    onClick={() => setTaskForm({ ...taskForm, scriptLanguage: lang })}>
                                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={s.fg}>
                                    <label style={s.fl}>Instructions (optionnel)</label>
                                    <textarea style={{ ...s.fi, minHeight: '60px', resize: 'vertical' }} placeholder="Expliquez ce que doit faire le script..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                </div>
                                <div style={s.fg}>
                                    <label style={s.fl}>Code du script</label>
                                    <textarea style={{ ...s.fi, minHeight: '160px', resize: 'vertical', fontFamily: 'Courier New, monospace', fontSize: '13px', lineHeight: 1.6 }}
                                              placeholder={taskForm.scriptLanguage === 'python' ? '# Écrivez votre code Python ici\nprint("Hello, World!")' : taskForm.scriptLanguage === 'javascript' ? '// Votre code JavaScript\nconsole.log("Hello!");' : '<!-- Votre code HTML -->'}
                                              value={taskForm.scriptContent}
                                              onChange={e => setTaskForm({ ...taskForm, scriptContent: e.target.value })} />
                                </div>
                            </>
                        )}

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddTask(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createTask}>
                                <span style={{ fontSize: '14px' }}>💾</span>
                                {taskForm.type === 'QCM' ? 'Créer → Questions' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QCM Editor */}
            {showQcmEditor && (
                <div style={s.modalBg}>
                    <div style={{ ...s.modal, width: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
                        <h2 style={s.modalTitle}>✅ Questions QCM — {editingTask?.titre}</h2>
                        {questions.map((q, qi) => (
                            <div key={qi} style={s.qCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <div style={s.qNum}>Q{qi + 1}</div>
                                    <input style={{ ...s.fi, flex: 1 }} placeholder={`Question ${qi + 1}`} value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} />
                                    {questions.length > 1 && <button style={s.btnSmD} onClick={() => removeQuestion(qi)}>🗑️</button>}
                                </div>
                                <div style={s.optionsGrid}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ ...s.optionRow, background: q.correct === oi ? '#ECFDF5' : '#F8F6FF', border: `1.5px solid ${q.correct === oi ? '#A7F3D0' : '#E5E0F5'}` }}>
                                            <div style={{ ...s.optionLetter, background: q.correct === oi ? '#059669' : '#E5E7EB', color: q.correct === oi ? '#fff' : '#6B7280' }}>{['A','B','C','D'][oi]}</div>
                                            <input style={s.optionInput} placeholder={`Option ${['A','B','C','D'][oi]}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                                            <button style={{ ...s.correctBtn, background: q.correct === oi ? '#059669' : 'transparent', color: q.correct === oi ? '#fff' : '#9CA3AF' }}
                                                    onClick={() => updateQuestion(qi, 'correct', oi)}>
                                                {q.correct === oi ? '✅' : '○'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button style={{ ...s.btnO, width: '100%', marginBottom: '16px' }} onClick={addQuestion}>+ Question</button>
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => { setShowQcmEditor(false); refreshCourse(selectedCourse.id); }}>Annuler</button>
                            <button style={s.btnP} onClick={saveQcm}>💾 Sauvegarder ({questions.length} Q)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const gs = {
    wrap: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', border: '1.5px solid #E5E0F5', borderRadius: '9px', padding: '8px', background: '#F8F6FF' },
    item: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' },
    name: { fontSize: '13px', fontWeight: '600', color: '#1A1040' },
};

const s = {
    ph:           { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
    h1:           { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', flex: 1 },
    btnP:         { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    btnO:         { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnSmP:       { padding: '5px 12px', background: '#5B2EE8', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    btnSmD:       { padding: '5px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    btnSmE:       { padding: '5px 10px', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    lockBtn:      { padding: '5px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    lockBtnSm:    { padding: '5px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    lockedBanner: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#DC2626', fontWeight: '700', marginBottom: '14px' },
    dragInfo:     { background: '#F8F6FF', border: '1px dashed #C4B5FD', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#5B2EE8', fontWeight: '600', marginBottom: '16px' },
    dragHandle:   { cursor: 'grab', fontSize: '18px', color: '#9CA3AF', marginRight: '4px', userSelect: 'none' },
    dragHandleSm: { cursor: 'grab', fontSize: '16px', color: '#9CA3AF', userSelect: 'none' },
    empty:        { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox:     { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle:   { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' },
    card:         { background: '#fff', borderRadius: '14px', padding: '20px' },
    cardTop:      { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' },
    cardIcon:     { width: '44px', height: '44px', background: '#EDE8FF', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
    cardTitle:    { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '6px' },
    cardDesc:     { fontSize: '12px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.5 },
    cardBtn:      { padding: '7px 14px', background: '#F5F2FF', border: '1.5px solid #EDE8FF', borderRadius: '8px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    adminLockBadge: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#DC2626', marginBottom: '8px', display: 'inline-block' },
    groupTag:     { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8' },
    noGroup:      { fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' },
    pill:         { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    chapCard:     { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', marginBottom: '12px', overflow: 'hidden' },
    chapHeader:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF', flexWrap: 'wrap' },
    chapNum:      { width: '26px', height: '26px', background: '#5B2EE8', color: '#fff', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 },
    chapTitle:    { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', flex: 1 },
    taskItem:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #F3F4F6' },
    taskIcon:     { width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    // Type selector — grille 2x2 pour 4 types
    typeGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    typeCard:     { padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' },
    infoBox:      { background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#059669', fontWeight: '600', marginBottom: '8px' },
    qCard:        { background: '#F8F6FF', borderRadius: '12px', padding: '16px', marginBottom: '14px', border: '1px solid #E5E0F5' },
    qNum:         { width: '28px', height: '28px', background: '#5B2EE8', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 },
    optionsGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
    optionRow:    { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px' },
    optionLetter: { width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0 },
    optionInput:  { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', fontFamily: 'inherit' },
    correctBtn:   { width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', flexShrink: 0 },
    modalBg:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:        { background: '#fff', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle:   { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot:    { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    fg:           { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl:           { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi:           { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
};