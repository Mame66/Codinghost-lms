import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        students: 0,
        groups: 0,
        teachers: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [studentsRes, groupsRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/groups'),
                ]);
                setStats({
                    students: studentsRes.data.length,
                    groups: groupsRes.data.length,
                    teachers: 0,
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { icon: '👥', label: 'Étudiants actifs', value: stats.students, color: '#EDE8FF', trend: '+8%' },
        { icon: '🏫', label: 'Groupes actifs', value: stats.groups, color: '#FFF0EB', trend: '+3' },
        { icon: '👩‍🏫', label: 'Enseignants', value: stats.teachers, color: '#ECFDF5', trend: null },
        { icon: '💰', label: 'Revenus DA (mois)', value: '610K', color: '#FFFBEB', trend: '+22%' },
    ];

    return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>📊 Tableau de bord</h1>
                <span style={styles.welcome}>Bonjour, {user?.prenom} 👋</span>
            </div>

            {/* Stats cards */}
            <div style={styles.grid}>
                {cards.map((card, i) => (
                    <div key={i} style={styles.card}>
                        <div style={styles.cardTop}>
                            <div style={{ ...styles.cardIcon, background: card.color }}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <div style={styles.trend}>{card.trend}</div>
                            )}
                        </div>
                        <div style={styles.cardValue}>{card.value}</div>
                        <div style={styles.cardLabel}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Bottom row */}
            <div style={styles.row2}>
                {/* Chart */}
                <div style={styles.box}>
                    <div style={styles.boxHeader}>
                        <span style={styles.boxTitle}>📈 Inscriptions (6 mois)</span>
                    </div>
                    <div style={styles.chart}>
                        {[55, 42, 70, 60, 85, 100].map((h, i) => (
                            <div key={i} style={styles.barWrap}>
                                <div style={{
                                    ...styles.bar,
                                    height: `${h}%`,
                                    background: i === 5
                                        ? 'linear-gradient(180deg, #FF5C35, rgba(255,92,53,0.3))'
                                        : 'linear-gradient(180deg, #5B2EE8, rgba(91,46,232,0.3))',
                                }} />
                                <span style={styles.barLabel}>
                  {['Oct','Nov','Déc','Jan','Fév','Mar'][i]}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity */}
                <div style={styles.box}>
                    <div style={styles.boxHeader}>
                        <span style={styles.boxTitle}>⚡ Activité récente</span>
                    </div>
                    <div style={styles.activityList}>
                        {[
                            { icon: '🎓', bg: '#EDE8FF', title: 'Nouvel étudiant inscrit', sub: 'Python Samedi 10H', time: '5 min' },
                            { icon: '💳', bg: '#ECFDF5', title: 'Paiement reçu', sub: '3 000 DA · HTML/CSS', time: '18 min' },
                            { icon: '📝', bg: '#FFF0EB', title: 'Cours soumis', sub: 'Prof. Karim · React JS', time: '1h' },
                            { icon: '👥', bg: '#EDE8FF', title: 'Nouveau groupe créé', sub: '2025 Python Vendredi', time: '2h' },
                        ].map((item, i) => (
                            <div key={i} style={styles.actItem}>
                                <div style={{ ...styles.actIcon, background: item.bg }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={styles.actTitle}>{item.title}</div>
                                    <div style={styles.actSub}>{item.sub}</div>
                                </div>
                                <div style={styles.actTime}>{item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    ph: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },
    h1: {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontWeight: '800',
        color: '#1A1040',
    },
    welcome: {
        fontSize: '14px',
        color: '#6B7280',
        fontWeight: '600',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px',
    },
    card: {
        background: '#fff',
        border: '1px solid #E5E0F5',
        borderRadius: '14px',
        padding: '20px',
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
    },
    cardIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
    },
    trend: {
        fontSize: '11px',
        fontWeight: '800',
        padding: '3px 8px',
        borderRadius: '50px',
        background: 'rgba(0,196,140,0.1)',
        color: '#008060',
    },
    cardValue: {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontWeight: '800',
        color: '#1A1040',
    },
    cardLabel: {
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: '600',
        marginTop: '2px',
    },
    row2: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
    },
    box: {
        background: '#fff',
        border: '1px solid #E5E0F5',
        borderRadius: '14px',
        overflow: 'hidden',
    },
    boxHeader: {
        padding: '14px 18px',
        borderBottom: '1px solid #E5E0F5',
    },
    boxTitle: {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        fontWeight: '700',
        color: '#1A1040',
    },
    chart: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '16px',
        height: '140px',
    },
    barWrap: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        height: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: '5px 5px 0 0',
        minHeight: '8px',
    },
    barLabel: {
        fontSize: '10px',
        color: '#6B7280',
        fontWeight: '600',
    },
    activityList: {
        padding: '8px 0',
    },
    actItem: {
        display: 'flex',
        gap: '10px',
        padding: '10px 18px',
        borderBottom: '1px solid #E5E0F5',
        alignItems: 'center',
    },
    actIcon: {
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
    },
    actTitle: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1A1040',
    },
    actSub: {
        fontSize: '12px',
        color: '#6B7280',
    },
    actTime: {
        fontSize: '11px',
        color: '#6B7280',
        whiteSpace: 'nowrap',
    },
};