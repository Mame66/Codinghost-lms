import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/course.css';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { AudienceBadge } from '../utils/audience';
import {
    CIBLES, CibleBadge, placeholdersIn, insertAtCursor, VariableChips, PreviewModal, TemplateEditor, ui,
} from '../components/emails/emailUi';

const errMsg = (e, f = 'Erreur') => e?.response?.data?.message || e?.message || f;
const fmt = (d) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Emails() {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [tab, setTab] = useState('compose');
    const [config, setConfig] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [history, setHistory] = useState([]);
    const [toast, setToast] = useState(null);
    const [editing, setEditing] = useState(null);   // modèle en édition ({} = nouveau)
    const [detail, setDetail] = useState(null);     // envoi affiché

    // ── composition ──
    const [mode, setMode] = useState('groups');
    const [aud, setAud] = useState('ALL');
    const [groupIds, setGroupIds] = useState([]);
    const [studentId, setStudentId] = useState(null);
    const [search, setSearch] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [excluded, setExcluded] = useState(new Set());
    const [loadingRec, setLoadingRec] = useState(false);
    const [sujet, setSujet] = useState('');
    const [contenu, setContenu] = useState('');
    const [focus, setFocus] = useState('contenu');
    const [templateId, setTemplateId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const sujetRef = useRef(null), contenuRef = useRef(null);

    const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    // ── chargement ──
    useEffect(() => {
        (async () => {
            const [c, t, g, s, h] = await Promise.allSettled([
                api.get('/emails/config'), api.get('/emails/templates'), api.get('/groups'), api.get('/students'), api.get('/emails/history'),
            ]);
            if (c.status === 'fulfilled') setConfig(c.value.data);
            if (t.status === 'fulfilled') setTemplates(t.value.data);
            const mine = (list) => user?.role === 'ADMIN' ? list : list.filter(x => x.teacher?.id === user?.id || x.supervisor?.id === user?.id || x.teacherId === user?.id || x.supervisorId === user?.id);
            let gs = [];
            if (g.status === 'fulfilled') { gs = mine(g.value.data); setGroups(gs); }
            if (s.status === 'fulfilled') {
                const ids = new Set(gs.map(x => x.id));
                setStudents(user?.role === 'ADMIN' ? s.value.data : s.value.data.filter(st => st.enrollments?.some(e => ids.has(e.groupId ?? e.group?.id))));
            }
            if (h.status === 'fulfilled') setHistory(h.value.data);

            // liens directs : /emails?group=3 ou /emails?student=12
            const pg = parseInt(params.get('group')), ps = parseInt(params.get('student'));
            if (pg) { setMode('groups'); setGroupIds([pg]); }
            if (ps) { setMode('person'); setStudentId(ps); }
            if (pg || ps) setParams({}, { replace: true });
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── destinataires ──
    useEffect(() => {
        const body = mode === 'groups' ? { groupIds } : { studentIds: studentId ? [studentId] : [] };
        if ((mode === 'groups' && !groupIds.length) || (mode === 'person' && !studentId)) { setRecipients([]); return; }
        setLoadingRec(true);
        api.post('/emails/recipients', body)
            .then(r => { setRecipients(r.data); setExcluded(new Set()); })
            .catch(e => { setRecipients([]); notify(errMsg(e), 'error'); })
            .finally(() => setLoadingRec(false));
    }, [mode, groupIds, studentId]); // eslint-disable-line react-hooks/exhaustive-deps

    const selected = recipients.filter(r => !excluded.has(r.key));
    const sendable = selected.filter(r => r.email);
    const noEmail = selected.filter(r => !r.email);
    const types = new Set(recipients.map(r => r.type));
    const holes = placeholdersIn(sujet, contenu);

    const visibleGroups = groups.filter(g => aud === 'ALL' || g.audience === aud);
    const matches = useMemo(() => {
        const q = norm(search).trim();
        if (!q) return [];
        return students.filter(s => norm(`${s.user?.prenom} ${s.user?.nom} ${s.parentNom || ''} ${s.user?.login}`).includes(q)).slice(0, 8);
    }, [search, students]);
    const chosenStudent = students.find(s => s.id === studentId);

    const sortedTemplates = useMemo(() => {
        const rank = (t) => {
            if (t.cible === 'TOUS') return 1;
            if (types.size === 1 && ((types.has('PARENT') && t.cible === 'PARENTS') || (types.has('ADULTE') && t.cible === 'ADULTES'))) return 0;
            return types.size ? 2 : 1;
        };
        return [...templates].sort((a, b) => rank(a) - rank(b) || a.nom.localeCompare(b.nom, 'fr'));
    }, [templates, recipients]); // eslint-disable-line react-hooks/exhaustive-deps

    const applyTemplate = (t) => {
        if ((sujet || contenu) && !window.confirm('Remplacer le message en cours par ce modèle ?')) return;
        setSujet(t.sujet); setContenu(t.contenu); setTemplateId(String(t.id)); setResult(null); setTab('compose');
    };

    const sendTest = async () => {
        try {
            const r = sendable[0];
            const res = await api.post('/emails/test', { sujet, contenu, target: r ? { studentId: r.studentId, groupId: r.groupId } : undefined });
            notify(res.data.message);
        } catch (e) { notify(errMsg(e), 'error'); }
    };

    const send = async () => {
        setSending(true);
        try {
            const body = { sujet, contenu, exclude: [...excluded], ...(mode === 'groups' ? { groupIds } : { studentIds: [studentId] }) };
            const res = await api.post('/emails/send', body);
            setResult(res.data); setConfirming(false);
            setHistory(h => [res.data, ...h]);
            notify(`${res.data.envoyes} email${res.data.envoyes > 1 ? 's' : ''} envoyé${res.data.envoyes > 1 ? 's' : ''}`);
        } catch (e) { setConfirming(false); notify(errMsg(e), 'error'); }
        setSending(false);
    };

    const resetMessage = () => { setSujet(''); setContenu(''); setTemplateId(''); setResult(null); };

    const removeTemplate = async (t) => {
        if (!window.confirm(`Supprimer le modèle « ${t.nom} » ?`)) return;
        try { await api.delete(`/emails/templates/${t.id}`); setTemplates(l => l.filter(x => x.id !== t.id)); notify('Modèle supprimé'); }
        catch (e) { notify(errMsg(e), 'error'); }
    };

    const openDetail = async (m) => {
        try { const r = await api.get(`/emails/history/${m.id}`); setDetail(r.data); }
        catch (e) { notify(errMsg(e), 'error'); }
    };

    const canEditTpl = (t) => user?.role === 'ADMIN' || t.createdBy === user?.id;

    return (
        <div>
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 20px', borderRadius: 12, background: '#1A1040', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: toast.type === 'error' ? '#F87171' : '#34D399', flexShrink: 0 }} />{toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1040', margin: 0 }}>Emails</h1>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Aux parents des enfants et aux élèves adultes{user?.role !== 'ADMIN' ? ' de vos groupes' : ''}</div>
                </div>
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 11, padding: 3 }}>
                    {[['compose', '✉️ Nouveau message'], ['templates', `📄 Modèles (${templates.length})`], ['history', `🕘 Envoyés (${history.length})`]].map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 13px', border: 'none', borderRadius: 9, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: tab === k ? '#fff' : 'transparent', color: tab === k ? '#1A1040' : '#6B7280', boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>
                    ))}
                </div>
            </div>

            {config && !config.configured && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 16, lineHeight: 1.6 }}>
                    ⚠️ L'envoi d'emails n'est pas configuré sur le serveur. Vous pouvez préparer vos modèles et messages ; l'envoi sera possible une fois la clé du service d'envoi (Brevo) ajoutée sur Railway.
                </div>
            )}

            {/* ═════════════ NOUVEAU MESSAGE ═════════════ */}
            {tab === 'compose' && (
                <div className="ch-stack-sm" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 16, alignItems: 'start' }}>
                    {/* Destinataires */}
                    <div style={card}>
                        <div style={cardTitle}><span style={stepNum}>1</span> Destinataires</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                            {[['groups', '👥 Un ou plusieurs groupes'], ['person', '👤 Une personne']].map(([k, l]) => (
                                <button key={k} type="button" onClick={() => { setMode(k); setResult(null); }} style={{ ...seg, borderColor: mode === k ? '#6C47FF' : '#E5E7EB', background: mode === k ? '#F5F2FF' : '#fff', color: mode === k ? '#6C47FF' : '#6B7280' }}>{l}</button>
                            ))}
                        </div>

                        {mode === 'groups' ? (
                            <>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                    {[['ALL', 'Tous'], ['ENFANT', 'Enfants'], ['ADULTE', 'Adultes']].map(([k, l]) => (
                                        <button key={k} type="button" onClick={() => setAud(k)} style={{ ...pill, background: aud === k ? '#1A1040' : '#F3F4F6', color: aud === k ? '#fff' : '#4B5563' }}>{l}</button>
                                    ))}
                                    {groupIds.length > 0 && <button type="button" style={{ ...pill, marginLeft: 'auto', background: 'transparent', color: '#6C47FF' }} onClick={() => setGroupIds([])}>Tout décocher</button>}
                                </div>
                                <div style={{ maxHeight: 230, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid #F1F0F7', borderRadius: 12, padding: 6 }}>
                                    {visibleGroups.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', padding: 10 }}>Aucun groupe</div>}
                                    {visibleGroups.map(g => {
                                        const on = groupIds.includes(g.id);
                                        return (
                                            <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', background: on ? '#F5F2FF' : '#fff', border: `1.5px solid ${on ? '#C4B5FD' : 'transparent'}` }}>
                                                <input type="checkbox" checked={on} onChange={() => { setResult(null); setGroupIds(ids => on ? ids.filter(i => i !== g.id) : [...ids, g.id]); }} />
                                                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#1A1040' }}>{g.titre}</span>
                                                <AudienceBadge audience={g.audience} size="sm" />
                                                <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{g._count?.enrollments ?? 0} él.</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                {chosenStudent ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#F5F2FF', border: '1.5px solid #C4B5FD' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040' }}>{chosenStudent.user?.prenom} {chosenStudent.user?.nom}</div>
                                            <div style={{ fontSize: 12, color: '#6B7280' }}>{chosenStudent.enrollments?.map(e => e.group?.titre).join(', ') || 'Sans groupe'}</div>
                                        </div>
                                        <button type="button" style={{ ...pill, background: '#fff', color: '#6C47FF' }} onClick={() => { setStudentId(null); setSearch(''); setResult(null); }}>Changer</button>
                                    </div>
                                ) : (
                                    <>
                                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom de l'élève ou du parent…" style={ui.input} />
                                        {matches.length > 0 && (
                                            <div style={{ position: 'absolute', left: 0, right: 0, top: 46, zIndex: 20, background: '#fff', border: '1px solid #EDE8FF', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.12)', padding: 4 }}>
                                                {matches.map(s => (
                                                    <button key={s.id} type="button" onClick={() => { setStudentId(s.id); setSearch(''); setResult(null); }}
                                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#F5F2FF'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1040' }}>{s.user?.prenom} {s.user?.nom}</div>
                                                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{[s.parentNom && `Parent : ${s.parentNom}`, s.enrollments?.map(e => e.group?.titre).join(', ')].filter(Boolean).join(' · ') || 'Sans groupe'}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {search && !matches.length && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Aucun élève trouvé</div>}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Liste des destinataires */}
                        {(recipients.length > 0 || loadingRec) && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1A1040' }}>{loadingRec ? 'Chargement…' : `${sendable.length} destinataire${sendable.length > 1 ? 's' : ''}`}</span>
                                    {noEmail.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', background: '#FFFBEB', padding: '2px 8px', borderRadius: 50 }}>{noEmail.length} sans email</span>}
                                </div>
                                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {recipients.map(r => {
                                        const off = excluded.has(r.key);
                                        return (
                                            <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 8, cursor: r.email ? 'pointer' : 'default', opacity: off ? 0.45 : 1, background: r.email ? 'transparent' : '#FFFBEB' }}>
                                                <input type="checkbox" disabled={!r.email} checked={!!r.email && !off} onChange={() => setExcluded(s => { setResult(null); const n = new Set(s); n.has(r.key) ? n.delete(r.key) : n.add(r.key); return n; })} />
                                                <span style={{ flex: 1, minWidth: 0 }}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1040' }}>
                                                        {r.nom} <span style={{ fontWeight: 500, color: r.type === 'PARENT' ? '#EA580C' : '#1D4ED8', fontSize: 11 }}>{r.type === 'PARENT' ? `parent de ${r.eleve.split(' ')[0]}` : 'élève adulte'}</span>
                                                    </span>
                                                    <span style={{ fontSize: 11.5, color: r.email ? '#6B7280' : '#B45309', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                        {r.email || '⚠ Pas d\'adresse email : ajoutez-la dans la fiche de l\'élève'}{mode === 'groups' && groupIds.length > 1 && r.groupe ? ` · ${r.groupe}` : ''}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div style={card}>
                        <div style={{ ...cardTitle, flexWrap: 'wrap' }}>
                            <span style={stepNum}>2</span> Message
                            <select value={templateId} onChange={e => { const t = templates.find(x => String(x.id) === e.target.value); if (t) applyTemplate(t); }}
                                    style={{ ...ui.input, width: 'auto', marginLeft: 'auto', padding: '6px 10px', fontSize: 13, maxWidth: '100%' }}>
                                <option value="">📄 Partir d'un modèle…</option>
                                {Object.entries(CIBLES).map(([k, c]) => {
                                    const list = sortedTemplates.filter(t => t.cible === k);
                                    return list.length ? <optgroup key={k} label={c.label}>{list.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}</optgroup> : null;
                                })}
                            </select>
                        </div>

                        <input ref={sujetRef} onFocus={() => setFocus('sujet')} value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Objet de l'email" style={{ ...ui.input, fontWeight: 700, marginBottom: 8 }} />
                        <textarea ref={contenuRef} onFocus={() => setFocus('contenu')} value={contenu} onChange={e => setContenu(e.target.value)} rows={13}
                                  placeholder={'Bonjour {{destinataire}},\n\nVotre message…'} style={{ ...ui.input, resize: 'vertical', lineHeight: 1.6 }} />
                        <div style={{ marginTop: 8 }}>
                            <VariableChips variables={config?.variables || []} onInsert={(t) => focus === 'sujet' ? insertAtCursor(sujetRef.current, sujet, t, setSujet) : insertAtCursor(contenuRef.current, contenu, t, setContenu)} />
                            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>Les variables sont remplacées pour chaque destinataire. **texte** = gras · « - » en début de ligne = liste.</div>
                        </div>

                        {holes.length > 0 && (
                            <div style={{ marginTop: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: '#92400E' }}>
                                ✏️ À compléter avant l'envoi : {holes.map(h => <code key={h} style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>{h}</code>)}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button type="button" style={ui.ghost} disabled={!sujet || !contenu} onClick={() => setShowPreview(true)}>👁 Aperçu</button>
                            <button type="button" style={ui.ghost} disabled={!sujet || !contenu || !config?.configured} onClick={sendTest} title="Recevoir cet email sur votre adresse pour vérifier">M'envoyer un essai</button>
                            <button type="button" style={{ ...ui.ghost, border: 'none' }} disabled={!sujet || !contenu} onClick={() => setEditing({ sujet, contenu, cible: types.size === 1 ? (types.has('ADULTE') ? 'ADULTES' : 'PARENTS') : 'TOUS' })}>Enregistrer comme modèle</button>
                            {(() => {
                                // après un envoi, le bouton reste bloqué jusqu'à « Nouveau message » (évite un double envoi)
                                const off = !!result || !sendable.length || !sujet.trim() || !contenu.trim() || !config?.configured;
                                return (
                                    <button type="button" disabled={off} onClick={() => setConfirming(true)}
                                            style={{ ...ui.primary, marginLeft: 'auto', padding: '11px 18px', fontSize: 14, opacity: off ? 0.5 : 1, cursor: off ? 'not-allowed' : 'pointer' }}>
                                        {result ? '✓ Envoyé' : `Envoyer${sendable.length ? ` à ${sendable.length} personne${sendable.length > 1 ? 's' : ''}` : ''}`}
                                    </button>
                                );
                            })()}
                        </div>

                        {result && (
                            <div style={{ marginTop: 14, borderRadius: 12, padding: '12px 14px', background: result.echecs ? '#FFFBEB' : '#ECFDF5', border: `1px solid ${result.echecs ? '#FDE68A' : '#A7F3D0'}` }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: result.echecs ? '#92400E' : '#047857' }}>
                                    ✓ {result.envoyes} envoyé{result.envoyes > 1 ? 's' : ''}{result.echecs ? ` · ${result.echecs} non envoyé${result.echecs > 1 ? 's' : ''}` : ''}
                                </div>
                                {result.failures?.map((f, i) => <div key={i} style={{ fontSize: 12, color: '#92400E', marginTop: 3 }}>• {f.nom}{f.eleve ? ` (${f.eleve})` : ''} : {f.error}</div>)}
                                <button type="button" style={{ ...ui.ghost, marginTop: 10, padding: '6px 12px' }} onClick={resetMessage}>Nouveau message</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═════════════ MODÈLES ═════════════ */}
            {tab === 'templates' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, color: '#6B7280', flex: 1, minWidth: 220 }}>Des messages prêts à l'emploi. Les mots entre {'{{ }}'} sont remplis automatiquement, les passages [entre crochets] sont à compléter à chaque envoi.</div>
                        <button type="button" style={ui.primary} onClick={() => setEditing({})}>+ Nouveau modèle</button>
                    </div>
                    {Object.entries(CIBLES).map(([k, c]) => {
                        const list = templates.filter(t => t.cible === k);
                        if (!list.length) return null;
                        return (
                            <div key={k} style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: c.color, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>{c.label}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                                    {list.map(t => (
                                        <div key={t.id} style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040', flex: 1 }}>{t.nom}</div>
                                                <CibleBadge cible={t.cible} />
                                            </div>
                                            <div style={{ fontSize: 12.5, color: '#4B5563', fontWeight: 600 }}>{t.sujet}</div>
                                            <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line' }}>{t.contenu}</div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                                                <button type="button" style={{ ...ui.primary, padding: '7px 12px', fontSize: 12.5 }} onClick={() => applyTemplate(t)}>Utiliser</button>
                                                {canEditTpl(t) && <button type="button" style={{ ...ui.ghost, padding: '7px 12px', fontSize: 12.5 }} onClick={() => setEditing(t)}>Modifier</button>}
                                                <button type="button" style={{ ...ui.ghost, padding: '7px 12px', fontSize: 12.5, border: 'none' }} onClick={() => setEditing({ ...t, id: undefined, nom: `${t.nom} (copie)` })}>Dupliquer</button>
                                                {canEditTpl(t) && <button type="button" title="Supprimer" style={{ ...ui.ghost, padding: '7px 10px', fontSize: 12.5, marginLeft: 'auto', color: '#DC2626', borderColor: '#FECACA' }} onClick={() => removeTemplate(t)}>🗑</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {templates.length === 0 && <div style={{ ...card, textAlign: 'center', color: '#9CA3AF' }}>Aucun modèle pour l'instant.</div>}
                </div>
            )}

            {/* ═════════════ ENVOYÉS ═════════════ */}
            {tab === 'history' && (
                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    {history.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Aucun email envoyé pour l'instant.</div>
                    ) : history.map(m => (
                        <button key={m.id} type="button" onClick={() => openDetail(m)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid #F5F4FA', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1040' }}>{m.sujet}</div>
                                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.cible} · {fmt(m.createdAt)}{m.sentByNom ? ` · par ${m.sentByNom}` : ''}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#047857', background: '#ECFDF5', padding: '3px 10px', borderRadius: 50 }}>✓ {m.envoyes}/{m.total}</span>
                            {m.echecs > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309', background: '#FFFBEB', padding: '3px 10px', borderRadius: 50 }}>{m.echecs} non envoyé{m.echecs > 1 ? 's' : ''}</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* ═════════════ FENÊTRES ═════════════ */}
            {showPreview && <PreviewModal sujet={sujet} contenu={contenu} recipients={selected} onClose={() => setShowPreview(false)} />}

            {editing && (
                <TemplateEditor template={editing.id ? editing : { ...editing, id: undefined }} variables={config?.variables || []} notify={notify}
                                onClose={() => setEditing(null)}
                                onSaved={(t) => { setTemplates(l => [...l.filter(x => x.id !== t.id), t]); setEditing(null); }} />
            )}

            {confirming && (
                <div style={ui.overlay} onClick={() => !sending && setConfirming(false)}>
                    <div style={{ ...ui.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                        <h2 style={ui.h2}>Envoyer ce message ?</h2>
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                            <strong>« {sujet} »</strong> sera envoyé à <strong>{sendable.length} personne{sendable.length > 1 ? 's' : ''}</strong>
                            {types.has('PARENT') && types.has('ADULTE') ? ' (parents et élèves adultes)' : types.has('PARENT') ? ' (parents)' : ' (élèves adultes)'}.
                        </div>
                        {noEmail.length > 0 && <div style={{ ...ui.hint, marginTop: 10, background: '#FFFBEB', color: '#92400E' }}>{noEmail.length} personne{noEmail.length > 1 ? 's' : ''} sans adresse email ne recevr{noEmail.length > 1 ? 'ont' : 'a'} rien.</div>}
                        {holes.length > 0 && <div style={{ ...ui.hint, marginTop: 10, background: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}>Attention : il reste des passages à compléter ({holes.join(', ')}).</div>}
                        <div style={ui.foot}>
                            <button type="button" style={{ ...ui.ghost, marginLeft: 'auto' }} onClick={() => setConfirming(false)} disabled={sending}>Annuler</button>
                            <button type="button" style={ui.primary} onClick={send} disabled={sending}>{sending ? 'Envoi en cours…' : 'Envoyer'}</button>
                        </div>
                    </div>
                </div>
            )}

            {detail && (
                <div style={ui.overlay} onClick={() => setDetail(null)}>
                    <div style={{ ...ui.modal, maxWidth: 620 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{fmt(detail.createdAt)}{detail.sentByNom ? ` · par ${detail.sentByNom}` : ''}</div>
                        <h2 style={{ ...ui.h2, margin: '2px 0 4px' }}>{detail.sujet}</h2>
                        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{detail.cible} · {detail.envoyes} envoyé{detail.envoyes > 1 ? 's' : ''} sur {detail.total}</div>
                        <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #F1F0F7', borderRadius: 12 }}>
                            {detail.recipients.map(r => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #F7F7FB' }}>
                                    <span style={{ fontSize: 14 }}>{r.success ? '✅' : '⚠️'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1040' }}>{r.nom}{r.type === 'PARENT' && r.eleve ? <span style={{ fontWeight: 500, color: '#9CA3AF' }}> · parent de {r.eleve}</span> : null}</div>
                                        <div style={{ fontSize: 12, color: r.success ? '#6B7280' : '#B45309' }}>{r.email || '—'}{r.error ? ` · ${r.error}` : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <details style={{ marginTop: 12 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6C47FF' }}>Voir le message</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, color: '#374151', background: '#F9FAFB', padding: 12, borderRadius: 10, marginTop: 8 }}>{detail.contenu}</pre>
                        </details>
                        <div style={ui.foot}>
                            <button type="button" style={ui.ghost} onClick={() => { setSujet(detail.sujet); setContenu(detail.contenu); setTemplateId(''); setResult(null); setDetail(null); setTab('compose'); }}>Réutiliser ce message</button>
                            <button type="button" style={{ ...ui.primary, marginLeft: 'auto' }} onClick={() => setDetail(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const card = { background: '#fff', border: '1px solid #EBEBF5', borderRadius: 16, padding: 18, boxSizing: 'border-box', minWidth: 0 };
const cardTitle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#1A1040', marginBottom: 12 };
const stepNum = { width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg,#6C47FF,#9B7FFF)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const seg = { flex: 1, padding: '9px 10px', borderRadius: 10, border: '2px solid', fontFamily: 'inherit', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' };
const pill = { padding: '5px 11px', borderRadius: 50, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
