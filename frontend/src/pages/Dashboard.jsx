import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Icônes SVG ────────────────────────────────────────────
const Ic = ({ name, size = 18, color = 'currentColor' }) => {
    const p = { fill: 'none', stroke: color, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };
    const icons = {
        students:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
        groups:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        teacher:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6M19 8v6"/></svg>,
        courses:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/></svg>,
        homeworks:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        pending:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        money:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="16" y2="15"/></svg>,
        check:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
        alert:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        arrow:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
        add:        <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
        attendance: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
        payments:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
        inbox:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
        slide:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        qcm:        <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        devoir:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
        euro:       <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 10h12M4 14h12"/><path d="M19.5 9.5c-1-1.7-2.9-2.8-5-2.8a6 6 0 0 0 0 12c2.1 0 4-1.1 5-2.8"/></svg>,
        clock_late: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="18" y1="18" x2="22" y2="22"/></svg>,
    };
    return icons[name] || null;
};

export default function Dashboard() {
    const { user }   = useAuth();
    const navigate   = useNavigate();
    const isAdmin    = user?.role === 'ADMIN';
    const isTeacher  = user?.role === 'TEACHER';

    const [stats, setStats]               = useState(null);
    const [billingStats, setBillingStats] = useState(null);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const promises = [api.get('/stats')];
                // ✅ Finance uniquement pour ADMIN
                if (isAdmin) {
                    promises.push(api.get('/billing/dashboard-summary').catch(() => ({ data: null })));
                }
                const [statsRes, billingRes] = await Promise.all(promises);
                setStats(statsRes.data);
                if (billingRes?.data) setBillingStats(billingRes.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Chargement...</div>
    );

    const tauxPaiement = stats?.totalRevenue > 0
        ? Math.round((stats.paidRevenue / stats.totalRevenue) * 100) : 0;

    // ✅ Cartes : TEACHER ne voit pas Total facturé et Total reçu
    const allCards = [
        { icon: 'students',  label: 'Étudiants',    value: stats?.totalStudents    || 0,  color: '#5B2EE8', bg: '#EDE8FF', path: '/students',   roles: ['ADMIN','TEACHER'] },
        { icon: 'groups',    label: 'Groupes',       value: stats?.totalGroups      || 0,  color: '#0069C0', bg: '#EFF6FF', path: '/groups',     roles: ['ADMIN','TEACHER'] },
        { icon: 'teacher',   label: 'Enseignants',   value: stats?.totalTeachers    || 0,  color: '#008060', bg: '#ECFDF5', path: null,          roles: ['ADMIN'] },
        { icon: 'courses',   label: 'Cours',         value: stats?.totalCourses     || 0,  color: '#8B6200', bg: '#FFFBEB', path: '/my-courses', roles: ['ADMIN','TEACHER'] },
        { icon: 'inbox',     label: 'Devoirs reçus', value: stats?.totalHomeworks   || 0,  color: '#5B2EE8', bg: '#EDE8FF', path: '/homeworks',  roles: ['ADMIN','TEACHER'] },
        { icon: 'pending',   label: 'À corriger',    value: stats?.pendingHomeworks || 0,  color: '#CC3300', bg: '#FFF0EB', path: '/homeworks',  roles: ['ADMIN','TEACHER'], urgent: stats?.pendingHomeworks > 0 },
        // ✅ Ces deux cartes : ADMIN seulement
        { icon: 'money',     label: 'Total facturé', value: `${(stats?.totalRevenue || 0).toLocaleString()} DA`, color: '#008060', bg: '#ECFDF5', path: '/payments', roles: ['ADMIN'] },
        { icon: 'payments',  label: 'Total reçu',    value: `${(stats?.paidRevenue  || 0).toLocaleString()} DA`, color: '#0069C0', bg: '#EFF6FF', path: '/payments', roles: ['ADMIN'], trend: `${tauxPaiement}%` },
    ];

    const cards = allCards.filter(c => c.roles.includes(user?.role));

    const typeIcon  = { SLIDE: 'slide', QCM: 'qcm', DEVOIR: 'devoir', EXERCISE: 'devoir' };
    const typeColor = {
        SLIDE:    { color: '#5B2EE8', bg: '#EDE8FF' },
        QCM:      { color: '#008060', bg: '#ECFDF5' },
        DEVOIR:   { color: '#CC3300', bg: '#FFF0EB' },
        EXERCISE: { color: '#CC3300', bg: '#FFF0EB' },
    };

    // ✅ Actions rapides : TEACHER ne voit pas paiements et facturation
    const allQuickActions = [
        { icon: 'add',        label: 'Ajouter étudiant',  path: '/students',  roles: ['ADMIN','TEACHER'] },
        { icon: 'groups',     label: 'Nouveau groupe',     path: '/groups',    roles: ['ADMIN','TEACHER'] },
        { icon: 'courses',    label: 'Nouveau cours',      path: '/my-courses',roles: ['ADMIN','TEACHER'] },
        { icon: 'attendance', label: 'Marquer présences',  path: '/attendance',roles: ['ADMIN','TEACHER'] },
        { icon: 'payments',   label: 'Gérer paiements',    path: '/payments',  roles: ['ADMIN'] },
        { icon: 'homeworks',  label: 'Corriger devoirs',   path: '/homeworks', roles: ['ADMIN','TEACHER'] },
    ];
    const quickActions = allQuickActions.filter(a => a.roles.includes(user?.role));

    return (
        <div>
            {/* Welcome */}
            <div style={s.welcomeBar}>
                <div>
                    <div style={s.welcomeTitle}>Bonjour, {user?.prenom} 👋</div>
                    <div style={s.welcomeSub}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                {stats?.pendingHomeworks > 0 && (
                    <div style={s.alertBadge} onClick={() => navigate('/homeworks')}>
                        <Ic name="alert" size={14} color="#CC3300" />
                        {stats.pendingHomeworks} devoir(s) en attente de correction
                    </div>
                )}
            </div>

            {/* Stats grid */}
            <div style={s.grid}>
                {cards.map((card, i) => (
                    <div key={i}
                         style={{ ...s.card, cursor: card.path ? 'pointer' : 'default' }}
                         onClick={() => card.path && navigate(card.path)}>
                        <div style={s.cardTop}>
                            <div style={{ ...s.cardIcon, background: card.bg }}>
                                <Ic name={card.icon} size={20} color={card.color} />
                            </div>
                            {card.urgent && <div style={s.urgentBadge}>Urgent</div>}
                            {card.trend && !card.urgent && <div style={s.trendBadge}>{card.trend}</div>}
                        </div>
                        <div style={s.cardVal}>{card.value}</div>
                        <div style={s.cardLbl}>{card.label}</div>
                    </div>
                ))}

                {/* ✅ Section Finance — ADMIN seulement */}
                {isAdmin && billingStats && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ic name="euro" size={13} color="#9CA3AF" /> Finance ce mois
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                            {[
                                { label: 'Total encaissé',       value: `${Number(billingStats.totalRevenue     || 0).toFixed(2).replace('.',',')} €`, color: '#059669', bg: '#ECFDF5', icon: 'euro',       link: '/billing' },
                                { label: 'Ce mois-ci',           value: `${Number(billingStats.thisMonthRevenue || 0).toFixed(2).replace('.',',')} €`, color: '#5B2EE8', bg: '#EDE8FF', icon: 'money',      link: '/billing' },
                                { label: 'Paiements en attente', value: billingStats.pendingCount || 0,                                                color: '#D97706', bg: '#FFFBEB', icon: 'pending',    link: '/billing' },
                                { label: 'Retards de paiement',  value: billingStats.lateCount    || 0,                                                color: '#DC2626', bg: '#FEF2F2', icon: 'clock_late', link: '/billing' },
                            ].map((card, i) => (
                                <div key={i}
                                     style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'transform 0.15s' }}
                                     onClick={() => navigate(card.link)}
                                     onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                     onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Ic name={card.icon} size={14} color={card.color} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: card.color }}>{card.value}</div>
                                    <div style={{ fontSize: '11px', color: card.color, fontWeight: '600', marginTop: '4px', opacity: 0.85 }}>{card.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom row */}
            <div style={s.row2}>
                {/* Recent homeworks */}
                <div style={s.box}>
                    <div style={s.bh}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Ic name="inbox" size={16} color="#5B2EE8" />
                            <span style={s.bt}>Derniers devoirs reçus</span>
                        </div>
                        <button style={s.linkBtn} onClick={() => navigate('/homeworks')}>
                            Voir tout <Ic name="arrow" size={12} color="#5B2EE8" />
                        </button>
                    </div>
                    {!stats?.recentHomeworks?.length ? (
                        <div style={s.boxEmpty}>Aucun devoir reçu</div>
                    ) : (
                        stats.recentHomeworks.map(hw => {
                            const t  = hw.task?.type || 'DEVOIR';
                            const tc = typeColor[t]  || typeColor.DEVOIR;
                            return (
                                <div key={hw.id} style={s.actItem}>
                                    <div style={{ ...s.actIcon, background: tc.bg }}>
                                        <Ic name={typeIcon[t] || 'devoir'} size={16} color={tc.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.actTitle}>{hw.student?.user?.prenom} {hw.student?.user?.nom}</div>
                                        <div style={s.actSub}>{hw.task?.titre}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ ...s.statusPill, background: hw.statut === 'CORRIGE' ? 'rgba(0,196,140,0.12)' : 'rgba(255,184,0,0.15)' }}>
                                            {hw.statut === 'CORRIGE'
                                                ? <Ic name="check" size={11} color="#008060" />
                                                : <Ic name="pending" size={11} color="#8B6200" />}
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

                {/* Colonne droite */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Recent students */}
                    <div style={s.box}>
                        <div style={s.bh}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Ic name="students" size={16} color="#5B2EE8" />
                                <span style={s.bt}>Derniers inscrits</span>
                            </div>
                            <button style={s.linkBtn} onClick={() => navigate('/students')}>
                                Voir tout <Ic name="arrow" size={12} color="#5B2EE8" />
                            </button>
                        </div>
                        {!stats?.recentStudents?.length ? (
                            <div style={s.boxEmpty}>Aucun étudiant</div>
                        ) : (
                            stats.recentStudents.map(st => (
                                <div key={st.id} style={s.actItem}>
                                    <div style={s.miniAvatar}>{st.user?.prenom?.[0]}{st.user?.nom?.[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.actTitle}>{st.user?.prenom} {st.user?.nom}</div>
                                        <div style={s.actSub}>{st.enrollments?.[0]?.group?.titre || 'Sans groupe'}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick actions */}
                    <div style={s.box}>
                        <div style={s.bh}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Ic name="check" size={16} color="#5B2EE8" />
                                <span style={s.bt}>Actions rapides</span>
                            </div>
                        </div>
                        <div style={s.quickActions}>
                            {quickActions.map((action, i) => (
                                <button key={i} style={s.qaBtn} onClick={() => navigate(action.path)}>
                                    <div style={s.qaIcon}><Ic name={action.icon} size={18} color="#5B2EE8" /></div>
                                    <span style={s.qaLabel}>{action.label}</span>
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
    welcomeBar:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    welcomeTitle: { fontFamily: 'sans-serif', fontSize: '24px', fontWeight: '800', color: '#1A1040' },
    welcomeSub:   { fontSize: '13px', color: '#6B7280', marginTop: '2px', fontWeight: '600', textTransform: 'capitalize' },
    alertBadge:   { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', color: '#CC3300', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
    grid:         { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' },
    card:         { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '18px', transition: 'all 0.15s' },
    cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
    cardIcon:     { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    urgentBadge:  { fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '50px', background: 'rgba(255,59,92,0.12)', color: '#CC0033' },
    trendBadge:   { fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '50px', background: 'rgba(0,196,140,0.12)', color: '#008060' },
    cardVal:      { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800', color: '#1A1040' },
    cardLbl:      { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    row2:         { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' },
    box:          { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    bh:           { padding: '14px 18px', borderBottom: '1px solid #E5E0F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bt:           { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#1A1040' },
    linkBtn:      { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#5B2EE8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    boxEmpty:     { padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' },
    actItem:      { display: 'flex', gap: '10px', padding: '11px 18px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' },
    actIcon:      { width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actTitle:     { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    actSub:       { fontSize: '12px', color: '#6B7280' },
    actTime:      { fontSize: '11px', color: '#9CA3AF', marginTop: '2px' },
    statusPill:   { display: 'inline-flex', padding: '4px', borderRadius: '50%', width: '22px', height: '22px', alignItems: 'center', justifyContent: 'center' },
    miniAvatar:   { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    quickActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '14px' },
    qaBtn:        { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left' },
    qaIcon:       { width: '30px', height: '30px', background: '#EDE8FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    qaLabel:      { fontSize: '12px', fontWeight: '700', color: '#1A1040', lineHeight: 1.3 },
};