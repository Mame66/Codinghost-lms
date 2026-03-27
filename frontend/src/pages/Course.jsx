import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Course() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [view, setView] = useState('tasks');
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState(null);

    // QCM state
    const [qcmQuestions, setQcmQuestions] = useState([]);
    const [qcmAnswers, setQcmAnswers] = useState({});
    const [qcmSubmitted, setQcmSubmitted] = useState(false);
    const [qcmResult, setQcmResult] = useState(null);

    // Devoir state
    const [showDevoir, setShowDevoir] = useState(false);
    const [devoirTask, setDevoirTask] = useState(null);
    const [devoirLien, setDevoirLien] = useState('');
    const [devoirFile, setDevoirFile] = useState(null);
    const [devoirNote, setDevoirNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/courses/my');
            setCourses(res.data);
            if (res.data.length > 0) {
                setSelectedCourse(res.data[0]);
                const first = res.data[0].chapters.find(c => !c.locked);
                if (first) setSelectedChapter(first);
            }
            const meRes = await api.get('/auth/me');
            const studentsRes = await api.get('/students');
            const student = studentsRes.data.find(s => s.user?.login === meRes.data.login);
            if (student) setStudentId(student.id);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const openTask = async (task) => {
        if (task.locked) return;
        setActiveTask(task);

        if (task.type === 'SLIDE') {
            setView('slide');
        } else if (task.type === 'QCM') {
            // Charger les questions
            try {
                const res = await api.get(`/courses/tasks/${task.id}/questions`);
                setQcmQuestions(res.data);
                setQcmAnswers({});
                setQcmSubmitted(false);
                setQcmResult(null);
                setView('qcm');
            } catch (err) { alert('Erreur chargement QCM'); }
        } else if (task.type === 'DEVOIR') {
            setDevoirTask(task);
            setDevoirLien('');
            setDevoirFile(null);
            setDevoirNote('');
            setShowDevoir(true);
        }
    };

    // ===== SUBMIT QCM =====
    const submitQcm = async () => {
        if (Object.keys(qcmAnswers).length < qcmQuestions.length) {
            return alert('Répondez à toutes les questions avant de soumettre');
        }

        // Calculer le score
        let correct = 0;
        qcmQuestions.forEach((q, i) => {
            if (qcmAnswers[i] === q.correct) correct++;
        });
        const score = Math.round((correct / qcmQuestions.length) * 20);

        try {
            await api.post('/homeworks', {
                taskId: activeTask.id,
                studentId,
                contenu: `QCM soumis - Score: ${correct}/${qcmQuestions.length}`,
                qcmAnswers: JSON.stringify(qcmAnswers),
            });
            setQcmSubmitted(true);
            setQcmResult({ correct, total: qcmQuestions.length, score });
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur soumission');
        }
    };

    // ===== SUBMIT DEVOIR =====
    const submitDevoir = async () => {
        if (!devoirLien && !devoirFile && !devoirNote) {
            return alert('Ajoutez un fichier, un lien ou une note');
        }
        setSubmitting(true);
        try {
            await api.post('/homeworks', {
                taskId: devoirTask.id,
                studentId,
                contenu: devoirNote,
                lienRendu: devoirLien || null,
            });
            alert('✅ Devoir soumis avec succès !');
            setShowDevoir(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur soumission');
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Chargement...</div>
    );

    if (courses.length === 0) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' }}>Aucun cours disponible</div>
            <div style={{ color: '#6B7280', marginTop: '8px', fontSize: '13px' }}>
                Vous n'êtes pas encore assigné à un groupe ou votre enseignant n'a pas encore ajouté de cours.
            </div>
        </div>
    );

    // ===== SLIDE VIEW =====
    if (view === 'slide') return (
        <div style={s.slideWrap}>
            <div style={s.slideTb}>
                <button style={s.backBtn} onClick={() => setView('tasks')}>←</button>
                <div style={s.slideSteps}>
                    {selectedChapter?.tasks.filter(t => !t.locked).map((t, i) => (
                        <div key={t.id} style={{ ...s.stepCircle, background: t.id === activeTask?.id ? '#5B2EE8' : 'rgba(255,255,255,0.1)', color: t.id === activeTask?.id ? '#fff' : 'rgba(255,255,255,0.4)' }}>{i + 1}</div>
                    ))}
                </div>
                <div style={s.slideUserBtn}>{selectedCourse?.titre}</div>
            </div>
            <div style={s.slideMain}>
                {activeTask?.contenuUrl ? (
                    <div style={s.slideFrameWrap}>
                        <iframe style={s.slideFrame} src={activeTask.contenuUrl.replace('/edit', '/embed').replace('/pub', '/embed')} allowFullScreen title={activeTask.titre} />
                    </div>
                ) : (
                    <div style={s.slideCard}>
                        <div style={{ flex: 1 }}>
                            <div style={s.slideIcon}>📊</div>
                            <h2 style={s.slideTitle}>{activeTask?.titre}</h2>
                            <p style={{ fontSize: '14px', color: '#6B7280' }}>Cours · {selectedCourse?.titre}</p>
                        </div>
                        <div style={{ fontSize: '80px', marginLeft: '40px' }}>🐍</div>
                    </div>
                )}
                <div style={s.slideControls}>
                    <button style={s.slideNavBtn}>‹</button>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Présentation</span>
                    <button style={s.slideNavBtn}>›</button>
                </div>
                <button style={s.nextBtn} onClick={() => setView('tasks')}>Suivant</button>
            </div>
        </div>
    );

    // ===== QCM VIEW =====
    if (view === 'qcm') return (
        <div style={s.qcmWrap}>
            <div style={s.qcmTb}>
                <button style={s.backBtn} onClick={() => setView('tasks')}>←</button>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                    ✅ QCM — {activeTask?.titre}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', position: 'absolute', right: '16px' }}>
                    {Object.keys(qcmAnswers).length}/{qcmQuestions.length} répondu(s)
                </div>
            </div>

            <div style={s.qcmBody}>
                {qcmSubmitted && qcmResult ? (
                    // Résultat
                    <div style={s.qcmResult}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                            {qcmResult.score >= 10 ? '🎉' : '😔'}
                        </div>
                        <div style={s.qcmResultTitle}>
                            {qcmResult.score >= 10 ? 'Bravo !' : 'Continuez à pratiquer !'}
                        </div>
                        <div style={s.qcmResultScore}>
                            {qcmResult.correct}/{qcmResult.total} bonnes réponses
                        </div>
                        <div style={{ ...s.qcmScoreBig, color: qcmResult.score >= 10 ? '#008060' : '#CC0033' }}>
                            {qcmResult.score}/20
                        </div>
                        <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '24px' }}>
                            Votre résultat a été envoyé à votre enseignant.
                        </p>
                        <button style={s.btnP} onClick={() => setView('tasks')}>← Retour au cours</button>
                    </div>
                ) : (
                    // Questions
                    <>
                        {qcmQuestions.map((q, qi) => (
                            <div key={qi} style={s.qcmQuestion}>
                                <div style={s.qcmQNum}>Question {qi + 1}/{qcmQuestions.length}</div>
                                <div style={s.qcmQText}>{q.question}</div>
                                <div style={s.qcmOptions}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi}
                                             style={{
                                                 ...s.qcmOption,
                                                 border: qcmAnswers[qi] === oi ? '2px solid #5B2EE8' : '2px solid #E5E0F5',
                                                 background: qcmAnswers[qi] === oi ? '#F5F2FF' : '#fff',
                                             }}
                                             onClick={() => setQcmAnswers({ ...qcmAnswers, [qi]: oi })}
                                        >
                                            <div style={{
                                                ...s.qcmOptLetter,
                                                background: qcmAnswers[qi] === oi ? '#5B2EE8' : '#F3F4F6',
                                                color: qcmAnswers[qi] === oi ? '#fff' : '#6B7280',
                                            }}>
                                                {['A', 'B', 'C', 'D'][oi]}
                                            </div>
                                            <span style={{ fontSize: '14px', color: '#1A1040', fontWeight: qcmAnswers[qi] === oi ? '700' : '400' }}>
                        {opt}
                      </span>
                                            {qcmAnswers[qi] === oi && <span style={{ marginLeft: 'auto', fontSize: '16px' }}>✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '40px' }}>
                            <button style={s.btnO2} onClick={() => setView('tasks')}>Annuler</button>
                            <button style={{
                                ...s.btnP2,
                                opacity: Object.keys(qcmAnswers).length < qcmQuestions.length ? 0.6 : 1,
                            }} onClick={submitQcm}>
                                📤 Soumettre le QCM ({Object.keys(qcmAnswers).length}/{qcmQuestions.length})
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // ===== TASKS VIEW =====
    const typeConfig = {
        SLIDE: { icon: '📊', color: '#5B2EE8' },
        QCM: { icon: '✅', color: '#008060' },
        DEVOIR: { icon: '📁', color: '#CC3300' },
    };

    return (
        <div style={s.courseLayout}>
            {/* Sidebar */}
            <div style={s.csSidebar}>
                {courses.map(course => (
                    <div key={course.id}>
                        <div style={s.cssInfo}>
                            <div style={s.cssHeader}>
                                <div style={s.cssMascot}>📚</div>
                                <div>
                                    <div style={s.cssName}>{course.titre}</div>
                                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>{course.niveau}</div>
                                </div>
                            </div>
                        </div>
                        <div style={s.chapList}>
                            {course.chapters.map((chap, i) => (
                                <div key={chap.id} style={{
                                    ...s.chap,
                                    ...(chap.locked ? s.chapLocked : {}),
                                    ...(selectedChapter?.id === chap.id ? s.chapOn : {}),
                                }} onClick={() => { if (!chap.locked) { setSelectedChapter(chap); setSelectedCourse(course); } }}>
                                    <div style={{ ...s.chNum, ...(selectedChapter?.id === chap.id ? s.chNumOn : {}), ...(chap.locked ? s.chNumLocked : {}) }}>
                                        {chap.locked ? '🔒' : i + 1}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: chap.locked ? '#9CA3AF' : '#1A1040', lineHeight: 1.3 }}>
                                        {chap.titre}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main */}
            <div style={s.lcWrap}>
                {selectedChapter ? (
                    <>
                        <div style={s.lcTitle}>{selectedChapter.titre}</div>
                        <div style={s.lcTabs}>
                            <div style={{ ...s.lct, ...s.lctOn }}>Toutes les tâches</div>
                            <div style={s.lct}>Incomplètes {selectedChapter.tasks.filter(t => !t.locked).length}</div>
                        </div>
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#6B7280', marginBottom: '14px' }}>TÂCHES</div>
                            <div style={s.taskRow}>
                                {selectedChapter.tasks.map((task, i) => {
                                    const tc = typeConfig[task.type] || typeConfig.SLIDE;
                                    return (
                                        <div key={task.id} style={s.taskItem} onClick={() => openTask(task)}>
                                            <div style={{
                                                ...s.taskCircle,
                                                background: task.locked ? '#D1D5DB' : `linear-gradient(135deg,${tc.color},${tc.color}99)`,
                                                cursor: task.locked ? 'not-allowed' : 'pointer',
                                                boxShadow: task.locked ? 'none' : `0 4px 16px ${tc.color}44`,
                                            }}>
                                                {task.locked ? '🔒' : tc.icon}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: task.locked ? '#9CA3AF' : '#1A1040', textAlign: 'center', maxWidth: '88px', lineHeight: 1.3 }}>
                                                {task.titre}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                                                {task.locked ? '🔒 Verrouillé' : task.type === 'SLIDE' ? '📊 Slide' : task.type === 'QCM' ? '✅ QCM' : '📁 Devoir'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Sélectionnez un chapitre</div>
                )}
            </div>

            {/* Modal Devoir */}
            {showDevoir && (
                <div style={hw.modalBg} onClick={() => setShowDevoir(false)}>
                    <div style={hw.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={hw.title}>📁 {devoirTask?.titre}</h2>
                        <span style={hw.badge}>📁 Devoir à rendre</span>

                        {devoirTask?.contenuUrl && (
                            <div style={hw.sujet}>
                                <div style={hw.sujetTitle}>📋 Sujet du devoir :</div>
                                <div style={hw.sujetText}>{devoirTask.contenuUrl}</div>
                            </div>
                        )}

                        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.6 }}>
                            Rendez votre travail en ajoutant un lien (Google Drive, etc.) ou en collant votre réponse.
                        </p>

                        <div style={hw.fg}>
                            <label style={hw.fl}>🔗 Lien de votre travail (Google Drive, etc.)</label>
                            <input style={hw.fi} type="url" placeholder="https://drive.google.com/..."
                                   value={devoirLien} onChange={e => setDevoirLien(e.target.value)} />
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                💡 Partagez votre fichier PDF/DOC/ZIP via Google Drive et collez le lien
              </span>
                        </div>

                        <div style={hw.divider}>— ou —</div>

                        <div style={hw.fg}>
                            <label style={hw.fl}>📝 Réponse texte</label>
                            <textarea style={hw.ta} placeholder="Écrivez votre réponse ici..."
                                      value={devoirNote} onChange={e => setDevoirNote(e.target.value)} />
                        </div>

                        <div style={hw.foot}>
                            <button style={hw.btnO} onClick={() => setShowDevoir(false)}>Annuler</button>
                            <button style={{ ...hw.btnP, opacity: submitting ? 0.7 : 1 }}
                                    onClick={submitDevoir} disabled={submitting}>
                                {submitting ? 'Envoi...' : '📤 Rendre le devoir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    courseLayout: { display: 'flex', gap: 0, height: 'calc(100vh - 100px)', margin: '-24px', overflow: 'hidden' },
    csSidebar: { width: '280px', background: '#fff', borderRight: '1px solid #E5E0F5', overflowY: 'auto', flexShrink: 0 },
    cssInfo: { padding: '16px', borderBottom: '1px solid #E5E0F5' },
    cssHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
    cssMascot: { width: '44px', height: '44px', background: '#EDE8FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
    cssName: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040' },
    chapList: { padding: '8px 0' },
    chap: { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
    chapOn: { background: '#F5F2FF', borderLeftColor: '#5B2EE8' },
    chapLocked: { opacity: 0.5, cursor: 'not-allowed' },
    chNum: { width: '26px', height: '26px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8', flexShrink: 0 },
    chNumOn: { background: '#5B2EE8', color: '#fff' },
    chNumLocked: { background: '#E5E7EB', color: '#9CA3AF' },
    lcWrap: { flex: 1, overflowY: 'auto', padding: '28px', background: '#F8F6FF' },
    lcTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '16px', textTransform: 'uppercase' },
    lcTabs: { display: 'flex', borderBottom: '2px solid #E5E0F5', marginBottom: '24px' },
    lct: { padding: '8px 18px', fontSize: '13px', fontWeight: '700', color: '#6B7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px' },
    lctOn: { color: '#5B2EE8', borderBottomColor: '#5B2EE8' },
    taskRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    taskItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    taskCircle: { width: '72px', height: '72px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', position: 'relative', transition: 'transform 0.2s' },
    slideWrap: { position: 'fixed', inset: 0, background: '#111827', display: 'flex', flexDirection: 'column', zIndex: 200 },
    slideTb: { height: '52px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' },
    backBtn: { position: 'absolute', left: '16px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' },
    slideSteps: { display: 'flex', alignItems: 'center', gap: '8px' },
    stepCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' },
    slideUserBtn: { position: 'absolute', right: '16px', padding: '6px 14px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700' },
    slideMain: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' },
    slideFrameWrap: { width: '100%', maxWidth: '960px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', aspectRatio: '16/9' },
    slideFrame: { width: '100%', height: '100%', border: 'none' },
    slideCard: { width: '100%', maxWidth: '860px', background: '#fff', borderRadius: '16px', padding: '60px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '6px solid #5B2EE8', marginBottom: '20px' },
    slideIcon: { width: '48px', height: '48px', background: '#5B2EE8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '24px' },
    slideTitle: { fontFamily: 'sans-serif', fontSize: '36px', fontWeight: '900', color: '#1A1040', marginBottom: '8px' },
    slideControls: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
    slideNavBtn: { width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' },
    nextBtn: { width: '100%', maxWidth: '860px', padding: '16px', background: '#FFB800', border: 'none', borderRadius: '12px', fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '700', color: '#1A1040', cursor: 'pointer' },
    qcmWrap: { position: 'fixed', inset: 0, background: '#F8F6FF', display: 'flex', flexDirection: 'column', zIndex: 200 },
    qcmTb: { height: '52px', background: '#5B2EE8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', position: 'relative', paddingLeft: '60px' },
    qcmBody: { flex: 1, overflowY: 'auto', padding: '32px 20px', maxWidth: '700px', margin: '0 auto', width: '100%' },
    qcmQuestion: { background: '#fff', borderRadius: '14px', padding: '24px', marginBottom: '20px', border: '1px solid #E5E0F5' },
    qcmQNum: { fontSize: '11px', fontWeight: '800', color: '#5B2EE8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
    qcmQText: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '700', color: '#1A1040', marginBottom: '20px', lineHeight: 1.4 },
    qcmOptions: { display: 'flex', flexDirection: 'column', gap: '10px' },
    qcmOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' },
    qcmOptLetter: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 },
    qcmResult: { background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #E5E0F5' },
    qcmResultTitle: { fontFamily: 'sans-serif', fontSize: '28px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    qcmResultScore: { fontSize: '16px', color: '#6B7280', marginBottom: '16px' },
    qcmScoreBig: { fontFamily: 'sans-serif', fontSize: '64px', fontWeight: '900', marginBottom: '16px' },
    btnP: { padding: '12px 28px', background: '#5B2EE8', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
    btnO2: { padding: '12px 24px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '10px', color: '#1A1040', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
    btnP2: { padding: '12px 28px', background: '#5B2EE8', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
};

const hw = {
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '540px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    title: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '50px', background: '#FFF0EB', color: '#CC3300', fontSize: '12px', fontWeight: '800', marginBottom: '16px' },
    sujet: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '10px', padding: '14px', marginBottom: '16px' },
    sujetTitle: { fontSize: '12px', fontWeight: '800', color: '#8B6200', marginBottom: '6px' },
    sujetText: { fontSize: '13px', color: '#1A1040', lineHeight: 1.6 },
    divider: { textAlign: 'center', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', margin: '12px 0' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    ta: { padding: '12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' },
    foot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
    btnP: { padding: '9px 20px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '9px 20px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};