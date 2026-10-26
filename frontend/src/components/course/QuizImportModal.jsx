import { useRef, useState } from 'react';
import api from '../../api/axios';
import { parseQuizFile, downloadQuizTemplate } from '../../utils/quiz';
import { errMsg } from '../../utils/files';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizImportModal({ lessonId, existingCount = 0, onClose, onImported, notify }) {
    const [parsed, setParsed] = useState(null);
    const [fileName, setFileName] = useState('');
    const [replace, setReplace] = useState(existingCount > 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const onFile = async (file) => {
        if (!file) return;
        setError(null); setFileName(file.name);
        try {
            const res = await parseQuizFile(file);
            setParsed(res);
            if (!res.questions.length) setError('Aucune question valide trouvée. Vérifiez les colonnes (modèle ci-dessous).');
        } catch (e) { setParsed(null); setError('Fichier illisible : utilisez un .xlsx ou un .csv'); }
    };

    const submit = async () => {
        setSaving(true);
        try {
            const { data } = await api.post(`/lessons/lessons/${lessonId}/quiz/bulk`, { questions: parsed.questions, replace });
            notify?.(`${data.imported} question${data.imported > 1 ? 's' : ''} importée${data.imported > 1 ? 's' : ''}`);
            onImported?.(data.questions);
        } catch (e) { setError(errMsg(e)); }
        setSaving(false);
    };

    return (
        <div style={st.overlay} onClick={onClose}>
            <div style={st.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1040', margin: '0 0 6px' }}>Importer un quiz</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Un fichier Excel (.xlsx) ou CSV avec une ligne par question :
                    <strong> Question | A | B | C | D | Bonne réponse</strong>. La bonne réponse peut être une lettre (B), un numéro (2) ou le texte exact. C et D sont facultatives.
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <button type="button" style={st.primaryOutline} onClick={() => inputRef.current?.click()}>📄 Choisir le fichier</button>
                    <button type="button" style={st.ghost} onClick={downloadQuizTemplate}>⬇ Télécharger le modèle</button>
                    <input ref={inputRef} type="file" accept=".xlsx,.csv" hidden onChange={e => { onFile(e.target.files[0]); e.target.value = ''; }} />
                </div>
                {fileName && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Fichier : <strong>{fileName}</strong></div>}
                {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', color: '#B91C1C', borderRadius: 10, fontSize: 13, marginBottom: 10 }}>{error}</div>}

                {parsed?.questions?.length > 0 && (
                    <>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#047857', margin: '6px 0 8px' }}>
                            ✓ {parsed.questions.length} question{parsed.questions.length > 1 ? 's' : ''} prête{parsed.questions.length > 1 ? 's' : ''}
                        </div>
                        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #F3F4F6', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {parsed.questions.map((q, i) => (
                                <div key={i} style={{ padding: '8px 10px', background: '#FFFDF0', borderRadius: 8, border: '1px solid #FDE68A' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{i + 1}. {q.question}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {q.options.map((o, oi) => (
                                            <span key={oi} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: oi === q.correct ? '#D1FAE5' : '#F3F4F6', color: oi === q.correct ? '#065F46' : '#4B5563', fontWeight: oi === q.correct ? 800 : 500 }}>
                                                {LETTERS[oi]}. {o}{oi === q.correct ? ' ✓' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {parsed?.errors?.length > 0 && (
                    <details style={{ marginTop: 10, fontSize: 12, color: '#92400E' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{parsed.errors.length} ligne{parsed.errors.length > 1 ? 's' : ''} ignorée{parsed.errors.length > 1 ? 's' : ''}</summary>
                        <ul style={{ margin: '6px 0 0 18px', lineHeight: 1.6 }}>{parsed.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </details>
                )}

                {existingCount > 0 && parsed?.questions?.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                        <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />
                        Remplacer les {existingCount} question{existingCount > 1 ? 's' : ''} existante{existingCount > 1 ? 's' : ''} (sinon, elles sont ajoutées à la suite)
                    </label>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
                    <button type="button" style={st.ghost} onClick={onClose}>Annuler</button>
                    <button type="button" style={st.primary} disabled={!parsed?.questions?.length || saving} onClick={submit}>
                        {saving ? 'Import…' : `Importer${parsed?.questions?.length ? ` ${parsed.questions.length} question${parsed.questions.length > 1 ? 's' : ''}` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

const st = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,5,40,0.5)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', boxSizing: 'border-box' },
    ghost: { padding: '9px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primaryOutline: { padding: '9px 14px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, color: '#B45309', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primary: { padding: '9px 16px', background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
