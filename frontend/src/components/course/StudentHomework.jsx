import { useRef, useState } from 'react';
import api from '../../api/axios';
import { formatSize, putToSignedUrl, errMsg, openSigned, MAX_FILE_BYTES, guessMime } from '../../utils/files';
import { fmtDate, isLate } from './GradeModal';

// Dépôt du devoir par l'élève (fichier ZIP, projet, document… ou lien)
export default function StudentHomework({ lesson, kid = true, onSubmitted }) {
    const t = (k, a) => (kid ? k : a);
    const [sub, setSub] = useState(lesson.mySubmission || null);
    const [editing, setEditing] = useState(!lesson.mySubmission);
    const [file, setFile] = useState(null);
    const [lien, setLien] = useState(lesson.mySubmission?.lienRendu || '');
    const [message, setMessage] = useState(lesson.mySubmission?.commentaireEleve || '');
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [drag, setDrag] = useState(false);
    const inputRef = useRef(null);

    const due = lesson.homeworkDueDate;
    const overdue = due && !sub && isLate({ submittedAt: new Date() }, due);
    const corrected = sub?.statut === 'CORRIGE';

    const pick = (f) => {
        if (!f) return;
        setError(null);
        if (f.size > MAX_FILE_BYTES) return setError(t(`Ton fichier est trop gros (${formatSize(f.size)}). Maximum 50 Mo.`, `Fichier trop lourd (${formatSize(f.size)}). Maximum 50 Mo : déposez plutôt un lien (Drive…).`));
        setFile(f);
    };

    const submit = async () => {
        setError(null);
        if (!file && !lien.trim() && !sub?.storagePath) return setError(t('Ajoute ton fichier ou un lien.', 'Ajoutez un fichier ou un lien.'));
        if (lien.trim() && !/^https?:\/\//i.test(lien.trim())) return setError(t('Le lien doit commencer par https://', 'Le lien doit commencer par https://'));
        try {
            const body = { lienRendu: lien.trim(), commentaireEleve: message.trim() };
            if (file) {
                setProgress(0);
                const { data } = await api.post(`/content/lessons/${lesson.id}/submission/upload-url`, { fileName: file.name, size: file.size });
                await putToSignedUrl(data.uploadUrl, file, setProgress);
                Object.assign(body, { storagePath: data.path, fileName: file.name, size: file.size, mimeType: file.type || guessMime(file.name) });
            }
            const { data } = await api.put(`/content/lessons/${lesson.id}/submission`, body);
            setSub(data); setFile(null); setEditing(false); setProgress(null);
            onSubmitted?.(data);
        } catch (e) { setProgress(null); setError(errMsg(e)); }
    };

    const download = async () => {
        try { await openSigned(`/content/submissions/${sub.id}/url`); } catch (e) { setError(errMsg(e)); }
    };

    return (
        <div style={{ background: '#FFF8F9', border: '1px solid #FECDD3', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 32, height: 32, background: '#BE123C', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📥</div>
                <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1040' }}>{t('Devoir à rendre', 'Travail à rendre')}</div>
                    {due && <div style={{ fontSize: 12, color: overdue ? '#B91C1C' : '#9CA3AF', fontWeight: overdue ? 700 : 500 }}>
                        {overdue ? 'Date limite dépassée : ' : 'À rendre avant le '}{fmtDate(due, false)}
                    </div>}
                </div>
                {sub && !corrected && <span style={pill('#FEF3C7', '#92400E')}>✓ Rendu</span>}
                {corrected && <span style={pill('#ECFDF5', '#047857')}>✓ Corrigé</span>}
            </div>

            {lesson.homeworkInstructions && (
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 14 }}>{lesson.homeworkInstructions}</div>
            )}

            {/* Correction du prof */}
            {corrected && (
                <div style={{ background: '#fff', border: '1px solid #A7F3D0', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    {sub.note != null && (
                        <div style={{ fontSize: 34, fontWeight: 900, color: sub.note >= 10 ? '#047857' : '#B91C1C', lineHeight: 1 }}>
                            {sub.note}<span style={{ fontSize: 15, color: '#9CA3AF' }}>/20</span>
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '.5px' }}>{t('Message de ton prof', 'Commentaire du formateur')}</div>
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sub.commentaire || '—'}</div>
                    </div>
                </div>
            )}

            {/* Déjà rendu */}
            {sub && !editing && (
                <div style={{ background: '#fff', border: '1px solid #F3E8EA', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>Rendu le {fmtDate(sub.submittedAt)}{isLate(sub, due) ? ' (en retard)' : ''}</div>
                        {sub.fileName && <button type="button" onClick={download} style={linkBtn}>📎 {sub.fileName} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({formatSize(sub.size)})</span></button>}
                        {sub.lienRendu && <a href={sub.lienRendu} target="_blank" rel="noreferrer" style={{ ...linkBtn, display: 'block', textDecoration: 'none', wordBreak: 'break-all' }}>🔗 {sub.lienRendu}</a>}
                    </div>
                    {!corrected && <button type="button" style={ghost} onClick={() => setEditing(true)}>{t('Changer mon fichier', 'Remplacer')}</button>}
                </div>
            )}

            {/* Formulaire de dépôt */}
            {editing && !corrected && (
                <div>
                    <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                         onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
                         onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
                         onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                         style={{ border: `2px dashed ${drag ? '#BE123C' : '#FDA4AF'}`, background: drag ? '#FFE4E6' : '#fff', borderRadius: 14, padding: '18px 14px', textAlign: 'center', cursor: 'pointer' }}>
                        {file ? (
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1040' }}>📎 {file.name} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({formatSize(file.size)})</span>
                                <div style={{ fontSize: 12, color: '#BE123C', fontWeight: 600, marginTop: 4 }}>{t('Clique pour choisir un autre fichier', 'Cliquer pour changer')}</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: 28 }}>⬆️</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040' }}>{t('Dépose ton fichier ici', 'Déposez votre fichier ici')}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{t('ou clique pour le choisir', 'ou cliquez pour le choisir')} · ZIP, Scratch, PDF, Word… · 50 Mo max</div>
                            </>
                        )}
                        <input ref={inputRef} type="file" hidden onChange={e => { pick(e.target.files[0]); e.target.value = ''; }} />
                    </div>
                    <input value={lien} onChange={e => setLien(e.target.value)} placeholder={t('…ou colle un lien (projet Scratch en ligne, Drive…)', '…ou collez un lien (Google Drive, site…)')} style={{ ...input, marginTop: 10 }} />
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder={t('Un message pour ton prof ? (facultatif)', 'Un message pour le formateur ? (facultatif)')} style={{ ...input, marginTop: 8, resize: 'vertical' }} />
                    {progress !== null && (
                        <div style={{ height: 6, background: '#FFE4E6', borderRadius: 50, marginTop: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#BE123C', transition: 'width .2s' }} />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button type="button" onClick={submit} disabled={progress !== null} style={primary}>
                            {progress !== null ? `Envoi… ${Math.round(progress * 100)}%` : t('🚀 Rendre mon devoir', 'Rendre le travail')}
                        </button>
                        {sub && <button type="button" style={ghost} onClick={() => { setEditing(false); setFile(null); setError(null); }}>Annuler</button>}
                    </div>
                </div>
            )}
            {error && <div style={{ marginTop: 10, padding: '9px 12px', background: '#FEF2F2', color: '#B91C1C', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{error}</div>}
        </div>
    );
}

const pill = (bg, color) => ({ fontSize: 12, fontWeight: 800, background: bg, color, padding: '4px 10px', borderRadius: 50 });
const linkBtn = { background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#BE123C', textAlign: 'left' };
const ghost = { padding: '9px 14px', background: '#fff', border: '1.5px solid #FECDD3', borderRadius: 10, color: '#BE123C', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const primary = { padding: '11px 20px', background: '#BE123C', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const input = { padding: '10px 12px', border: '1.5px solid #F3D6DB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff' };
