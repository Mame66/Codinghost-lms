import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Notifications() {
    const [notifs, setNotifs] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchNotifs();
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifs(res.data);
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/all/lu');
            setNotifs(notifs.map(n => ({ ...n, lu: true })));
        } catch (err) { console.error(err); }
    };

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/lu`);
            setNotifs(notifs.map(n => n.id === id ? { ...n, lu: true } : n));
        } catch (err) { console.error(err); }
    };

    const unread = notifs.filter(n => !n.lu).length;

    const typeIcons = {
        NOTE: '📝',
        DEVOIR: '✏️',
        INFO: 'ℹ️',
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
                            <span style={s.headerTitle}>🔔 Notifications</span>
                            {unread > 0 && (
                                <button style={s.markAllBtn} onClick={markAllRead}>
                                    Tout marquer lu
                                </button>
                            )}
                        </div>

                        {notifs.length === 0 ? (
                            <div style={s.empty}>Aucune notification</div>
                        ) : (
                            <div style={s.list}>
                                {notifs.map(notif => (
                                    <div
                                        key={notif.id}
                                        style={{
                                            ...s.item,
                                            background: notif.lu ? '#fff' : '#F5F2FF',
                                            borderLeft: notif.lu ? '3px solid transparent' : '3px solid #5B2EE8',
                                        }}
                                        onClick={() => !notif.lu && markRead(notif.id)}
                                    >
                                        <div style={s.itemIcon}>
                                            {typeIcons[notif.type] || 'ℹ️'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={s.itemTitle}>{notif.titre}</div>
                                            <div style={s.itemMsg}>{notif.message}</div>
                                            <div style={s.itemTime}>
                                                {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        {!notif.lu && <div style={s.dot} />}
                                    </div>
                                ))}
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
    badge: { position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', background: '#FF3B5C', borderRadius: '50%', fontSize: '10px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' },
    overlay: { position: 'fixed', inset: 0, zIndex: 98 },
    dropdown: { position: 'absolute', top: '44px', right: 0, width: '340px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E5E0F5' },
    headerTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040' },
    markAllBtn: { fontSize: '11px', fontWeight: '700', color: '#5B2EE8', background: 'none', border: 'none', cursor: 'pointer' },
    list: { maxHeight: '380px', overflowY: 'auto' },
    empty: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    item: { display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.15s' },
    itemIcon: { width: '32px', height: '32px', background: '#F8F6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
    itemTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040', marginBottom: '2px' },
    itemMsg: { fontSize: '12px', color: '#6B7280', lineHeight: 1.4 },
    itemTime: { fontSize: '11px', color: '#9CA3AF', marginTop: '4px' },
    dot: { width: '8px', height: '8px', background: '#5B2EE8', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
};