import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Ic } from '../components/Icons';

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
        try { const res = await api.get('/notifications'); setNotifs(res.data); }
        catch (err) { console.error(err); }
    };

    const markRead = async (id) => {
        try { await api.put(`/notifications/${id}/lu`); setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n)); }
        catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try { await api.put('/notifications/all/lu'); setNotifs(prev => prev.map(n => ({ ...n, lu: true }))); }
        catch (err) { console.error(err); }
    };

    const handleClick = async (notif) => {
        if (!notif.lu) await markRead(notif.id);
        setOpen(false);
        if (notif.type === 'NOTE') navigate('/my-grades');
        else if (notif.type === 'DEVOIR') navigate(user?.role === 'STUDENT' ? '/homeworks' : '/homeworks');
        else navigate(user?.role === 'STUDENT' ? '/course' : '/dashboard');
    };

    const unread = notifs.filter(n => !n.lu).length;

    const getTypeConfig = (type) => {
        if (type === 'NOTE')   return { icon: 'note',     color: '#5B2EE8', bg: '#EDE8FF', label: 'Voir mes notes' };
        if (type === 'DEVOIR') return user?.role === 'STUDENT'
            ? { icon: 'homework', color: '#CC3300', bg: '#FFF0EB', label: 'Voir mes devoirs' }
            : { icon: 'inbox',    color: '#CC3300', bg: '#FFF0EB', label: 'Corriger' };
        return { icon: 'info', color: '#0069C0', bg: 'rgba(33,150,243,0.12)', label: 'Voir' };
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
        <div style={{ position: 'relative' }}>
            {/* Bell button */}
            <button style={s.bell} onClick={() => setOpen(!open)}>
                <Ic name="bell" size={18} color="#6B7280" />
                {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
            </button>

            {open && (
                <>
                    <div style={s.overlay} onClick={() => setOpen(false)} />
                    <div style={s.dropdown}>
                        {/* Header */}
                        <div style={s.header}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Ic name="bell" size={15} color="#1A1040" />
                                <span style={s.headerTitle}>Notifications</span>
                                {unread > 0 && <span style={s.unreadBadge}>{unread} nouvelle{unread > 1 ? 's' : ''}</span>}
                            </div>
                            {unread > 0 && (
                                <button style={s.markAllBtn} onClick={markAllRead}>
                                    <Ic name="check" size={12} color="#5B2EE8" /> Tout lire
                                </button>
                            )}
                        </div>

                        {/* List */}
                        {notifs.length === 0 ? (
                            <div style={s.empty}>
                                <div style={{ width: '44px', height: '44px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                    <Ic name="bell" size={20} color="#9CA3AF" />
                                </div>
                                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Aucune notification</div>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {notifs.map(notif => {
                                    const tc = getTypeConfig(notif.type);
                                    return (
                                        <div key={notif.id}
                                             style={{ ...s.item, background: notif.lu ? '#fff' : '#F5F2FF', borderLeft: notif.lu ? '3px solid transparent' : '3px solid #5B2EE8', cursor: 'pointer' }}
                                             onClick={() => handleClick(notif)}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Ic name={tc.icon} size={17} color={tc.color} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={s.itemTitle}>{notif.titre}</div>
                                                <div style={s.itemMsg}>{notif.message}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9CA3AF' }}>
                                                        <Ic name="clock" size={11} color="#9CA3AF" /> {timeAgo(notif.createdAt)}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '700', color: tc.color }}>
                                                        {tc.label} <Ic name="arrow_right" size={11} color={tc.color} />
                                                    </span>
                                                </div>
                                            </div>
                                            {!notif.lu && <div style={{ width: '8px', height: '8px', background: '#5B2EE8', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {notifs.length > 0 && (
                            <div style={s.footer}>
                                <button style={s.clearBtn} onClick={markAllRead}>
                                    <Ic name="check" size={13} color="#6B7280" /> Tout marquer comme lu
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
    bell: { width: '36px', height: '36px', borderRadius: '9px', background: '#F8F6FF', border: '1px solid #E5E0F5', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', background: '#FF3B5C', borderRadius: '50px', fontSize: '10px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', padding: '0 3px' },
    overlay: { position: 'fixed', inset: 0, zIndex: 98 },
    dropdown: { position: 'absolute', top: '44px', right: 0, width: '360px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF' },
    headerTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040' },
    unreadBadge: { background: '#EDE8FF', color: '#5B2EE8', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    markAllBtn: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#5B2EE8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    empty: { padding: '32px', textAlign: 'center' },
    item: { display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' },
    itemTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '2px' },
    itemMsg: { fontSize: '12px', color: '#6B7280', lineHeight: 1.4, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    footer: { padding: '10px 16px', borderTop: '1px solid #E5E0F5', background: '#FAFAFA' },
    clearBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', background: 'transparent', border: '1px solid #E5E0F5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' },
};