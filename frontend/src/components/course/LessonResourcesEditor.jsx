import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import ResourceViewer, { KindBadge } from './ResourceViewer';
import { KINDS, resourceKind, formatSize, uploadLessonFile, isTeacherOnlyPath, errMsg, linkInfo, MAX_FILE_BYTES } from '../../utils/files';

const VisPill = ({ value, onClick, disabled }) => {
    const teacher = value === 'TEACHER';
    return (
        <button type="button" onClick={onClick} disabled={disabled}
                title={teacher ? 'Visible seulement par les enseignants — cliquer pour montrer aux élèves' : 'Visible par les élèves — cliquer pour réserver au prof'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                         border: `1.5px solid ${teacher ? '#BAE6FD' : '#BBF7D0'}`, background: teacher ? '#F0F9FF' : '#F0FDF4', color: teacher ? '#0369A1' : '#15803D' }}>
            {teacher ? '🔒 Prof uniquement' : '👁 Élèves'}
        </button>
    );
};

export default function LessonResourcesEditor({ lessonId, resources = [], onChanged, notify }) {
    const [list, setList] = useState(resources);
    const [queue, setQueue] = useState([]);       // envois en cours
    const [drag, setDrag] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [showLink, setShowLink] = useState(false);
    const [link, setLink] = useState({ url: '', titre: '', teacher: false });
    const [busy, setBusy] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { setList(resources); }, [resources]);

    const refresh = async () => {
        const { data } = await api.get(`/lessons/lessons/${lessonId}`);
        setList(data.resources || []);
        onChanged?.(data);
    };

    const addFiles = async (fileList) => {
        const files = Array.from(fileList || []).filter(f => f.size > 0 || f.name);
        if (!files.length) return;
        const items = files.map((f, i) => ({
            key: `${Date.now()}-${i}`, file: f, progress: 0,
            visibility: isTeacherOnlyPath(f.webkitRelativePath || f.name) ? 'TEACHER' : 'STUDENT',
            error: f.size > MAX_FILE_BYTES ? `Trop lourd (${formatSize(f.size)}). Limite 50 Mo : utilisez un lien Drive.` : null,
        }));
        setQueue(q => [...q, ...items]);
        let okCount = 0;
        for (const it of items) {
            if (it.error) continue;
            try {
                await uploadLessonFile(lessonId, it.file, { visibility: it.visibility }, (p) =>
                    setQueue(q => q.map(x => x.key === it.key ? { ...x, progress: p } : x)));
                okCount++;
                setQueue(q => q.filter(x => x.key !== it.key));
            } catch (e) {
                setQueue(q => q.map(x => x.key === it.key ? { ...x, error: errMsg(e) } : x));
            }
        }
        if (okCount) { await refresh(); notify?.(`${okCount} fichier${okCount > 1 ? 's' : ''} ajouté${okCount > 1 ? 's' : ''}`); }
    };

    const addLink = async () => {
        if (!/^https?:\/\//i.test(link.url.trim())) return notify?.('Le lien doit commencer par https://', 'error');
        setBusy(true);
        try {
            await api.post(`/content/lessons/${lessonId}/resources`, { kind: 'LINK', url: link.url.trim(), titre: link.titre.trim(), visibility: link.teacher ? 'TEACHER' : 'STUDENT' });
            setLink({ url: '', titre: '', teacher: false }); setShowLink(false);
            await refresh(); notify?.('Lien ajouté');
        } catch (e) { notify?.(errMsg(e), 'error'); }
        setBusy(false);
    };

    const update = async (r, data) => {
        try {
            const res = await api.put(`/content/resources/${r.id}`, data);
            setList(l => l.map(x => x.id === r.id ? res.data : x));
            onChanged?.(null);
        } catch (e) { notify?.(errMsg(e), 'error'); }
    };

    const remove = async (r) => {
        if (!window.confirm(`Supprimer « ${r.titre} » de la leçon ?`)) return;
        try { await api.delete(`/content/resources/${r.id}`); await refresh(); notify?.('Supprimé'); }
        catch (e) { notify?.(errMsg(e), 'error'); }
    };

    const move = async (idx, dir) => {
        const next = [...list];
        const j = idx + dir;
        if (j < 0 || j >= next.length) return;
        [next[idx], next[j]] = [next[j], next[idx]];
        setList(next);
        try { await api.put(`/content/lessons/${lessonId}/resources/reorder`, { orderedIds: next.map(r => r.id) }); }
        catch (e) { notify?.(errMsg(e), 'error'); }
    };

    const saveTitle = async (r) => {
        const t = editTitle.trim();
        setEditingId(null);
        if (t && t !== r.titre) await update(r, { titre: t });
    };

    const studentCount = list.filter(r => r.visibility === 'STUDENT').length;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 7 }}>
                    📎 Fichiers et liens
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                        ({list.length}{list.length ? ` · ${studentCount} visible${studentCount > 1 ? 's' : ''} par les élèves` : ''})
                    </span>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 7px', borderRadius: 4 }}>optionnel</span>
            </div>

            {/* Zone de dépôt */}
            <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                style={{ border: `2px dashed ${drag ? '#6C47FF' : '#D4CCFF'}`, background: drag ? '#F1EDFF' : '#FAF9FF', borderRadius: 14, padding: '18px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>⬆️</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040' }}>Glissez vos fichiers ici ou cliquez pour choisir</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
                    PDF, PowerPoint, Word, images, vidéos, scripts, Scratch (.sb3), ZIP… · 50 Mo max par fichier<br />
                    Un nom contenant « prof », « guide » ou « corrigé » est automatiquement réservé au prof.
                </div>
                <input ref={inputRef} type="file" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>

            {/* Envois en cours */}
            {queue.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {queue.map(it => (
                        <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: it.error ? '#FEF2F2' : '#F8F7FF', border: `1px solid ${it.error ? '#FECACA' : '#EDE8FF'}` }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.file.name}</div>
                                {it.error
                                    ? <div style={{ fontSize: 12, color: '#B91C1C' }}>{it.error}</div>
                                    : <div style={{ height: 5, background: '#EDE8FF', borderRadius: 50, marginTop: 5, overflow: 'hidden' }}><div style={{ width: `${Math.round(it.progress * 100)}%`, height: '100%', background: '#6C47FF', transition: 'width .2s' }} /></div>}
                            </div>
                            {it.error
                                ? <button type="button" style={st.iconBtn} onClick={() => setQueue(q => q.filter(x => x.key !== it.key))} title="Fermer">✕</button>
                                : <span style={{ fontSize: 12, fontWeight: 700, color: '#6C47FF' }}>{Math.round(it.progress * 100)}%</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Liste */}
            {list.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    {list.map((r, idx) => {
                        const k = KINDS[resourceKind(r)] || KINDS.other;
                        const meta = r.kind === 'LINK'
                            ? `${k.label} · ${(() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return r.url; } })()}`
                            : `${k.label}${r.size ? ` · ${formatSize(r.size)}` : ''}`;
                        return (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: '#fff', border: '1px solid #EBEBF5' }} className="ch-wrap-sm">
                                <KindBadge resource={r} size={34} />
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    {editingId === r.id ? (
                                        <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                               onBlur={() => saveTitle(r)}
                                               onKeyDown={e => { if (e.key === 'Enter') saveTitle(r); if (e.key === 'Escape') setEditingId(null); }}
                                               style={{ width: '100%', padding: '5px 8px', border: '1.5px solid #6C47FF', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                                    ) : (
                                        <button type="button" onClick={() => { setEditingId(r.id); setEditTitle(r.titre); }} title="Cliquer pour renommer"
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'text', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#1A1040', textAlign: 'left', wordBreak: 'break-word' }}>
                                            {r.titre}
                                        </button>
                                    )}
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{meta}</div>
                                </div>
                                <VisPill value={r.visibility} onClick={() => update(r, { visibility: r.visibility === 'TEACHER' ? 'STUDENT' : 'TEACHER' })} />
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button type="button" style={st.iconBtn} title="Aperçu" onClick={() => setViewing(r)}>👁</button>
                                    <button type="button" style={st.iconBtn} title="Monter" disabled={idx === 0} onClick={() => move(idx, -1)}>↑</button>
                                    <button type="button" style={st.iconBtn} title="Descendre" disabled={idx === list.length - 1} onClick={() => move(idx, 1)}>↓</button>
                                    <button type="button" style={{ ...st.iconBtn, background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }} title="Supprimer" onClick={() => remove(r)}>🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Ajouter un lien */}
            {showLink ? (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input placeholder="https://drive.google.com/…  ou  https://youtu.be/…" value={link.url} onChange={e => setLink(l => ({ ...l, url: e.target.value }))} style={st.input} autoFocus />
                    {link.url && linkInfo(link.url).provider === 'google-folder' && (
                        <div style={{ fontSize: 12, color: '#0369A1' }}>Dossier Drive : les élèves l'ouvriront dans Google Drive (pensez au partage « Tous les utilisateurs disposant du lien »).</div>
                    )}
                    <input placeholder="Titre affiché (optionnel)" value={link.titre} onChange={e => setLink(l => ({ ...l, titre: e.target.value }))} style={st.input} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                            <input type="checkbox" checked={link.teacher} onChange={e => setLink(l => ({ ...l, teacher: e.target.checked }))} /> Réservé au prof
                        </label>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button type="button" style={st.ghost} onClick={() => setShowLink(false)}>Annuler</button>
                            <button type="button" style={st.primary} onClick={addLink} disabled={busy || !link.url.trim()}>{busy ? 'Ajout…' : 'Ajouter le lien'}</button>
                        </div>
                    </div>
                </div>
            ) : (
                <button type="button" style={{ ...st.ghost, marginTop: 10 }} onClick={() => setShowLink(true)}>🔗 Ajouter un lien (Google Drive, YouTube, site…)</button>
            )}

            {viewing && <ResourceViewer resource={viewing} onClose={() => setViewing(null)} />}
        </div>
    );
}

const st = {
    iconBtn: { width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#F8F7FF', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', color: '#374151', padding: 0 },
    input: { padding: '9px 12px', border: '1.5px solid #BAE6FD', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
    ghost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 9, color: '#6C47FF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primary: { padding: '8px 14px', background: '#0369A1', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
