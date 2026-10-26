import { useEffect, useState } from 'react';
import '../../styles/course.css';
import api from '../../api/axios';
import { KINDS, resourceKind, previewMode, linkInfo, formatSize, errMsg, openSigned } from '../../utils/files';

// Petite pastille d'icône selon le type de fichier
export const KindBadge = ({ resource, size = 36 }) => {
    const k = KINDS[resourceKind(resource)] || KINDS.other;
    return (
        <div title={k.label} style={{ width: size, height: size, borderRadius: size * 0.28, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, flexShrink: 0 }}>
            {k.emoji}
        </div>
    );
};

const HINTS = {
    scratch: "Télécharge le fichier, puis dans Scratch : Fichier → Charger depuis ton ordinateur.",
    zip: "Télécharge l'archive puis fais clic droit → Extraire tout.",
};

// Visionneuse plein écran d'une ressource (fichier ou lien)
export default function ResourceViewer({ resource, onClose, onOpened }) {
    const kind = resourceKind(resource);
    const k = KINDS[kind] || KINDS.other;
    const isLink = resource.kind === 'LINK';
    const mode = isLink ? (linkInfo(resource.url).embedUrl ? 'embed' : 'none') : previewMode(kind);

    const [url, setUrl] = useState(isLink ? resource.url : null);
    const [text, setText] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!isLink);

    useEffect(() => {
        let alive = true;
        onOpened?.(resource);
        if (isLink) return undefined;
        (async () => {
            try {
                const { data } = await api.get(`/content/resources/${resource.id}/url`);
                if (!alive) return;
                setUrl(data.url);
                if (mode === 'text') {
                    const r = await fetch(data.url);
                    const t = await r.text();
                    if (alive) setText(t.length > 200000 ? t.slice(0, 200000) + '\n…' : t);
                }
            } catch (e) { if (alive) setError(errMsg(e, 'Impossible d\'ouvrir ce fichier')); }
            if (alive) setLoading(false);
        })();
        return () => { alive = false; };
    }, [resource.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const download = async () => {
        try { await openSigned(`/content/resources/${resource.id}/url?download=1`); }
        catch (e) { setError(errMsg(e)); }
    };

    let body;
    if (error) body = <Center><div style={{ color: '#FCA5A5', fontWeight: 700 }}>{error}</div></Center>;
    else if (loading) body = <Center><div style={st.spinner} /></Center>;
    else if (mode === 'embed') body = <iframe title={resource.titre} src={linkInfo(resource.url).embedUrl} style={st.frame} allow="autoplay; fullscreen; encrypted-media" allowFullScreen />;
    else if (mode === 'iframe') body = <iframe title={resource.titre} src={url} style={{ ...st.frame, background: '#fff' }} />;
    else if (mode === 'office') body = <iframe title={resource.titre} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} style={{ ...st.frame, background: '#fff' }} allowFullScreen />;
    else if (mode === 'image') body = <Center><img src={url} alt={resource.titre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} /></Center>;
    else if (mode === 'video') body = <Center><video src={url} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} /></Center>;
    else if (mode === 'audio') body = <Center><audio src={url} controls /></Center>;
    else if (mode === 'text') body = <pre style={st.code}>{text}</pre>;
    else body = (
        <Center>
            <div style={{ textAlign: 'center', color: '#E2E8F0', maxWidth: 420, padding: 20 }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>{k.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{resource.titre}</div>
                <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20, lineHeight: 1.6 }}>
                    {isLink ? 'Ce lien s\'ouvre dans un nouvel onglet.' : (HINTS[kind] || 'Ce type de fichier ne s\'affiche pas dans le navigateur.')}
                </div>
                {isLink
                    ? <a href={resource.url} target="_blank" rel="noreferrer" style={st.bigBtn}>Ouvrir le lien ↗</a>
                    : <button onClick={download} style={st.bigBtn}>⬇ Télécharger{resource.size ? ` (${formatSize(resource.size)})` : ''}</button>}
            </div>
        </Center>
    );

    return (
        <div style={st.overlay} role="dialog" aria-modal="true" aria-label={resource.titre}>
            <div style={st.bar}>
                <button onClick={onClose} style={st.back}>← Retour</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.titre}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{k.label}{resource.size ? ` · ${formatSize(resource.size)}` : ''}</div>
                </div>
                {isLink
                    ? <a href={resource.url} target="_blank" rel="noreferrer" style={st.barBtn}>Ouvrir ↗</a>
                    : <button onClick={download} style={st.barBtn} disabled={!!error && !url}>⬇ <span className="ch-hide-sm">Télécharger</span></button>}
            </div>
            <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#0F172A' }}>{body}</div>
            {mode === 'office' && !error && (
                <div style={{ background: '#0F172A', color: '#94A3B8', fontSize: 11, padding: '6px 14px', textAlign: 'center' }}>
                    Aperçu fourni par Microsoft Office Online. S'il ne s'affiche pas, utilisez « Télécharger ».
                </div>
            )}
        </div>
    );
}

const Center = ({ children }) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>{children}</div>
);

const st = {
    overlay: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#0F172A' },
    bar: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#111827', borderBottom: '1px solid #1F2937' },
    back: { padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    barBtn: { padding: '8px 14px', background: '#6C47FF', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', flexShrink: 0 },
    bigBtn: { display: 'inline-block', padding: '12px 22px', background: '#6C47FF', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
    frame: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' },
    code: { position: 'absolute', inset: 0, margin: 0, padding: 20, overflow: 'auto', color: '#E2E8F0', fontFamily: '"Fira Code","Courier New",monospace', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    spinner: { width: 36, height: 36, border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #A78BFA', borderRadius: '50%', animation: 'chspin 0.8s linear infinite' },
};
