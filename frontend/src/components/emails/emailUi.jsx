import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

export const CIBLES = {
    PARENTS: { label: 'Parents',          short: 'Parents', color: '#EA580C', bg: '#FFF7ED' },
    ADULTES: { label: 'Élèves adultes',   short: 'Adultes', color: '#1D4ED8', bg: '#EFF6FF' },
    TOUS:    { label: 'Parents et adultes', short: 'Tous',  color: '#6C47FF', bg: '#F5F2FF' },
};

export const CibleBadge = ({ cible }) => {
    const c = CIBLES[cible] || CIBLES.TOUS;
    return <span style={{ fontSize: 11, fontWeight: 800, color: c.color, background: c.bg, padding: '3px 9px', borderRadius: 50, whiteSpace: 'nowrap' }}>{c.short}</span>;
};

// Passages entre crochets à compléter avant l'envoi : [date à compléter]
export const placeholdersIn = (...texts) => {
    const out = new Set();
    texts.forEach(t => (String(t || '').match(/\[[^\]\n]{2,80}\]/g) || []).forEach(m => out.add(m)));
    return [...out];
};

// Insère du texte à la position du curseur
export const insertAtCursor = (el, value, text, setValue) => {
    if (!el) return setValue(value + text);
    const start = el.selectionStart ?? value.length, end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); });
};

// Boutons de variables
export const VariableChips = ({ variables = [], onInsert }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {variables.map(v => (
            <button key={v.key} type="button" title={v.aide || `Exemple : ${v.exemple}`} onClick={() => onInsert(`{{${v.key}}}`)}
                    style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #DDD5FF', background: '#FAF9FF', color: '#5B3FD6', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + {v.label}
            </button>
        ))}
    </div>
);

// Aperçu de l'email tel qu'il sera reçu
export const PreviewModal = ({ sujet, contenu, recipients = [], onClose }) => {
    const withEmail = recipients.filter(r => r.email);
    const [key, setKey] = useState(withEmail[0]?.key || '');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const r = withEmail.find(x => x.key === key);
        setData(null); setError(null);
        api.post('/emails/preview', { sujet, contenu, target: r ? { studentId: r.studentId, groupId: r.groupId } : undefined })
            .then(res => setData(res.data))
            .catch(e => setError(e.response?.data?.message || 'Aperçu impossible'));
    }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={ui.overlay} onClick={onClose}>
            <div style={{ ...ui.modal, maxWidth: 720, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F0F7', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', width: 34 }}>À</span>
                        {withEmail.length > 0 ? (
                            <select value={key} onChange={e => setKey(e.target.value)} style={{ ...ui.input, width: 'auto', flex: 1, minWidth: 200, padding: '6px 10px' }}>
                                {withEmail.map(r => <option key={r.key} value={r.key}>{r.nom} — {r.email}{r.type === 'PARENT' ? ` (${r.eleve})` : ''}</option>)}
                            </select>
                        ) : <span style={{ fontSize: 13, color: '#6B7280' }}>Exemple (aucun destinataire choisi)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', width: 34 }}>Objet</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1040' }}>{data?.subject || '…'}</span>
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, background: '#F3F4F6' }}>
                    {error ? <div style={{ padding: 30, color: '#B91C1C', fontWeight: 700 }}>{error}</div>
                        : <iframe title="Aperçu de l'email" sandbox="" srcDoc={data?.html || ''} style={{ width: '100%', height: '62vh', border: 'none', display: 'block' }} />}
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F0F7' }}>
                    <button type="button" style={ui.ghost} onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
};

// Création / modification d'un modèle
export const TemplateEditor = ({ template, variables, onClose, onSaved, notify }) => {
    const [form, setForm] = useState({
        nom: template?.nom || '', cible: template?.cible || 'PARENTS',
        sujet: template?.sujet || '', contenu: template?.contenu || 'Bonjour {{destinataire}},\n\n\n\nBien cordialement,\nL\'équipe {{ecole}}',
    });
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);
    const [focus, setFocus] = useState('contenu');
    const refs = useRef({ sujet: null, contenu: null }).current;
    const editing = !!template?.id;

    const save = async () => {
        setSaving(true);
        try {
            const res = editing ? await api.put(`/emails/templates/${template.id}`, form) : await api.post('/emails/templates', form);
            notify?.(editing ? 'Modèle enregistré' : 'Modèle créé');
            onSaved?.(res.data);
        } catch (e) { notify?.(e.response?.data?.message || 'Erreur', 'error'); }
        setSaving(false);
    };

    return (
        <div style={ui.overlay} onClick={onClose}>
            <div style={{ ...ui.modal, maxWidth: 680 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <h2 style={ui.h2}>{editing ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={ui.lbl}>Nom du modèle
                        <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex. Rappel de cours" style={ui.input} />
                    </label>
                    <div>
                        <div style={{ ...ui.lbl, marginBottom: 6 }}>Pour qui ?</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {Object.entries(CIBLES).map(([k, c]) => (
                                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, cible: k }))}
                                        style={{ padding: '7px 12px', borderRadius: 9, fontFamily: 'inherit', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                                                 border: `2px solid ${form.cible === k ? c.color : '#E5E7EB'}`, background: form.cible === k ? c.bg : '#fff', color: form.cible === k ? c.color : '#6B7280' }}>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <label style={ui.lbl}>Objet de l'email
                        <input ref={el => { refs.sujet = el; }} onFocus={() => setFocus('sujet')} value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} style={ui.input} />
                    </label>
                    <label style={ui.lbl}>Message
                        <textarea ref={el => { refs.contenu = el; }} onFocus={() => setFocus('contenu')} value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} rows={11} style={{ ...ui.input, resize: 'vertical', lineHeight: 1.6 }} />
                    </label>
                    <div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Insérer (à l'endroit du curseur) :</div>
                        <VariableChips variables={variables} onInsert={(t) => insertAtCursor(refs[focus], form[focus], t, (v) => setForm(f => ({ ...f, [focus]: v })))} />
                    </div>
                    <div style={ui.hint}>Astuce : **texte** en gras, une ligne commençant par « - » pour une liste, et [crochets] pour ce qu'il faudra compléter à chaque envoi.</div>
                </div>
                <div style={ui.foot}>
                    <button type="button" style={ui.ghost} onClick={() => setPreview(true)} disabled={!form.sujet || !form.contenu}>Aperçu</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button type="button" style={ui.ghost} onClick={onClose}>Annuler</button>
                        <button type="button" style={ui.primary} onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le modèle'}</button>
                    </div>
                </div>
                {preview && <PreviewModal sujet={form.sujet} contenu={form.contenu} onClose={() => setPreview(false)} />}
            </div>
        </div>
    );
};

export const ui = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,5,40,0.5)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 540, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', boxSizing: 'border-box' },
    h2: { fontSize: 20, fontWeight: 800, color: '#1A1040', margin: '0 0 16px' },
    lbl: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px' },
    input: { padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff', color: '#111827', textTransform: 'none', letterSpacing: 0, fontWeight: 500 },
    hint: { fontSize: 12, color: '#6B7280', background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', lineHeight: 1.5 },
    foot: { display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' },
    ghost: { padding: '9px 14px', background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 10, color: '#6C47FF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
    primary: { padding: '9px 16px', background: 'linear-gradient(135deg,#6C47FF,#5035CC)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
