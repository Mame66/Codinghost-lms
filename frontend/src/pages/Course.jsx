import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Course() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [view, setView] = useState('tasks'); // tasks | slide | exercise
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
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
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const openTask = (task) => {
        setActiveTask(task);
        setView(task.type === 'SLIDE' ? 'slide' : 'exercise');
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Chargement du cours...
        </div>
    );

    // ===== SLIDE VIEW =====
    if (view === 'slide') return (
        <div style={styles.slideWrap}>
            {/* Topbar */}
            <div style={styles.slideTb}>
                <button style={styles.backBtn} onClick={() => setView('tasks')}>←</button>
                <div style={styles.slideSteps}>
                    {selectedChapter?.tasks.map((t, i) => (
                        <div key={t.id} style={{
                            ...styles.stepCircle,
                            background: t.id === activeTask?.id ? '#5B2EE8' : 'rgba(255,255,255,0.1)',
                            color: t.id === activeTask?.id ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}>
                            {t.locked ? '🔒' : i + 1}
                        </div>
                    ))}
                </div>
                <div style={styles.slideUserBtn}>{selectedCourse?.titre}</div>
            </div>

            {/* Slide content */}
            <div style={styles.slideMain}>
                <div style={styles.slideCard}>
                    <div style={styles.slideCardInner}>
                        <div style={styles.slideIcon}>📊</div>
                        <h2 style={styles.slideTitle}>{activeTask?.titre}</h2>
                        <p style={styles.slideSubtitle}>Cours · {selectedCourse?.titre}</p>
                    </div>
                    <div style={styles.slideMascot}>🐍</div>
                </div>

                {/* Controls */}
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

    // ===== EXERCISE VIEW =====
    if (view === 'exercise') return (
        <div style={styles.exWrap}>
            {/* Topbar */}
            <div style={styles.exTb}>
                <button style={styles.exBackBtn} onClick={() => setView('tasks')}>←</button>
                <div style={styles.exSteps}>
                    {selectedChapter?.tasks.map((t, i) => (
                        <div key={t.id} style={{
                            ...styles.exCircle,
                            background: t.id === activeTask?.id ? '#fff' : 'rgba(0,0,0,0.3)',
                            color: t.id === activeTask?.id ? '#5B2EE8' : 'rgba(255,255,255,0.4)',
                            border: t.id === activeTask?.id
                                ? '2px solid #fff'
                                : '2px solid rgba(255,255,255,0.2)',
                        }}>
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div style={styles.exUserBtn}>{selectedCourse?.titre}</div>
            </div>

            {/* Exercise body */}
            <div style={styles.exBody}>
                <div style={styles.exQuestion}>
                    {activeTask?.titre}
                </div>
                <div style={styles.exChoices}>
                    {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, i) => (
                        <div
                            key={i}
                            style={styles.exChoice}
                            onClick={e => {
                                document.querySelectorAll('.ex-choice-item').forEach(el => {
                                    el.style.borderColor = 'transparent';
                                });
                                e.currentTarget.style.borderColor = '#5B2EE8';
                            }}
                            className="ex-choice-item"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.exFoot}>
                <button style={styles.exResetBtn}>↺</button>
                <button style={styles.exAnswerBtn} onClick={() => setView('tasks')}>
                    RÉPONSE
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
                    <div style={styles.lct}>
                        Incomplètes {selectedChapter?.tasks.length}
                    </div>
                </div>

                {/* Tasks */}
                <div style={styles.ls}>
                    <div style={styles.lst}>LEÇON 1 · {selectedChapter?.titre}</div>
                    <div style={styles.taskRow}>
                        {selectedChapter?.tasks.map((task, i) => (
                            <div
                                key={task.id}
                                style={styles.taskItem}
                                onClick={() => openTask(task)}
                            >
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
        </div>
    );
}

const styles = {
    // Layout
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

    // Tasks
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

    // Slide view
    slideWrap: { position: 'fixed', inset: 0, background: '#111827', display: 'flex', flexDirection: 'column', zIndex: 200 },
    slideTb: { height: '52px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' },
    backBtn: { position: 'absolute', left: '16px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' },
    slideSteps: { display: 'flex', alignItems: 'center', gap: '8px' },
    stepCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    slideUserBtn: { position: 'absolute', right: '16px', padding: '6px 14px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700' },
    slideMain: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' },
    slideCard: { width: '100%', maxWidth: '860px', background: '#fff', borderRadius: '16px', padding: '60px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '6px solid #5B2EE8', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
    slideCardInner: { flex: 1 },
    slideIcon: { width: '48px', height: '48px', background: '#5B2EE8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '24px' },
    slideTitle: { fontFamily: 'sans-serif', fontSize: '36px', fontWeight: '900', color: '#1A1040', marginBottom: '8px' },
    slideSubtitle: { fontSize: '14px', color: '#6B7280' },
    slideMascot: { fontSize: '80px', marginLeft: '40px' },
    slideControls: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    slideNavBtn: { width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' },
    slidePageNum: { fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    nextBtn: { width: '100%', maxWidth: '860px', padding: '16px', background: '#FFB800', border: 'none', borderRadius: '12px', fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '700', color: '#1A1040', cursor: 'pointer' },

    // Exercise view
    exWrap: { position: 'fixed', inset: 0, background: '#7C3AED', display: 'flex', flexDirection: 'column', zIndex: 200 },
    exTb: { height: '52px', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative' },
    exBackBtn: { position: 'absolute', left: '16px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' },
    exSteps: { display: 'flex', alignItems: 'center', gap: '8px' },
    exCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    exUserBtn: { position: 'absolute', right: '16px', padding: '6px 14px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700' },
    exBody: { flex: 1, padding: '40px', display: 'flex', gap: '24px', alignItems: 'flex-start', maxWidth: '900px', margin: '0 auto', width: '100%' },
    exQuestion: { width: '240px', flexShrink: 0, background: 'rgba(255,255,255,0.95)', borderRadius: '14px', padding: '22px', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700', color: '#1A1040', lineHeight: 1.4 },
    exChoices: { display: 'flex', flexDirection: 'column', gap: '12px' },
    exChoice: { background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '16px 22px', fontSize: '14px', fontWeight: '600', color: '#1A1040', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s', minWidth: '200px', textAlign: 'center' },
    exFoot: { display: 'flex', gap: '12px', padding: '0 40px 32px' },
    exResetBtn: { width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' },
    exAnswerBtn: { padding: '0 32px', height: '48px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '14px', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' },
};