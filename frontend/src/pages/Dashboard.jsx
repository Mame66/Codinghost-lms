import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const typeConfig = {
        SLIDE: { icon: '📊', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { icon: '✅', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: '📁', color: '#CC3300', bg: '#FFF0EB' },
        EXERCISE: { icon: '✏️', color: '#CC3300', bg: '#FFF0EB' },
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Chargement...
        </div>
    );

    const tauxPaiement = stats?.totalRevenue > 0
        ? Math.round((stats.paidRevenue / stats.totalRevenue) * 100)
        : 0;

    const cards = [
        { icon: '👥', label: 'Étudiants', value: stats?.totalStudents || 0, color: '#EDE8FF', trend: null, path: '/students' },
        { icon: '🏫', label: 'Groupes', value: stats?.totalGroups || 0, color: '#FFF0EB', trend: null, path: '/groups' },
        { icon: '👩‍🏫', label: 'Enseignants', value: stats?.totalTeachers || 0, color: '#ECFDF5', trend: null, path: null },
        { icon: '📚', label: 'Cours', value: stats?.totalCourses || 0, color: '#FFFBEB', trend: null, path: '/my-courses' },
        { icon: '✏️', label: 'Devoirs reçus', value: stats?.totalHomeworks || 0, color: '#EDE8FF', trend: null, path: '/homeworks' },
        { icon: '⏳', label: 'À corriger', value: stats?.pendingHomeworks || 0, color: '#FFF0EB', trend: stats?.pendingHomeworks > 0 ? '!' : null, path: '/homeworks' },
        { icon: '💰', label: 'Total facturé', value: `${(stats?.totalRevenue || 0).toLocaleString()} DA`, color: '#ECFDF5', trend: null, path: '/payments' },
        { icon: '✅', label: 'Total reçu', value: `${(stats?.paidRevenue || 0).toLocaleString()} DA`, color: '#FFFBEB', trend: `${tauxPaiement}%`, path: '/payments' },
    ];

    return (
        <div>
            {/* Welcome */}
            <div style={s.welcomeBar}>
                <div>
                    <div style={s.welcomeTitle}>
                        Bonjour, {user?.prenom} 👋
                    </div>
                    <div style={s.welcomeSub}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                {stats?.pendingHomeworks > 0 && (
                    <div style={s.alertBadge} onClick={() => navigate('/homeworks')}>
                        ⚠️ {stats.pendingHomeworks} devoir(s) en attente de correction
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div style={s.grid}>
                {cards.map((card, i) => (
                    <div key={i} style={{ ...s.card, cursor: card.path ? 'pointer' : 'default' }}
                         onClick={() => card.path && navigate(card.path)}>
                        <div style={s.cardTop}>
                            <div style={{ ...s.cardIcon, background: card.color }}>{card.icon}</div>
                            {card.trend && (
                                <div style={{
                                    ...s.trend,
                                    background: card.trend === '!' ? 'rgba(255,92,53,0.12)' : 'rgba(0,196,140,0.12)',
                                    color: card.trend === '!' ? '#CC3300' : '#008060',
                                }}>
                                    {card.trend === '!' ? '🔴 Urgent' : card.trend}
                                </div>
                            )}
                        </div>
                        <div style={s.cardVal}>{card.value}</div>
                        <div style={s.cardLbl}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Bottom row */}
            <div style={s.row2}>
                {/* Recent homeworks */}
                <div style={s.box}>
                    <div style={s.bh}>
                        <span style={s.bt}>📥 Derniers devoirs reçus</span>
                        <button style={s.linkBtn} onClick={() => navigate('/homeworks')}>
                            Voir tout →
                        </button>
                    </div>
                    {!stats?.recentHomeworks?.length ? (
                        <div style={s.boxEmpty}>Aucun devoir reçu</div>
                    ) : (
                        stats.recentHomeworks.map(hw => {
                            const tc = typeConfig[hw.task?.type] || typeConfig.DEVOIR;
                            return (
                                <div key={hw.id} style={s.actItem}>
                                    <div style={{ ...s.actIcon, background: tc.bg, color: tc.color }}>
                                        {tc.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.actTitle}>
                                            {hw.student?.user?.prenom} {hw.student?.user?.nom}
                                        </div>
                                        <div style={s.actSub}>{hw.task?.titre}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            ...s.statusPill,
                                            background: hw.statut === 'CORRIGE' ? 'rgba(0,196,140,0.12)' : 'rgba(255,184,0,0.15)',
                                            color: hw.statut === 'CORRIGE' ? '#008060' : '#8B6200',
                                        }}>
                                            {hw.statut === 'CORRIGE' ? '✅' : '⏳'}
                                        </div>
                                        <div style={s.actTime}>
                                            {new Date(hw.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Recent students */}
                    <div style={s.box}>
                        <div style={s.bh}>
                            <span style={s.bt}>🎓 Derniers inscrits</span>
                            <button style={s.linkBtn} onClick={() => navigate('/students')}>
                                Voir tout →
                            </button>
                        </div>
                        {!stats?.recentStudents?.length ? (
                            <div style={s.boxEmpty}>Aucun étudiant</div>
                        ) : (
                            stats.recentStudents.map(st => (
                                <div key={st.id} style={s.actItem}>
                                    <div style={s.miniAvatar}>
                                        {st.user?.prenom?.[0]}{st.user?.nom?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.actTitle}>{st.user?.prenom} {st.user?.nom}</div>
                                        <div style={s.actSub}>
                                            {st.enrollments?.[0]?.group?.titre || 'Sans groupe'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick actions */}
                    <div style={s.box}>
                        <div style={s.bh}><span style={s.bt}>⚡ Actions rapides</span></div>
                        <div style={s.quickActions}>
                            {[
                                { icon: '➕', label: 'Ajouter étudiant', path: '/students', color: '#5B2EE8' },
                                { icon: '🏫', label: 'Nouveau groupe', path: '/groups', color: '#008060' },
                                { icon: '📚', label: 'Nouveau cours', path: '/my-courses', color: '#CC3300' },
                                { icon: '📋', label: 'Marquer présences', path: '/attendance', color: '#8B6200' },
                                { icon: '💰', label: 'Gérer paiements', path: '/payments', color: '#5B2EE8' },
                                { icon: '✏️', label: 'Corriger devoirs', path: '/homeworks', color: '#CC3300' },
                            ].map((action, i) => (
                                <button key={i} style={s.qaBtn} onClick={() => navigate(action.path)}>
                                    <span style={{ fontSize: '18px' }}>{action.icon}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1040' }}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    welcomeBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    welcomeTitle: { fontFamily: 'sans-serif', fontSize: '24px', fontWeight: '800', color: '#1A1040' },
    welcomeSub: { fontSize: '13px', color: '#6B7280', marginTop: '2px', fontWeight: '600', textTransform: 'capitalize' },
    alertBadge: { background: 'rgba(255,92,53,0.12)', border: '1px solid rgba(255,92,53,0.3)', color: '#CC3300', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' },
    card: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '18px', transition: 'all 0.15s' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    cardIcon: { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    trend: { fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '50px' },
    cardVal: { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800', color: '#1A1040' },
    cardLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' },
    box: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    bh: { padding: '14px 18px', borderBottom: '1px solid #E5E0F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bt: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#1A1040' },
    linkBtn: { fontSize: '12px', fontWeight: '700', color: '#5B2EE8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    boxEmpty: { padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' },
    actItem: { display: 'flex', gap: '10px', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' },
    actIcon: { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, fontWeight: '700' },
    actTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    actSub: { fontSize: '12px', color: '#6B7280' },
    actTime: { fontSize: '11px', color: '#9CA3AF', marginTop: '2px' },
    statusPill: { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    quickActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '14px' },
    qaBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 8px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
};