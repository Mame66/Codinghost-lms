import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Course() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [view, setView] = useState('tasks');
    const [loading, setLoading] = useState(true);

    // Homework states
    const [showHomework, setShowHomework] = useState(false);
    const [homeworkTask, setHomeworkTask] = useState(null);
    const [homeworkText, setHomeworkText] = useState('');
    const [studentId, setStudentId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchStudentId();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            if (res.data.length > 0) {
                setSelectedCourse(res.data[0]);
                const firstUnlocked = res.data[0].chapters.find(c => !c.locked);
                if (firstUnlocked) setSelectedChapter(firstUnlocked);
            }
            setCourses(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchStudentId = async () => {
        try {
            const meRes = await api.get('/auth/me');
            const studentsRes = await api.get('/students');
            const student = studentsRes.data.find(s => s.user?.login === meRes.data.login);
            if (student) {
                setStudentId(student.id);
                // Filtrer les cours par groupe
                if (student.enrollments?.length > 0) {
                    const groupId = student.enrollments[0].group?.id;
                    const res = await api.get(`/courses/group/${groupId}`);
                    // Les tâches disponibles pour ce groupe
                    console.log('Tâches disponibles:', res.data.length);
                }
            }
        } catch (err) { console.error(err); }
    };

    const openTask = (task) => {
        setActiveTask(task);
        if (task.type === 'SLIDE') {
            setView('slide');
        } else {
            setHomeworkTask(task);
            setShowHomework(true);
        }
    };

    const submitHomework = async () => {
        if (!homeworkText.trim()) return alert('Écrivez votre réponse');
        if (!studentId) return alert('Profil étudiant non trouvé');
        setSubmitting(true);
        try {
            await api.post('/homeworks', {
                taskId: homeworkTask.id,
                studentId,
                contenu: homeworkText,
            });
            alert('✅ Devoir soumis avec succès !');
            setShowHomework(false);
            setHomeworkText('');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la soumission');
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Chargement du cours...
        </div>
    );

    if (courses.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' }}>
                Aucun cours disponible
            </div>
            <div style={{ color: '#6B7280', marginTop: '8px' }}>
                Votre enseignant n'a pas encore ajouté de cours
            </div>
        </div>
    );

    // ===== SLIDE VIEW =====
    if (view === 'slide') return (
        <div style={styles.slideWrap}>
            <div style={styles.slideTb}>
                <button style={styles.backBtn} onClick={() => setView('tasks')}>←</button>
                <div style={styles.slideSteps}>
                    {selectedChapter?.tasks.map((t, i) => (
                        <div key={t.id} style={{
                            ...styles.stepCircle,
                            background: t.id === activeTask?.id ? '#5B2EE8' : 'rgba(255,255,255,0.1)',
                            color: t.id === activeTask?.id ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}>
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div style={styles.slideUserBtn}>{selectedCourse?.titre}</div>
            </div>

            <div style={styles.slideMain}>
                {activeTask?.contenuUrl ? (
                    <div style={styles.slideFrameWrap}>
                        <iframe
                            style={styles.slideFrame}
                            src={activeTask.contenuUrl.replace('/edit', '/embed').replace('/pub', '/embed')}
                            allowFullScreen
                            title={activeTask.titre}
                        />
                    </div>
                ) : (
                    <div style={styles.slideCard}>
                        <div style={styles.slideCardInner}>
                            <div style={styles.slideIcon}>📊</div>
                            <h2 style={styles.slideTitle}>{activeTask?.titre}</h2>
                            <p style={styles.slideSubtitle}>Cours · {selectedCourse?.titre}</p>
                        </div>
                        <div style={styles.slideMascot}>🐍</div>
                    </div>
                )}

                <div style={styles.slideControls}>
                    <button style={styles.slideNavBtn}>‹</button>
                    <span style={styles.slidePageNum}>1 · Présentation</span>
                    <button style={styles.slideNavBtn}>›</button>
                </div>

                <button style={styles.nextBtn} onClick={() => setView('tasks')}>
                    Suivant
                </button>
            </div>
        </div>
    );

    // ===== TASKS VIEW =====
    return (
        <div style={styles.courseLayout}>
            {/* Sidebar */}
            <div style={styles.csSidebar}>
                <div style={styles.cssInfo}>
                    <div style={styles.cssHeader}>
                        <div style={styles.cssMascot}>🐍</div>
                        <div>
                            <div style={styles.cssName}>{selectedCourse?.titre}</div>
                            <div style={styles.cssMeta}>{selectedCourse?.niveau}</div>
                        </div>
                    </div>
                </div>

                <div style={styles.chapList}>
                    {selectedCourse?.chapters.map((chap, i) => (
                        <div
                            key={chap.id}
                            style={{
                                ...styles.chap,
                                ...(chap.locked ? styles.chapLocked : {}),
                                ...(selectedChapter?.id === chap.id ? styles.chapOn : {}),
                            }}
                            onClick={() => !chap.locked && setSelectedChapter(chap)}
                        >
                            <div style={{
                                ...styles.chNum,
                                ...(selectedChapter?.id === chap.id ? styles.chNumOn : {}),
                                ...(chap.locked ? styles.chNumLocked : {}),
                            }}>
                                {chap.locked ? '🔒' : i + 1}
                            </div>
                            <div style={styles.chTtl}>{chap.titre}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div style={styles.lcWrap}>
                <div style={styles.lcTitle}>{selectedChapter?.titre}</div>

                <div style={styles.lcTabs}>
                    <div style={{ ...styles.lct, ...styles.lctOn }}>Toutes les tâches</div>
                    <div style={styles.lct}>Incomplètes {selectedChapter?.tasks.length}</div>
                </div>

                <div style={styles.ls}>
                    <div style={styles.lst}>LEÇON · {selectedChapter?.titre}</div>
                    <div style={styles.taskRow}>
                        {selectedChapter?.tasks.map((task, i) => (
                            <div key={task.id} style={styles.taskItem} onClick={() => openTask(task)}>
                                <div style={{
                                    ...styles.taskCircle,
                                    background: task.type === 'SLIDE'
                                        ? 'linear-gradient(135deg, #5B2EE8, #7C52F0)'
                                        : 'linear-gradient(135deg, #FF5C35, #FF8C35)',
                                }}>
                                    <span style={styles.taskCount}>0/3</span>
                                    {i + 1}
                                </div>
                                <div style={styles.taskLabel}>{task.titre}</div>
                                <div style={styles.taskType}>
                                    {task.type === 'SLIDE' ? '📊 Slide' : '✏️ Exercice'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal soumission devoir */}
            {showHomework && (
                <div style={hwStyles.modalBg} onClick={() => setShowHomework(false)}>
                    <div style={hwStyles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={hwStyles.title}>✏️ {homeworkTask?.titre}</h2>
                        <div style={hwStyles.typeBadge}>
                            {homeworkTask?.type === 'EXERCISE' ? '✏️ Exercice' : '📝 Quiz'}
                        </div>
                        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.6 }}>
                            Rédigez votre réponse ci-dessous. Votre enseignant la corrigera et vous donnera une note.
                        </p>
                        <div style={hwStyles.fg}>
                            <label style={hwStyles.fl}>Votre réponse</label>
                            <textarea
                                style={hwStyles.ta}
                                placeholder="Écrivez votre réponse ici..."
                                value={homeworkText}
                                onChange={e => setHomeworkText(e.target.value)}
                            />
                        </div>
                        <div style={hwStyles.foot}>
                            <button style={hwStyles.btnO} onClick={() => setShowHomework(false)}>
                                Annuler
                            </button>
                            <button
                                style={{ ...hwStyles.btnP, opacity: submitting ? 0.7 : 1 }}
                                onClick={submitHomework}
                                disabled={submitting}
                            >
                                {submitting ? 'Envoi...' : '📤 Soumettre le devoir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    courseLayout: { display: 'flex', gap: 0, height: 'calc(100vh - 100px)', margin: '-24px', overflow: 'hidden' },
    csSidebar: { width: '280px', background: '#fff', borderRight: '1px solid #E5E0F5', overflowY: 'auto', flexShrink: 0 },
    cssInfo: { padding: '18px 16px', borderBottom: '1px solid #E5E0F5' },
    cssHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
    cssMascot: { width: '48px', height: '48px', background: '#EDE8FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 },
    cssName: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040' },
    cssMeta: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    chapList: { padding: '8px 0' },
    chap: { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
    chapOn: { background: '#F5F2FF', borderLeftColor: '#5B2EE8' },
    chapLocked: { opacity: 0.5, cursor: 'default' },
    chNum: { width: '26px', height: '26px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8', flexShrink: 0 },
    chNumOn: { background: '#5B2EE8', color: '#fff' },
    chNumLocked: { background: '#E5E7EB', color: '#9CA3AF' },
    chTtl: { fontSize: '13px', fontWeight: '700', color: '#1A1040', lineHeight: 1.3 },
    lcWrap: { flex: 1, overflowY: 'auto', padding: '28px', background: '#F8F6FF' },
    lcTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '16px', textTransform: 'uppercase' },
    lcTabs: { display: 'flex', borderBottom: '2px solid #E5E0F5', marginBottom: '24px' },
    lct: { padding: '8px 18px', fontSize: '13px', fontWeight: '700', color: '#6B7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px' },
    lctOn: { color: '#5B2EE8', borderBottomColor: '#5B2EE8' },
    ls: { marginBottom: '28px' },
    lst: { fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#6B7280', marginBottom: '14px' },
    taskRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    taskItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    taskCircle: { width: '72px', height: '72px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800', position: 'relative', boxShadow: '0 4px 16px rgba(91,46,232,0.3)', transition: 'transform 0.2s' },
    taskCount: { position: 'absolute', top: '-6px', right: '-4px', background: '#fff', border: '2px solid #E5E0F5', borderRadius: '50px', padding: '1px 5px', fontSize: '10px', fontWeight: '800', color: '#6B7280' },
    taskLabel: { fontSize: '12px', fontWeight: '600', color: '#1A1040', textAlign: 'center', maxWidth: '88px', lineHeight: 1.3 },
    taskType: { fontSize: '11px', color: '#6B7280', fontWeight: '600' },
    slideWrap: { position: 'fixed', inset: 0, background: '#111827', display: 'flex', flexDirection: 'column', zIndex: 200 },
    slideTb: { height: '52px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' },
    backBtn: { position: 'absolute', left: '16px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' },
    slideSteps: { display: 'flex', alignItems: 'center', gap: '8px' },
    stepCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    slideUserBtn: { position: 'absolute', right: '16px', padding: '6px 14px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700' },
    slideMain: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' },
    slideFrameWrap: { width: '100%', maxWidth: '960px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', aspectRatio: '16/9' },
    slideFrame: { width: '100%', height: '100%', border: 'none' },
    slideCard: { width: '100%', maxWidth: '860px', background: '#fff', borderRadius: '16px', padding: '60px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '6px solid #5B2EE8', marginBottom: '20px' },
    slideCardInner: { flex: 1 },
    slideIcon: { width: '48px', height: '48px', background: '#5B2EE8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '24px' },
    slideTitle: { fontFamily: 'sans-serif', fontSize: '36px', fontWeight: '900', color: '#1A1040', marginBottom: '8px' },
    slideSubtitle: { fontSize: '14px', color: '#6B7280' },
    slideMascot: { fontSize: '80px', marginLeft: '40px' },
    slideControls: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    slideNavBtn: { width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' },
    slidePageNum: { fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    nextBtn: { width: '100%', maxWidth: '860px', padding: '16px', background: '#FFB800', border: 'none', borderRadius: '12px', fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '700', color: '#1A1040', cursor: 'pointer' },
};

const hwStyles = {
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxWidth: '95vw' },
    title: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    typeBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '50px', background: '#FFF0EB', color: '#CC3300', fontSize: '12px', fontWeight: '800', marginBottom: '12px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    ta: { padding: '12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit' },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    btnP: { padding: '9px 20px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '9px 20px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};