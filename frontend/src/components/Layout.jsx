import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Notifications from "../pages/Notifications";

const NAV_ITEMS = {
    ADMIN: [
        { icon: '📊', label: 'Tableau de bord', path: '/dashboard' },
        { icon: '🏫', label: 'Groupes', path: '/groups' },
        { icon: '📚', label: 'Mes cours', path: '/my-courses' },
        { icon: '✏️', label: 'Correction devoirs', path: '/homeworks' },
        { icon: '👥', label: 'Étudiants', path: '/students' },
        { icon: '➕', label: 'Ajouter étudiant', path: '/add-student' },
        { icon: '⚙️', label: 'Paramètres', path: '/settings' },
    ],
    TEACHER: [
        { icon: '📊', label: 'Tableau de bord', path: '/dashboard' },
        { icon: '🏫', label: 'Mes groupes', path: '/groups' },
        { icon: '📚', label: 'Mes cours', path: '/my-courses' },
        { icon: '✏️', label: 'Correction devoirs', path: '/homeworks' },
        { icon: '👥', label: 'Mes étudiants', path: '/students' },
        { icon: '➕', label: 'Ajouter étudiant', path: '/add-student' },
    ],
    TEACHER_VIEW: [
        { icon: '🏫', label: 'Mes groupes', path: '/groups' },
        { icon: '👥', label: 'Mes étudiants', path: '/students' },
    ],
    STUDENT: [
        { icon: '📚', label: 'Mon cours', path: '/course' },
        { icon: '✏️', label: 'Mes devoirs', path: '/my-homeworks' },
        { icon: '🏆', label: 'Mes notes', path: '/my-grades' },
    ],
};

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = NAV_ITEMS[user?.role] || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.wrap}>
            {/* SIDEBAR */}
            <div style={styles.sidebar}>
                {/* Logo */}
                <div style={styles.sbLogo}>
                    <div style={styles.sbLogoIcon}>💻</div>
                </div>

                {/* Nav items */}
                <div style={styles.sbNav}>
                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            style={{
                                ...styles.sbi,
                                ...(location.pathname === item.path ? styles.sbiOn : {}),
                            }}
                            onClick={() => navigate(item.path)}
                            title={item.label}
                        >
                            {item.icon}
                            <div style={styles.tip}>{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div style={styles.sbBot}>
                    <div
                        style={styles.sbAv}
                        onClick={handleLogout}
                        title="Déconnexion"
                    >
                        👤
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div style={styles.main}>
                {/* TOPBAR */}
                <div style={styles.topbar}>
                    <div style={styles.tbTitle}>CodingHost</div>
                    <div style={styles.tbSp} />
                    <Notifications />
                    <div style={styles.tbUser}>
                        <div style={styles.tbAv}>👤</div>
                        <span>{user?.prenom} {user?.nom}</span>
                        <span style={{ color: '#9CA3AF' }}>▾</span>
                    </div>
                </div>

                {/* PAGE CONTENT */}
                <div style={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrap: {
        display: 'flex',
        minHeight: '100vh',
        background: '#F8F6FF',
    },
    sidebar: {
        width: '64px',
        background: '#0F0A1E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        borderRight: '1px solid rgba(255,255,255,0.05)',
    },
    sbLogo: {
        width: '100%',
        padding: '14px 0',
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
    },
    sbLogoIcon: {
        width: '36px',
        height: '36px',
        background: '#5B2EE8',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
    },
    sbNav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '10px 8px',
        flex: 1,
        width: '100%',
    },
    sbi: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.35)',
        position: 'relative',
        transition: 'all 0.2s',
    },
    sbiOn: {
        background: 'rgba(91,46,232,0.35)',
        color: '#fff',
    },
    tip: {
        position: 'absolute',
        left: '56px',
        background: '#1e0f3c',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        opacity: 0,
        pointerEvents: 'none',
        border: '1px solid rgba(91,46,232,0.3)',
        zIndex: 999,
    },
    sbBot: {
        padding: '10px 8px',
    },
    sbAv: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #5B2EE8, #FF5C35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        cursor: 'pointer',
        margin: '0 auto',
    },
    main: {
        marginLeft: '64px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    topbar: {
        height: '52px',
        background: '#fff',
        borderBottom: '1px solid #E5E0F5',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
    },
    tbTitle: {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        fontWeight: '700',
        color: '#1A1040',
    },
    tbSp: { flex: 1 },
    tbUser: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        borderRadius: '8px',
        border: '1px solid #E5E0F5',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        color: '#1A1040',
    },
    tbAv: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #5B2EE8, #A78BFF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
    },
    content: {
        flex: 1,
        padding: '24px',
    },
};