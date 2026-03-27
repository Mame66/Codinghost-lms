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
    const [showQcmEditor, setShowQcmEditor] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [courseForm, setCourseForm] = useState({ titre: '', description: '', niveau: 'Débutant', groupId: '' });
    const [chapterForm, setChapterForm] = useState({ titre: '', ordre: 1 });
    const [taskForm, setTaskForm] = useState({ titre: '', type: 'SLIDE', contenuUrl: '', description: '' });

    // QCM questions
    const [questions, setQuestions] = useState([
        { question: '', options: ['', '', '', ''], correct: 0 }
    ]);

    useEffect(() => { fetchCourses(); fetchGroups(); }, []);

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

    const refreshCourse = async (id) => {
        const res = await api.get(`/courses/${id}`);
        setSelectedCourse(res.data);
        fetchCourses();
    };

    // ===== COURS =====
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
        try {
            await api.put(`/courses/${selectedCourse.id}`, courseForm);
            setShowEditCourse(false);
            refreshCourse(selectedCourse.id);
        } catch (err) { alert('Erreur modification'); }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Supprimer ce cours ?')) return;
        try {
            await api.delete(`/courses/${id}`);
            setCourses(courses.filter(c => c.id !== id));
            if (selectedCourse?.id === id) { setView('list'); setSelectedCourse(null); }
        } catch (err) { alert('Erreur: ' + err.response?.data?.message); }
    };

    // ===== CHAPITRES =====
    const createChapter = async () => {
        if (!chapterForm.titre) return alert('Titre obligatoire');
        try {
            await api.post(`/courses/${selectedCourse.id}/chapters`, { ...chapterForm, locked: false });
            setShowAddChapter(false);
            setChapterForm({ titre: '', ordre: 1 });
            refreshCourse(selectedCourse.id);
        } catch (err) { alert('Erreur'); }
    };

    const toggleChapter = async (id) => {
        try { await api.put(`/courses/chapters/${id}/toggle`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    const deleteChapter = async (id) => {
        if (!window.confirm('Supprimer ?')) return;
        try { await api.delete(`/courses/chapters/${id}`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    // ===== TÂCHES =====
    const createTask = async () => {
        if (!taskForm.titre) return alert('Titre obligatoire');
        try {
            const res = await api.post(`/courses/chapters/${selectedChapter.id}/tasks`, taskForm);
            // Si QCM, ouvrir l'éditeur de questions
            if (taskForm.type === 'QCM') {
                setEditingTask(res.data);
                setShowAddTask(false);
                setQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                setShowQcmEditor(true);
            } else {
                setShowAddTask(false);
                setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '', description: '' });
                refreshCourse(selectedCourse.id);
            }
        } catch (err) { alert('Erreur'); }
    };

    const saveQcmQuestions = async () => {
        const valid = questions.every(q => q.question && q.options.every(o => o));
        if (!valid) return alert('Remplissez toutes les questions et options');
        try {
            await api.post(`/courses/tasks/${editingTask.id}/questions`, { questions });
            setShowQcmEditor(false);
            setEditingTask(null);
            setTaskForm({ titre: '', type: 'SLIDE', contenuUrl: '', description: '' });
            refreshCourse(selectedCourse.id);
        } catch (err) { alert('Erreur sauvegarde QCM'); }
    };

    const toggleTask = async (id) => {
        try { await api.put(`/courses/tasks/${id}/toggle`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    const deleteTask = async (id) => {
        if (!window.confirm('Supprimer ?')) return;
        try { await api.delete(`/courses/tasks/${id}`); refreshCourse(selectedCourse.id); }
        catch (err) { alert('Erreur'); }
    };

    // ===== QCM EDITOR HELPERS =====
    const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0 }]);
    const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
    const updateQuestion = (i, field, val) => {
        const q = [...questions];
        q[i] = { ...q[i], [field]: val };
        setQuestions(q);
    };
    const updateOption = (qi, oi, val) => {
        const q = [...questions];
        q[qi].options[oi] = val;
        setQuestions(q);
    };

    const typeConfig = {
        SLIDE: { icon: '📊', label: 'Slide', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { icon: '✅', label: 'QCM', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: '📁', label: 'Devoir', color: '#CC3300', bg: '#FFF0EB' },
    };

    // ===== LIST VIEW =====
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
                        <button style={{ ...s.btnP, marginTop: '16px' }} onClick={() => setShowAddCourse(true)}>+ Créer</button>
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
                        <div style={s.fg}><label style={s.fl}>Groupe</label>
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

    // ===== DETAIL VIEW =====
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
                        ) : chap.tasks?.map(task => {
                            const tc = typeConfig[task.type] || typeConfig.SLIDE;
                            return (
                                <div key={task.id} style={s.taskItem}>
                                    <div style={{ ...s.taskIcon, background: `linear-gradient(135deg,${tc.color},${tc.color}99)` }}>
                                        {tc.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '3px' }}>{task.titre}</div>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</span>
                                            {task.contenuUrl && <span style={{ fontSize: '11px', color: '#6B7280' }}>🔗 Lien</span>}
                                            {task.questions?.length > 0 && <span style={{ fontSize: '11px', color: '#008060', fontWeight: '700' }}>{task.questions.length} question(s)</span>}
                                        </div>
                                    </div>
                                    <button style={{ ...s.lockBtnSm, background: task.locked ? '#FFF0F0' : '#ECFDF5', color: task.locked ? '#CC0033' : '#008060', border: `1px solid ${task.locked ? '#FFD0D0' : '#BBF7D0'}` }}
                                            onClick={() => toggleTask(task.id)}>
                                        {task.locked ? '🔒' : '🔓'}
                                    </button>
                                    <button style={s.btnSmD} onClick={() => deleteTask(task.id)}>🗑️</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Modal Add Chapter */}
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

            {/* Modal Add Task */}
            {showAddTask && (
                <div style={s.modalBg} onClick={() => setShowAddTask(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>➕ Nouvelle tâche</h2>
                        <div style={{ background: '#F8F6FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#5B2EE8', fontWeight: '600' }}>
                            📖 {selectedChapter?.titre}
                        </div>
                        <div style={s.fg}><label style={s.fl}>Titre *</label>
                            <input style={s.fi} placeholder="ex: Introduction à Python" value={taskForm.titre} onChange={e => setTaskForm({ ...taskForm, titre: e.target.value })} /></div>

                        {/* Type selector */}
                        <div style={s.fg}>
                            <label style={s.fl}>Type</label>
                            <div style={s.typeGrid}>
                                {[
                                    { type: 'SLIDE', icon: '📊', label: 'Slide', desc: 'Présentation Google Slides' },
                                    { type: 'QCM', icon: '✅', label: 'QCM', desc: 'Questions à choix multiples' },
                                    { type: 'DEVOIR', icon: '📁', label: 'Devoir', desc: 'Rendu fichier PDF/DOC/ZIP' },
                                ].map(t => (
                                    <div key={t.type} style={{
                                        ...s.typeCard,
                                        border: taskForm.type === t.type ? '2px solid #5B2EE8' : '2px solid #E5E0F5',
                                        background: taskForm.type === t.type ? '#F5F2FF' : '#fff',
                                    }} onClick={() => setTaskForm({ ...taskForm, type: t.type })}>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{t.icon}</div>
                                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A1040' }}>{t.label}</div>
                                        <div style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center' }}>{t.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {taskForm.type === 'SLIDE' && (
                            <div style={s.fg}><label style={s.fl}>Lien Google Slides</label>
                                <input style={s.fi} placeholder="https://docs.google.com/presentation/..." value={taskForm.contenuUrl} onChange={e => setTaskForm({ ...taskForm, contenuUrl: e.target.value })} /></div>
                        )}

                        {taskForm.type === 'DEVOIR' && (
                            <div style={s.fg}><label style={s.fl}>Sujet / Instructions</label>
                                <textarea style={{ ...s.fi, minHeight: '100px', resize: 'vertical' }}
                                          placeholder="Décrivez le sujet du devoir, ce que l'étudiant doit faire..."
                                          value={taskForm.description}
                                          onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  💡 L'étudiant pourra rendre son travail en PDF, DOC, ZIP ou lien
                </span>
                            </div>
                        )}

                        {taskForm.type === 'QCM' && (
                            <div style={s.infoBox}>
                                ✅ Après création, vous pourrez ajouter les questions du QCM
                            </div>
                        )}

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAddTask(false)}>Annuler</button>
                            <button style={s.btnP} onClick={createTask}>
                                {taskForm.type === 'QCM' ? 'Créer → Ajouter questions' : 'Créer'}
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
                        <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
                            Créez les questions à choix multiples. Sélectionnez la bonne réponse pour chaque question.
                        </p>

                        {questions.map((q, qi) => (
                            <div key={qi} style={s.qCard}>
                                <div style={s.qHeader}>
                                    <div style={s.qNum}>Q{qi + 1}</div>
                                    <div style={s.fg2}>
                                        <input style={s.fi} placeholder={`Question ${qi + 1}`}
                                               value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} />
                                    </div>
                                    {questions.length > 1 && (
                                        <button style={s.btnSmD} onClick={() => removeQuestion(qi)}>🗑️</button>
                                    )}
                                </div>
                                <div style={s.optionsGrid}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ ...s.optionRow, background: q.correct === oi ? '#ECFDF5' : '#F8F6FF', border: `1.5px solid ${q.correct === oi ? '#00C48C' : '#E5E0F5'}` }}>
                                            <div style={{ ...s.optionLetter, background: q.correct === oi ? '#00C48C' : '#E5E7EB', color: q.correct === oi ? '#fff' : '#6B7280' }}>
                                                {['A', 'B', 'C', 'D'][oi]}
                                            </div>
                                            <input style={s.optionInput} placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}`}
                                                   value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                                            <button
                                                style={{ ...s.correctBtn, background: q.correct === oi ? '#00C48C' : 'transparent', color: q.correct === oi ? '#fff' : '#9CA3AF' }}
                                                onClick={() => updateQuestion(qi, 'correct', oi)}
                                                title="Marquer comme bonne réponse"
                                            >
                                                {q.correct === oi ? '✅' : '○'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button style={{ ...s.btnO, width: '100%', marginBottom: '16px' }} onClick={addQuestion}>
                            + Ajouter une question
                        </button>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => { setShowQcmEditor(false); refreshCourse(selectedCourse.id); }}>
                                Annuler
                            </button>
                            <button style={s.btnP} onClick={saveQcmQuestions}>
                                💾 Sauvegarder le QCM ({questions.length} question(s))
                            </button>
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
    typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' },
    typeCard: { padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' },
    infoBox: { background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#008060', fontWeight: '600', marginBottom: '8px' },
    qCard: { background: '#F8F6FF', borderRadius: '12px', padding: '16px', marginBottom: '14px', border: '1px solid #E5E0F5' },
    qHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
    qNum: { width: '28px', height: '28px', background: '#5B2EE8', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 },
    fg2: { flex: 1 },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
    optionRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px' },
    optionLetter: { width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0 },
    optionInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', fontFamily: 'inherit' },
    correctBtn: { width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', flexShrink: 0 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
};