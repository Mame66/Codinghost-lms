import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Notifications from "../pages/Notifications";

// ════════════════════════════════════════════════════════════
// LOGO CODINGHOST — SVG inline exact
// ════════════════════════════════════════════════════════════
const CodingHostLogo = ({ collapsed = false }) => (
    <svg viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg"
         style={{ width: collapsed ? '36px' : '140px', height: collapsed ? '36px' : 'auto', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'visible' }}>
        <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#6C4CF5"/>
                <stop offset="50%"  stopColor="#9B4DE1"/>
                <stop offset="100%" stopColor="#F4A340"/>
            </linearGradient>
        </defs>
        {/* Icône */}
        <rect x="40" y="60" width="260" height="170" rx="28" fill="none" stroke="url(#logoGrad)" strokeWidth="16"/>
        <text x="95" y="165" fontSize="92" fontFamily="monospace" fill="url(#logoGrad)" fontWeight="700">{'</>'}</text>
        <rect x="135" y="235" width="70" height="30" fill="url(#logoGrad)"/>
        <rect x="110" y="265" width="120" height="12" fill="url(#logoGrad)"/>
        {/* Texte — caché quand collapsed */}
        {!collapsed && (
            <>
                <text x="360" y="175" fontFamily="'Poppins','Montserrat',Arial,sans-serif" fontWeight="700" fontSize="150" fill="#4B2FBF">Coding Host</text>
                <text x="360" y="245" fontFamily="'Poppins',Arial,sans-serif" fontSize="46" fill="#4B2FBF" opacity="0.9">Centre de formation numérique • Enfants et adultes</text>
            </>
        )}
    </svg>
);

// ════════════════════════════════════════════════════════════
// ICÔNES SVG PREMIUM — redessinées, fines, modernes
// ════════════════════════════════════════════════════════════
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' };
    const icons = {
        dashboard: <svg {...p}>
            <rect x="3" y="3" width="8" height="8" rx="2"/>
            <rect x="13" y="3" width="8" height="8" rx="2"/>
            <rect x="3" y="13" width="8" height="8" rx="2"/>
            <path d="M13 17h8M17 13v8"/>
        </svg>,
        groups: <svg {...p}>
            <circle cx="8" cy="7" r="3.5"/>
            <path d="M3 20v-1a5 5 0 0 1 10 0v1"/>
            <circle cx="17" cy="8" r="2.5"/>
            <path d="M14 20v-.5a4 4 0 0 1 6 0V20"/>
        </svg>,
        courses: <svg {...p}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <line x1="8" y1="7" x2="16" y2="7"/>
            <line x1="8" y1="11" x2="13" y2="11"/>
        </svg>,
        students: <svg {...p}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>,
        attendance: <svg {...p}>
            <rect x="3" y="4" width="18" height="18" rx="2.5"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <polyline points="8 16 10.5 18.5 16 13"/>
        </svg>,
        payments: <svg {...p}>
            <rect x="1" y="4" width="22" height="16" rx="2.5"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
            <circle cx="7" cy="15" r="1" fill={color}/>
            <line x1="11" y1="15" x2="15" y2="15"/>
        </svg>,
        billing: <svg {...p}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 13h2.5a1.5 1.5 0 0 1 0 3H9"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
            <line x1="9" y1="17" x2="11" y2="17"/>
        </svg>,
        homeworks: <svg {...p}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>,
        settings: <svg {...p}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>,
        grade: <svg {...p}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>,
        course: <svg {...p}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>,
        logout: <svg {...p}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>,
        chevron_right: <svg {...p}>
            <polyline points="9 18 15 12 9 6"/>
        </svg>,
        euro: <svg {...p}>
            <path d="M4 10h12M4 14h12"/>
            <path d="M19.5 9.5c-1-1.7-2.9-2.8-5-2.8a6 6 0 0 0 0 12c2.1 0 4-1.1 5-2.8"/>
        </svg>,
    };
    return icons[name] ? <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icons[name]}</span> : null;
};

// ════════════════════════════════════════════════════════════
// NAVIGATION PAR RÔLE
// ════════════════════════════════════════════════════════════
const NAV = {
    ADMIN: [
        { icon: 'dashboard',  label: 'Tableau de bord',   path: '/dashboard',  color: '#6C4CF5' },
        { icon: 'groups',     label: 'Groupes',            path: '/groups',     color: '#0891B2' },
        { icon: 'courses',    label: 'Mes cours',          path: '/my-courses', color: '#7C3AED' },
        { icon: 'students',   label: 'Étudiants',          path: '/students',   color: '#059669' },
        { icon: 'attendance', label: 'Présences',          path: '/attendance', color: '#D97706' },
        { icon: 'payments',   label: 'Paiements',          path: '/payments',   color: '#DC2626' },
        { icon: 'billing',    label: 'Facturation',        path: '/billing',    color: '#0284C7' },
        { icon: 'homeworks',  label: 'Devoirs',            path: '/homeworks',  color: '#9333EA' },
        { icon: 'settings',   label: 'Paramètres',         path: '/settings',   color: '#64748B' },
    ],
    TEACHER: [
        { icon: 'dashboard',  label: 'Tableau de bord',   path: '/dashboard',  color: '#6C4CF5' },
        { icon: 'groups',     label: 'Mes groupes',        path: '/groups',     color: '#0891B2' },
        { icon: 'courses',    label: 'Mes cours',          path: '/my-courses', color: '#7C3AED' },
        { icon: 'students',   label: 'Mes étudiants',      path: '/students',   color: '#059669' },
        { icon: 'attendance', label: 'Présences',          path: '/attendance', color: '#D97706' },
        { icon: 'homeworks',  label: 'Correction devoirs', path: '/homeworks',  color: '#9333EA' },
    ],
    STUDENT: [
        { icon: 'course',     label: 'Mon cours',          path: '/course',     color: '#6C4CF5' },
        { icon: 'homeworks',  label: 'Mes devoirs',        path: '/homeworks',  color: '#9333EA' },
        { icon: 'grade',      label: 'Mes notes',          path: '/my-grades',  color: '#D97706' },
    ],
};

// ════════════════════════════════════════════════════════════
// SIDEBAR ITEM avec animation et tooltip
// ════════════════════════════════════════════════════════════
function SideItem({ item, isActive, onClick, expanded }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: expanded ? '10px 16px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                background: isActive
                    ? `linear-gradient(135deg, ${item.color}22, ${item.color}11)`
                    : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: isActive ? `1px solid ${item.color}44` : '1px solid transparent',
                marginBottom: '2px',
                transform: hovered && !isActive ? 'translateX(2px)' : 'none',
            }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>

            {/* Barre active à gauche */}
            {isActive && (
                <div style={{
                    position: 'absolute', left: 0, top: '25%', bottom: '25%',
                    width: '3px', borderRadius: '0 2px 2px 0',
                    background: item.color,
                    animation: 'slideIn 0.3s ease',
                }} />
            )}

            {/* Icône */}
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? `${item.color}22` : hovered ? `${item.color}15` : 'transparent',
                transition: 'all 0.2s',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}>
                <Icon name={item.icon} size={19}
                      color={isActive ? item.color : hovered ? item.color : 'rgba(255,255,255,0.45)'} />
            </div>

            {/* Label (expanded) */}
            {expanded && (
                <span style={{
                    fontSize: '13px', fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#fff' : hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    transition: 'all 0.2s',
                    letterSpacing: isActive ? '0' : '-0.1px',
                }}>
                    {item.label}
                </span>
            )}

            {/* Tooltip (collapsed) */}
            {!expanded && hovered && (
                <div style={{
                    position: 'absolute', left: 'calc(100% + 12px)', top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1A0F3C',
                    color: '#fff', padding: '6px 12px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                    border: `1px solid ${item.color}44`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${item.color}22`,
                    zIndex: 9999, pointerEvents: 'none',
                    animation: 'fadeInTooltip 0.15s ease',
                }}>
                    {item.label}
                    <div style={{
                        position: 'absolute', left: '-5px', top: '50%',
                        width: '8px', height: '8px', background: '#1A0F3C',
                        border: `1px solid ${item.color}44`, borderRight: 'none', borderTop: 'none',
                        transform: 'translateY(-50%) rotate(45deg)',
                    }} />
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// LAYOUT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();
    const [expanded, setExpanded] = useState(false);
    const [hoverLogo, setHoverLogo] = useState(false);
    const sidebarRef = useRef(null);

    const navItems = NAV[user?.role] || [];
    const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();

    // Fermer la sidebar étendue si clic dehors
    useEffect(() => {
        const handleClick = (e) => {
            if (expanded && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [expanded]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const goHome = () => navigate(user?.role === 'STUDENT' ? '/course' : '/dashboard');

    const sideWidth = expanded ? '220px' : '68px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F4FC' }}>

            {/* ════════════════════════════════════════════════
                ANIMATIONS CSS globales
            ════════════════════════════════════════════════ */}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: scaleY(0); }
                    to   { opacity: 1; transform: scaleY(1); }
                }
                @keyframes fadeInTooltip {
                    from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
                    to   { opacity: 1; transform: translateY(-50%) translateX(0); }
                }
                @keyframes pulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(108,76,245,0.4); }
                    50%     { box-shadow: 0 0 0 6px rgba(108,76,245,0); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes float {
                    0%,100% { transform: translateY(0px); }
                    50%     { transform: translateY(-3px); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                .nav-item:hover .nav-icon { transform: scale(1.1); }
                .sidebar-expanded { width: 220px !important; }

                /* Scrollbar sidebar */
                .sidebar-scroll::-webkit-scrollbar { width: 3px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(108,76,245,0.3); border-radius: 10px; }

                /* Topbar hover */
                .tb-user:hover { background: #F0EEFF !important; border-color: #C4B5FD !important; }
                .tb-logout:hover { background: #FEF2F2 !important; color: #DC2626 !important; }
                .logo-btn:hover { transform: scale(1.05); }
                .logo-btn { transition: transform 0.2s ease; }
            `}</style>

            {/* ════════════════════════════════════════════════
                SIDEBAR
            ════════════════════════════════════════════════ */}
            <div ref={sidebarRef} style={{
                width: sideWidth,
                background: 'linear-gradient(180deg, #0D0820 0%, #140D2E 50%, #0A0618 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, bottom: 0, left: 0,
                zIndex: 100,
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                borderRight: '1px solid rgba(108,76,245,0.15)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
            }}>

                {/* Reflet décoratif haut */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '200px',
                    background: 'radial-gradient(ellipse at 50% -10%, rgba(108,76,245,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* ── Logo ───────────────────────────────── */}
                <div style={{
                    padding: expanded ? '20px 16px 16px' : '16px 8px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: expanded ? 'space-between' : 'center',
                    gap: '8px', cursor: 'pointer',
                    transition: 'padding 0.3s',
                }}
                     onClick={goHome}
                     className="logo-btn"
                     onMouseEnter={() => setHoverLogo(true)}
                     onMouseLeave={() => setHoverLogo(false)}>

                    {/* Icône logo seule (toujours visible) */}
                    <div style={{
                        width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6C4CF5, #9B4DE1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: hoverLogo ? '0 0 20px rgba(108,76,245,0.5)' : '0 4px 12px rgba(108,76,245,0.3)',
                        transition: 'box-shadow 0.3s',
                        animation: hoverLogo ? 'pulse 1s ease infinite' : 'none',
                    }}>
                        <svg viewBox="0 0 300 170" width="26" height="26">
                            <defs>
                                <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fff"/>
                                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)"/>
                                </linearGradient>
                            </defs>
                            <rect x="10" y="10" width="280" height="150" rx="28" fill="none" stroke="url(#iconGrad)" strokeWidth="16"/>
                            <text x="45" y="118" fontSize="90" fontFamily="monospace" fill="url(#iconGrad)" fontWeight="700">{'</>'}</text>
                        </svg>
                    </div>

                    {/* Nom (expanded uniquement) */}
                    {expanded && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '15px', fontWeight: '800', color: '#fff',
                                letterSpacing: '-0.3px', lineHeight: 1.2,
                                background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>CodingHost</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', marginTop: '2px' }}>
                                Centre de formation
                            </div>
                        </div>
                    )}

                    {/* Bouton expand/collapse */}
                    {expanded && (
                        <button style={{
                            width: '24px', height: '24px', borderRadius: '6px', border: 'none',
                            background: 'rgba(255,255,255,0.07)', cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255,255,255,0.4)',
                        }} onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>
                            <Icon name="chevron_right" size={13} color="rgba(255,255,255,0.4)" />
                        </button>
                    )}
                </div>

                {/* Bouton expand (collapsed) */}
                {!expanded && (
                    <button style={{
                        margin: '8px auto', width: '40px', height: '22px', borderRadius: '6px',
                        border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.25)',
                    }} onClick={() => setExpanded(true)} title="Agrandir">
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                            <line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                )}

                {/* ── Nav ────────────────────────────────── */}
                <div className="sidebar-scroll" style={{
                    flex: 1, overflowY: 'auto', overflowX: 'hidden',
                    padding: expanded ? '8px 10px' : '8px 6px',
                    display: 'flex', flexDirection: 'column', gap: '1px',
                }}>
                    {/* Section label */}
                    {expanded && (
                        <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '8px 8px 4px' }}>
                            Navigation
                        </div>
                    )}

                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        return (
                            <SideItem
                                key={item.path}
                                item={item}
                                isActive={isActive}
                                expanded={expanded}
                                onClick={() => { navigate(item.path); if (window.innerWidth < 768) setExpanded(false); }}
                            />
                        );
                    })}
                </div>

                {/* ── User / Logout ───────────────────────── */}
                <div style={{
                    padding: expanded ? '10px 10px 16px' : '10px 6px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                    {/* Info utilisateur */}
                    {expanded && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            marginBottom: '4px',
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #6C4CF5, #F4A340)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '800', color: '#fff',
                                boxShadow: '0 2px 8px rgba(108,76,245,0.4)',
                            }}>{initials}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user?.prenom} {user?.nom}
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                                    {user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Avatar seul si collapsed */}
                    {!expanded && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6C4CF5, #F4A340)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '800', color: '#fff',
                                boxShadow: '0 2px 10px rgba(108,76,245,0.4)',
                                cursor: 'default',
                            }}>{initials}</div>
                        </div>
                    )}

                    {/* Bouton logout */}
                    <LogoutBtn expanded={expanded} onClick={handleLogout} />
                </div>
            </div>

            {/* ════════════════════════════════════════════════
                MAIN CONTENT
            ════════════════════════════════════════════════ */}
            <div style={{
                marginLeft: sideWidth, flex: 1,
                display: 'flex', flexDirection: 'column', minHeight: '100vh',
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}>

                {/* ── Topbar ──────────────────────────────── */}
                <div style={{
                    height: '56px', background: '#fff',
                    borderBottom: '1px solid #EBEBF0',
                    display: 'flex', alignItems: 'center',
                    padding: '0 20px', gap: '12px',
                    position: 'sticky', top: 0, zIndex: 50,
                    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                }}>
                    {/* Fil d'ariane */}
                    <BreadCrumb location={location} navItems={navItems} />

                    <div style={{ flex: 1 }} />

                    {/* Notifications */}
                    <Notifications />

                    {/* Séparateur */}
                    <div style={{ width: '1px', height: '24px', background: '#EBEBF0' }} />

                    {/* User chip */}
                    <div className="tb-user" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 12px 6px 6px', borderRadius: '10px',
                        border: '1px solid #EBEBF0', cursor: 'pointer',
                        background: '#FAFAFA', transition: 'all 0.15s',
                    }} onClick={() => navigate('/settings')}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6C4CF5, #9B4DE1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: '800', color: '#fff',
                            flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1040' }}>{user?.prenom} {user?.nom}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TEACHER' ? 'Enseignant' : 'Étudiant'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content ─────────────────────────────── */}
                <div style={{ flex: 1, padding: '24px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Bouton logout ─────────────────────────────────────────────
function LogoutBtn({ expanded, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: expanded ? '9px 12px' : '9px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: '10px', cursor: 'pointer',
            background: hovered ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
            border: hovered ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.2s',
        }}
             onClick={onClick}
             onMouseEnter={() => setHovered(true)}
             onMouseLeave={() => setHovered(false)}>
            <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hovered ? 'rgba(220,38,38,0.15)' : 'transparent',
                transition: 'all 0.2s',
            }}>
                <Icon name="logout" size={16} color={hovered ? '#DC2626' : 'rgba(255,255,255,0.3)'} />
            </div>
            {expanded && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: hovered ? '#DC2626' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
                    Déconnexion
                </span>
            )}
        </div>
    );
}

// ── Fil d'ariane topbar ────────────────────────────────────────
function BreadCrumb({ location, navItems }) {
    const current = navItems.find(i =>
        location.pathname === i.path ||
        (i.path !== '/dashboard' && location.pathname.startsWith(i.path))
    );
    if (!current) return <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1040' }}>CodingHost</span>;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: `${current.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon name={current.icon} size={14} color={current.color} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1040' }}>{current.label}</span>
        </div>
    );
}