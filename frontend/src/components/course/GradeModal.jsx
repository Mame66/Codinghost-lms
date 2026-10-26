import { useState } from 'react';
import api from '../../api/axios';
import { formatSize, errMsg, openSigned } from '../../utils/files';

export const fmtDate = (d, withTime = true) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }),
}) : '';

// Rendu après la date limite ? (la date limite vaut jusqu'à la fin de la journée)
export const isLate = (submission, dueDate) => {
    if (!submission || !dueDate) return false;
    const end = new Date(dueDate); end.setHours(23, 59, 59, 999);
    return new Date(submission.submittedAt) > end;
};

export const StatusPill = ({ submission, dueDate }) => {
    if (!submission) return <span style={{ ...pill, background: '#F3F4F6', color: '#6B7280' }}>Pas rendu</span>;
    if (submission.statut === 'CORRIGE') {
        return <span style={{ ...pill, background: '#ECFDF5', color: '#047857' }}>✓ {submission.note != null ? `${submission.note}/20` : 'Corrigé'}</span>;
    }
    return <span style={{ ...pill, background: '#FEF3C7', color: '#92400E' }}>À corriger{isLate(submission, dueDate) ? ' · en retard' : ''}</span>;
};
const pill = { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' };

// Fenêtre de correction d'un devoir rendu
export default function GradeModal({ submission, studentName, lessonTitle, dueDate, onClose, onSaved, notify }) {
    const [note, setNote] = useState(submission.note ?? '');
    const [commentaire, setCommentaire] = useState(submission.commentaire || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/content/submissions/${submission.id}/grade`, { note: note === '' ? null : note, commentaire });
            notify?.('Devoir corrigé — l\'élève est prévenu');
            onSaved?.(data);
        } catch (e) { notify?.(errMsg(e), 'error'); }
        setSaving(false);
    };

    const reopen = async () => {
        if (!window.confirm('Supprimer ce rendu ? L\'élève pourra rendre un nouveau fichier.')) return;
        try {
            await api.delete(`/content/submissions/${submission.id}`);
            notify?.('Rendu supprimé : l\'élève peut rendre à nouveau');
            onSaved?.(null);
        } catch (e) { notify?.(errMsg(e), 'error'); }
    };

    const download = async () => {
        try { await openSigned(`/content/submissions/${submission.id}/url`); }
        catch (e) { notify?.(errMsg(e), 'error'); }
    };

    return (
        <div style={st.overlay} onClick={onClose}>
            <div style={st.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px' }}>{lessonTitle}</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1040', margin: '2px 0 4px' }}>{studentName}</h2>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
                    Rendu le {fmtDate(submission.submittedAt)}
                    {isLate(submission, dueDate) && <span style={{ color: '#B45309', fontWeight: 700 }}> · après la date limite ({fmtDate(dueDate, false)})</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {submission.storagePath && (
                        <button type="button" onClick={download} style={st.fileBtn}>
                            <span style={{ fontSize: 22 }}>🗜️</span>
                            <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                <span style={{ display: 'block', fontWeight: 700, color: '#1A1040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{submission.fileName}</span>
                                <span style={{ fontSize: 11, color: '#6B7280' }}>{formatSize(submission.size)}</span>
                            </span>
                            <span style={{ fontWeight: 800, color: '#6C47FF', fontSize: 13 }}>⬇ Télécharger</span>
                        </button>
                    )}
                    {submission.lienRendu && (
                        <a href={submission.lienRendu} target="_blank" rel="noreferrer" style={{ ...st.fileBtn, textDecoration: 'none' }}>
                            <span style={{ fontSize: 22 }}>🔗</span>
                            <span style={{ flex: 1, fontSize: 13, color: '#0369A1', wordBreak: 'break-all' }}>{submission.lienRendu}</span>
                        </a>
                    )}
                    {submission.commentaireEleve && (
                        <div style={{ padding: '10px 12px', background: '#F8F7FF', borderRadius: 10, fontSize: 13, color: '#374151', borderLeft: '3px solid #A78BFA' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', marginBottom: 2 }}>Message de l'élève</div>
                            {submission.commentaireEleve}
                        </div>
                    )}
                </div>

                <label style={st.lbl}>Note sur 20 <span style={{ fontWeight: 500, textTransform: 'none' }}>(facultatif)</span></label>
                <input type="number" min="0" max="20" step="0.5" value={note} onChange={e => setNote(e.target.value)} style={{ ...st.input, maxWidth: 120, fontSize: 18, fontWeight: 800 }} placeholder="—" />
                <label style={{ ...st.lbl, marginTop: 14 }}>Commentaire pour l'élève</label>
                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={4} style={{ ...st.input, resize: 'vertical' }} placeholder="Bravo pour… La prochaine fois, pense à…" />

                <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                    <button type="button" onClick={reopen} style={{ ...st.ghost, color: '#B91C1C', borderColor: '#FECACA' }}>Autoriser un nouveau rendu</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button type="button" onClick={onClose} style={st.ghost}>Annuler</button>
                        <button type="button" onClick={save} disabled={saving || (note === '' && !commentaire.trim())} style={st.primary}>{saving ? 'Enregistrement…' : 'Enregistrer la correction'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const st = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,5,40,0.5)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', boxSizing: 'border-box' },
    fileBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#FAFAFF', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    lbl: { display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 },
    input: { padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
    ghost: { padding: '9px 14px', background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 10, color: '#6C47FF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primary: { padding: '9px 16px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
