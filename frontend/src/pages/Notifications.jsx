import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
    const { user } = useAuth();
    const [notifs, setNotifs] = useState([]);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifs(res.data);
        } catch (err) { console.error(err); }
    };

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/lu`);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/all/lu');
            setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
        } catch (err) { console.error(err); }
    };

    // ✅ Redirection correcte selon le rôle et le type
    const handleClick = async (notif) => {
        if (!notif.lu) await markRead(notif.id);
        setOpen(false);

        if (notif.type === 'NOTE') {
            // Étudiant → mes notes
            navigate('/my-grades');
        } else if (notif.type === 'DEVOIR') {
            if (user?.role === 'STUDENT') {
                // Étudiant → ses devoirs à faire
                navigate('/my-homeworks');
            } else {
                // Enseignant/Admin → page correction
                navigate('/homeworks');
            }
        } else {
            // INFO → cours
            if (user?.role === 'STUDENT') {
                navigate('/course');
            } else {
                navigate('/dashboard');
            }
        }
    };

    const unread = notifs.filter(n => !n.lu).length;

    const getTypeConfig = (type) => {
        if (type === 'NOTE') return { icon: '📝', color: '#5B2EE8', bg: '#EDE8FF', actionLabel: 'Voir mes notes' };
        if (type === 'DEVOIR') {
            if (user?.role === 'STUDENT') return { icon: '✏️', color: '#CC3300', bg: '#FFF0EB', actionLabel: 'Voir mes devoirs' };
            return { icon: '📥', color: '#CC3300', bg: '#FFF0EB', actionLabel: 'Corriger' };
        }
        return { icon: 'ℹ️', color: '#0069C0', bg: 'rgba(33,150,243,0.12)', actionLabel: 'Voir' };
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins} min`;
        if (hours < 24) return `${hours}h`;
        return `${days}j`;
    };

    return (
        <div style={s.wrap}>
            <button style={s.bell} onClick={() => setOpen(!open)}>
                🔔
                {unread > 0 && (
                    <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {open && (
                <>
                    <div style={s.overlay} onClick={() => setOpen(false)} />
                    <div style={s.dropdown}>
                        <div style={s.header}>
                            <div>
                                <span style={s.headerTitle}>🔔 Notifications</span>
                                {unread > 0 && (
                                    <span style={s.unreadBadge}>{unread} nouvelle{unread > 1 ? 's' : ''}</span>
                                )}
                            </div>
                            {unread > 0 && (
                                <button style={s.markAllBtn} onClick={markAllRead}>Tout lire</button>
                            )}
                        </div>

                        {notifs.length === 0 ? (
                            <div style={s.empty}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Aucune notification</div>
                            </div>
                        ) : (
                            <div style={s.list}>
                                {notifs.map(notif => {
                                    const tc = getTypeConfig(notif.type);
                                    return (
                                        <div key={notif.id}
                                             style={{
                                                 ...s.item,
                                                 background: notif.lu ? '#fff' : '#F5F2FF',
                                                 borderLeft: notif.lu ? '3px solid transparent' : '3px solid #5B2EE8',
                                                 cursor: 'pointer',
                                             }}
                                             onClick={() => handleClick(notif)}>
                                            <div style={{ ...s.itemIcon, background: tc.bg, color: tc.color }}>
                                                {tc.icon}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={s.itemTitle}>{notif.titre}</div>
                                                <div style={s.itemMsg}>{notif.message}</div>
                                                <div style={s.itemFooter}>
                                                    <span style={s.itemTime}>{timeAgo(notif.createdAt)}</span>
                                                    <span style={{ ...s.itemAction, color: tc.color }}>
                            {tc.actionLabel} →
                          </span>
                                                </div>
                                            </div>
                                            {!notif.lu && <div style={s.dot} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {notifs.length > 0 && (
                            <div style={s.footer}>
                                <button style={s.clearBtn} onClick={markAllRead}>
                                    ✓ Tout marquer comme lu
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const s = {
    wrap: { position: 'relative' },
    bell: { width: '36px', height: '36px', borderRadius: '9px', background: '#F8F6FF', border: '1px solid #E5E0F5', cursor: 'pointer', fontSize: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', background: '#FF3B5C', borderRadius: '50px', fontSize: '10px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', padding: '0 3px' },
    overlay: { position: 'fixed', inset: 0, zIndex: 98 },
    dropdown: { position: 'absolute', top: '44px', right: 0, width: '360px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF' },
    headerTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040' },
    unreadBadge: { marginLeft: '8px', background: '#EDE8FF', color: '#5B2EE8', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    markAllBtn: { fontSize: '12px', fontWeight: '700', color: '#5B2EE8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    list: { maxHeight: '400px', overflowY: 'auto' },
    empty: { padding: '32px', textAlign: 'center' },
    item: { display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' },
    itemIcon: { width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, fontWeight: '700' },
    itemTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '2px' },
    itemMsg: { fontSize: '12px', color: '#6B7280', lineHeight: 1.4, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    itemFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    itemTime: { fontSize: '11px', color: '#9CA3AF' },
    itemAction: { fontSize: '11px', fontWeight: '700' },
    dot: { width: '8px', height: '8px', background: '#5B2EE8', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
    footer: { padding: '10px 16px', borderTop: '1px solid #E5E0F5', background: '#FAFAFA' },
    clearBtn: { width: '100%', padding: '8px', background: 'transparent', border: '1px solid #E5E0F5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' },
};