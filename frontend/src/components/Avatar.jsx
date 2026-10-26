import { useRef, useState } from 'react';
import api from '../api/axios';
import { resizeImageToDataUrl } from '../utils/image';

const GRADIENTS = [
    'linear-gradient(135deg,#5B2EE8,#A78BFF)',
    'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    'linear-gradient(135deg,#059669,#34D399)',
    'linear-gradient(135deg,#EA580C,#FBBF24)',
    'linear-gradient(135deg,#DB2777,#F472B6)',
    'linear-gradient(135deg,#1D4ED8,#60A5FA)',
];

const initialsOf = (prenom, nom) => `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase() || '?';
const gradientOf = (seed) => {
    const s = String(seed || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
};

// Photo de profil ou initiales
export default function Avatar({ user, prenom, nom, src, size = 34, radius = '50%', ring, style }) {
    const p = prenom ?? user?.prenom;
    const n = nom ?? user?.nom;
    const url = src ?? user?.avatarUrl;
    const [broken, setBroken] = useState(false);
    const base = {
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${ring}` : undefined,
        ...style,
    };
    if (url && !broken) {
        return <img src={url} alt={`${p || ''} ${n || ''}`.trim()} onError={() => setBroken(true)}
                    style={{ ...base, objectFit: 'cover', display: 'block', background: '#F3F4F6' }} />;
    }
    return (
        <div style={{
            ...base, background: gradientOf(`${p}${n}`), color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.max(10, Math.round(size * 0.36)), fontWeight: 800, letterSpacing: '0.3px',
        }}>
            {initialsOf(p, n)}
        </div>
    );
}

// Avatar cliquable pour changer la photo.
// endpoint : '/users/me/avatar' (sa propre photo) ou `/users/${id}/avatar` (admin)
export function AvatarUpload({ user, size = 72, endpoint = '/users/me/avatar', onChange, canRemove = true }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [hover, setHover] = useState(false);

    const pick = () => !busy && inputRef.current?.click();

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError('');
        setBusy(true);
        try {
            const image = await resizeImageToDataUrl(file);
            const r = await api.post(endpoint, { image });
            onChange?.(r.data.avatarUrl);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Erreur lors de l\'envoi');
        }
        setBusy(false);
    };

    const remove = async () => {
        if (!window.confirm('Retirer la photo ?')) return;
        setBusy(true);
        setError('');
        try {
            await api.delete(endpoint);
            onChange?.(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
        setBusy(false);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative', cursor: busy ? 'wait' : 'pointer' }}
                 onClick={pick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                 title="Changer la photo">
                <Avatar user={user} size={size} />
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(15,10,30,0.55)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, opacity: busy || hover ? 1 : 0, transition: 'opacity 0.15s',
                }}>
                    {busy ? '…' : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                        </svg>
                    )}
                </div>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onFile} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={pick} disabled={busy} style={btn}>
                        {busy ? 'Envoi…' : user?.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
                    </button>
                    {canRemove && user?.avatarUrl && (
                        <button type="button" onClick={remove} disabled={busy} style={{ ...btn, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}>
                            Retirer
                        </button>
                    )}
                </div>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>JPG, PNG ou WEBP — recadrée automatiquement</span>
                {error && <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, maxWidth: '320px' }}>{error}</span>}
            </div>
        </div>
    );
}

const btn = {
    padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #E5E0F5', background: '#fff',
    fontSize: '12px', fontWeight: 700, color: '#5B2EE8', cursor: 'pointer', fontFamily: 'inherit',
};
