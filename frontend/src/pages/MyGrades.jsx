import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Ic, IconBadge } from '../components/Icons';

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
        SLIDE:  { icon: 'slide',    label: 'Slide',  color: '#5B2EE8', bg: '#EDE8FF' },
        QCM:    { icon: 'qcm',      label: 'QCM',    color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: 'document', label: 'Devoir', color: '#CC3300', bg: '#FFF0EB' },
    };

    const getMention = (note) => {
        if (note >= 16) return { label: 'Très Bien',  color: '#008060', bg: 'rgba(0,196,140,0.12)' };
        if (note >= 14) return { label: 'Bien',        color: '#0069C0', bg: 'rgba(33,150,243,0.12)' };
        if (note >= 12) return { label: 'Assez Bien',  color: '#5B2EE8', bg: '#EDE8FF' };
        if (note >= 10) return { label: 'Passable',    color: '#8B6200', bg: 'rgba(255,184,0,0.15)' };
        return               { label: 'Insuffisant',  color: '#CC0033', bg: 'rgba(255,59,92,0.12)' };
    };

    const moyenne = homeworks.length > 0
        ? (homeworks.reduce((a, b) => a + (b.note || 0), 0) / homeworks.length).toFixed(1)
        : null;

    if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Chargement...</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <IconBadge icon="star" color="#8B6200" bg="rgba(255,184,0,0.15)" size={36} iconSize={18} />
                <h1 style={{ fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', margin: 0 }}>Mes Notes</h1>
            </div>

            {/* Carte moyenne */}
            {moyenne && (
                <div style={s.moyenneCard}>
                    <div style={s.moyenneLeft}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Ic name="chart" size={14} color="rgba(255,255,255,0.7)" /> Moyenne générale
                        </div>
                        <div style={s.moyenneVal}>
                            {moyenne}<span style={{ fontSize: '24px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>/20</span>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '800', background: getMention(parseFloat(moyenne)).bg, color: getMention(parseFloat(moyenne)).color }}>
                            {getMention(parseFloat(moyenne)).label}
                        </span>
                    </div>
                    <div style={s.moyenneRight}>
                        {[
                            { icon: 'check_circle', val: homeworks.length,                                     lbl: 'Corrigés' },
                            { icon: 'check',        val: homeworks.filter(h => (h.note || 0) >= 10).length,    lbl: '≥ 10/20' },
                            { icon: 'star',         val: `${Math.max(...homeworks.map(h => h.note || 0))}/20`, lbl: 'Meilleure' },
                        ].map((st, i) => (
                            <div key={i} style={s.moyenneStat}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                    <Ic name={st.icon} size={16} color="rgba(255,255,255,0.6)" />
                                </div>
                                <div style={{ fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#fff' }}>{st.val}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: '2px' }}>{st.lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {homeworks.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <IconBadge icon="star" color="#9CA3AF" bg="#F3F4F6" size={56} iconSize={28} />
                    <div style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' }}>Aucune note pour l'instant</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>Vos notes apparaîtront ici une fois vos devoirs corrigés</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {homeworks.map(hw => {
                        const mention = getMention(hw.note || 0);
                        const tc = typeConfig[hw.task?.type] || typeConfig.DEVOIR;
                        return (
                            <div key={hw.id} style={s.gradeCard}>
                                <IconBadge icon={tc.icon} color={tc.color} bg={tc.bg} size={44} iconSize={22} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '4px' }}>
                                        {hw.task?.titre || `Devoir #${hw.id}`}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: tc.bg, color: tc.color }}>
                                            <Ic name={tc.icon} size={10} color={tc.color} /> {tc.label}
                                        </span>
                                        <span style={{ color: '#D1D5DB', fontSize: '12px' }}>•</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                                            <Ic name="calendar" size={11} color="#9CA3AF" />
                                            Corrigé le {new Date(hw.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {hw.commentaire && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#6B7280', lineHeight: 1.5, marginTop: '4px' }}>
                                            <Ic name="note" size={12} color="#9CA3AF" />
                                            <em>{hw.commentaire}</em>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: mention.bg, color: mention.color }}>
                                        {mention.label}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                        <span style={{ fontFamily: 'sans-serif', fontSize: '32px', fontWeight: '900', color: (hw.note || 0) >= 10 ? '#008060' : '#CC0033' }}>{hw.note}</span>
                                        <span style={{ fontSize: '16px', color: '#6B7280', fontWeight: '600' }}>/20</span>
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
    moyenneCard: { background: 'linear-gradient(135deg,#5B2EE8,#7C52F0)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' },
    moyenneLeft: { display: 'flex', flexDirection: 'column', gap: '8px' },
    moyenneVal: { fontFamily: 'sans-serif', fontSize: '56px', fontWeight: '900', color: '#fff', lineHeight: 1 },
    moyenneRight: { display: 'flex', gap: '16px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' },
    moyenneStat: { background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 20px', textAlign: 'center' },
    gradeCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' },
};