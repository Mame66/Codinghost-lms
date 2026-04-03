import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function MyGrades() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchGrades(); }, []);

    const fetchGrades = async () => {
        try {
            const meRes = await api.get('/auth/me');
            const studentsRes = await api.get('/students');
            const student = studentsRes.data.find(s => s.user?.login === meRes.data.login);
            if (student) {
                const hwRes = await api.get(`/homeworks/student/${student.id}`);
                setHomeworks(hwRes.data.filter(h => h.statut === 'CORRIGE'));
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const typeConfig = {
        SLIDE: { icon: '📊', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { icon: '✅', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: '📁', color: '#CC3300', bg: '#FFF0EB' },
    };

    const getMention = (note) => {
        if (note >= 16) return { label: 'Très Bien', color: '#008060', bg: 'rgba(0,196,140,0.12)' };
        if (note >= 14) return { label: 'Bien', color: '#0069C0', bg: 'rgba(33,150,243,0.12)' };
        if (note >= 12) return { label: 'Assez Bien', color: '#5B2EE8', bg: '#EDE8FF' };
        if (note >= 10) return { label: 'Passable', color: '#8B6200', bg: 'rgba(255,184,0,0.15)' };
        return { label: 'Insuffisant', color: '#CC0033', bg: 'rgba(255,59,92,0.12)' };
    };

    const moyenne = homeworks.length > 0
        ? (homeworks.reduce((a, b) => a + (b.note || 0), 0) / homeworks.length).toFixed(1)
        : null;

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Chargement...</div>
    );

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>🏆 Mes Notes</h1>
            </div>

            {/* Moyenne générale */}
            {moyenne && (
                <div style={s.moyenneCard}>
                    <div style={s.moyenneLeft}>
                        <div style={s.moyenneLabel}>Moyenne générale</div>
                        <div style={s.moyenneVal}>
                            {moyenne}<span style={s.moyenneSur}>/20</span>
                        </div>
                        <span style={{
                            ...s.pill,
                            background: getMention(parseFloat(moyenne)).bg,
                            color: getMention(parseFloat(moyenne)).color,
                        }}>
              {getMention(parseFloat(moyenne)).label}
            </span>
                    </div>
                    <div style={s.moyenneRight}>
                        {[
                            { val: homeworks.length, lbl: 'Devoirs corrigés' },
                            { val: homeworks.filter(h => (h.note || 0) >= 10).length, lbl: '≥ 10/20' },
                            { val: `${Math.max(...homeworks.map(h => h.note || 0))}/20`, lbl: 'Meilleure note' },
                        ].map((st, i) => (
                            <div key={i} style={s.moyenneStat}>
                                <div style={s.moyenneStatVal}>{st.val}</div>
                                <div style={s.moyenneStatLbl}>{st.lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {homeworks.length === 0 ? (
                <div style={s.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                    <div style={s.emptyTitle}>Aucune note pour l'instant</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>
                        Vos notes apparaîtront ici une fois vos devoirs corrigés
                    </div>
                </div>
            ) : (
                <div style={s.gradeList}>
                    {homeworks.map(hw => {
                        const mention = getMention(hw.note || 0);
                        const tc = typeConfig[hw.task?.type] || typeConfig.DEVOIR;
                        return (
                            <div key={hw.id} style={s.gradeCard}>
                                <div style={{ ...s.typeIcon, background: tc.bg, color: tc.color }}>
                                    {tc.icon}
                                </div>
                                <div style={s.gradeInfo}>
                                    {/* Vrai nom de la tâche */}
                                    <div style={s.gradeTitle}>{hw.task?.titre || `Devoir #${hw.id}`}</div>
                                    <div style={s.gradeMeta}>
                    <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>
                      {tc.icon} {tc.label || hw.task?.type}
                    </span>
                                        <span style={s.metaDot}>•</span>
                                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Corrigé le {new Date(hw.createdAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                    </span>
                                    </div>
                                    {hw.commentaire && (
                                        <div style={s.gradeComment}>
                                            💬 <em>{hw.commentaire}</em>
                                        </div>
                                    )}
                                </div>
                                <div style={s.gradeRight}>
                  <span style={{ ...s.mentionPill, background: mention.bg, color: mention.color }}>
                    {mention.label}
                  </span>
                                    <div style={s.gradeNoteWrap}>
                    <span style={{ ...s.gradeNoteVal, color: (hw.note || 0) >= 10 ? '#008060' : '#CC0033' }}>
                      {hw.note}
                    </span>
                                        <span style={s.gradeNoteSur}>/20</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    moyenneCard: { background: 'linear-gradient(135deg,#5B2EE8,#7C52F0)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' },
    moyenneLeft: { display: 'flex', flexDirection: 'column', gap: '8px' },
    moyenneLabel: { fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    moyenneVal: { fontFamily: 'sans-serif', fontSize: '56px', fontWeight: '900', color: '#fff', lineHeight: 1 },
    moyenneSur: { fontSize: '24px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    moyenneRight: { display: 'flex', gap: '16px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' },
    moyenneStat: { background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 20px', textAlign: 'center' },
    moyenneStatVal: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#fff' },
    moyenneStatLbl: { fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: '4px' },
    pill: { display: 'inline-flex', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '800' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    gradeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    gradeCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' },
    typeIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, fontWeight: '700' },
    gradeInfo: { flex: 1 },
    gradeTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '4px' },
    gradeMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' },
    metaDot: { color: '#D1D5DB', fontSize: '12px' },
    gradeComment: { fontSize: '12px', color: '#6B7280', lineHeight: 1.5, marginTop: '4px' },
    gradeRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 },
    mentionPill: { display: 'inline-flex', padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    gradeNoteWrap: { display: 'flex', alignItems: 'baseline', gap: '2px' },
    gradeNoteVal: { fontFamily: 'sans-serif', fontSize: '32px', fontWeight: '900' },
    gradeNoteSur: { fontSize: '16px', color: '#6B7280', fontWeight: '600' },
};