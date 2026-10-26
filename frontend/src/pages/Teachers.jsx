import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Ic } from '../components/Icons';
import Avatar, { AvatarUpload } from '../components/Avatar';
import { AudienceBadge } from '../utils/audience';

const EMPTY = { prenom: '', nom: '', email: '', telephone: '', specialites: '', sendEmail: true };

// Champ — hors composant (évite la perte de focus)
const Field = ({ label, value, onChange, type = 'text', placeholder, full }) => (
    <div style={{ ...s.fg, ...(full ? { gridColumn: '1/-1' } : {}) }}>
        <label style={s.fl}>{label}</label>
        <input style={s.fi} type={type} placeholder={placeholder} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
);

const splitTags = (txt) => String(txt || '').split(/[,;/]/).map(t => t.trim()).filter(Boolean);

// ════════════════════════════════════════════════════════════
// Enseignants (administrateur)
// ════════════════════════════════════════════════════════════
export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [credentials, setCredentials] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchTeachers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    const fetchTeachers = async () => {
        try {
            const r = await api.get('/teachers');
            setTeachers(r.data);
        } catch {
            notify('Impossible de charger les enseignants', 'error');
        }
        setLoading(false);
    };

    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

    const openAdd = () => { setForm(EMPTY); setEditing(null); setFormError(''); setShowAdd(true); };
    const openEdit = (t) => {
        setEditing(t);
        setForm({ prenom: t.prenom, nom: t.nom, email: t.email, telephone: t.telephone || '', specialites: t.specialites || '' });
        setFormError('');
        setShowAdd(true);
    };

    const save = async () => {
        if (!form.prenom.trim() || !form.nom.trim()) return setFormError('Prénom et nom obligatoires');
        if (!form.email.trim()) return setFormError('L\'email est obligatoire');
        setSaving(true);
        setFormError('');
        try {
            if (editing) {
                await api.put(`/teachers/${editing.id}`, form);
                notify('Enseignant mis à jour');
            } else {
                const r = await api.post('/teachers', form);
                setCredentials({ ...r.data.credentials, name: `${form.prenom} ${form.nom}`, emailSent: r.data.emailSent });
            }
            setShowAdd(false);
            fetchTeachers();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
        setSaving(false);
    };

    const toggleActive = async (t) => {
        const action = t.actif ? 'désactiver' : 'réactiver';
        if (!window.confirm(`Voulez-vous ${action} le compte de ${t.prenom} ${t.nom} ?${t.actif ? '\nIl ne pourra plus se connecter.' : ''}`)) return;
        try {
            await api.put(`/teachers/${t.id}`, { actif: !t.actif });
            notify(t.actif ? 'Compte désactivé' : 'Compte réactivé');
            fetchTeachers();
        } catch (err) {
            notify(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const resetPassword = async (t) => {
        if (!window.confirm(`Générer un nouveau mot de passe pour ${t.prenom} ${t.nom} ?\nL'ancien ne fonctionnera plus.`)) return;
        try {
            const r = await api.post(`/teachers/${t.id}/reset-password`);
            setCredentials({ ...r.data.credentials, name: `${t.prenom} ${t.nom}` });
        } catch (err) {
            notify(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const remove = async (t) => {
        if (!window.confirm(`Supprimer définitivement ${t.prenom} ${t.nom} ?`)) return;
        try {
            await api.delete(`/teachers/${t.id}`);
            notify('Enseignant supprimé');
            fetchTeachers();
        } catch (err) {
            notify(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const updateAvatar = (id, url) => {
        setTeachers(list => list.map(t => (t.id === id ? { ...t, avatarUrl: url } : t)));
        setEditing(e => (e && e.id === id ? { ...e, avatarUrl: url } : e));
    };

    const filtered = teachers.filter(t => {
        if (!showInactive && !t.actif) return false;
        const q = search.toLowerCase();
        return `${t.prenom} ${t.nom} ${t.email} ${t.specialites || ''} ${t.login}`.toLowerCase().includes(q);
    });
    const activeCount = teachers.filter(t => t.actif).length;
    const inactiveCount = teachers.length - activeCount;
    const totalStudents = (t) => t.taughtGroups.reduce((a, g) => a + (g._count?.enrollments || 0), 0);

    return (
        <div>
            {toast && (
                <div style={{ ...s.toast, background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', borderColor: toast.type === 'error' ? '#FECACA' : '#A7F3D0', color: toast.type === 'error' ? '#B91C1C' : '#047857' }}>
                    {toast.msg}
                </div>
            )}

            <div style={s.ph}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={s.headIcon}><Ic name="teacher" size={20} color="#059669" /></div>
                    <div>
                        <div style={s.kicker}>Équipe pédagogique</div>
                        <h1 style={s.h1}>Enseignants</h1>
                    </div>
                </div>
                <button style={s.btnP} onClick={openAdd}><Ic name="add" size={14} color="#fff" /> Ajouter un enseignant</button>
            </div>

            <div style={s.filters}>
                <div style={s.searchBox}>
                    <Ic name="search" size={15} color="#9CA3AF" />
                    <input style={s.searchInput} placeholder="Nom, email, spécialité…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {inactiveCount > 0 && (
                    <label style={s.check}>
                        <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                        Afficher les comptes désactivés ({inactiveCount})
                    </label>
                )}
                <span style={s.countBadge}>{activeCount} actif(s)</span>
            </div>

            {loading ? (
                <div style={s.empty}>Chargement…</div>
            ) : filtered.length === 0 ? (
                <div style={s.empty}>
                    {teachers.length === 0 ? (
                        <>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1040', marginBottom: '6px' }}>Aucun enseignant</div>
                            <div style={{ marginBottom: '14px' }}>Ajoutez votre premier enseignant pour lui créer un accès.</div>
                            <button style={{ ...s.btnP, margin: '0 auto' }} onClick={openAdd}><Ic name="add" size={14} color="#fff" /> Ajouter</button>
                        </>
                    ) : 'Aucun résultat'}
                </div>
            ) : (
                <div style={s.grid}>
                    {filtered.map(t => (
                        <div key={t.id} style={{ ...s.card, opacity: t.actif ? 1 : 0.6 }}>
                            <div style={s.cardTop}>
                                <Avatar user={t} size={54} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={s.name}>{t.prenom} {t.nom}</div>
                                    <div style={s.login}>{t.login}</div>
                                    {!t.actif && <span style={s.inactive}>Désactivé</span>}
                                </div>
                            </div>

                            <div style={s.contact}>
                                <a href={`mailto:${t.email}`} style={s.contactLine}><Ic name="mail" size={13} color="#9CA3AF" /> {t.email}</a>
                                {t.telephone
                                    ? <a href={`tel:${t.telephone.replace(/\s/g, '')}`} style={s.contactLine}><Ic name="phone" size={13} color="#9CA3AF" /> {t.telephone}</a>
                                    : <span style={{ ...s.contactLine, color: '#D1D5DB' }}><Ic name="phone" size={13} color="#D1D5DB" /> Téléphone non renseigné</span>}
                            </div>

                            {splitTags(t.specialites).length > 0 && (
                                <div style={s.tags}>
                                    {splitTags(t.specialites).map(tag => <span key={tag} style={s.tag}>{tag}</span>)}
                                </div>
                            )}

                            <div style={s.groupsBox}>
                                <div style={s.groupsHead}>
                                    <span>Groupes</span>
                                    <span style={{ color: '#9CA3AF' }}>{t.taughtGroups.length} · {totalStudents(t)} élève(s)</span>
                                </div>
                                {t.taughtGroups.length === 0
                                    ? <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>Aucun groupe assigné</div>
                                    : t.taughtGroups.map(g => (
                                        <Link key={g.id} to={`/groups/${g.id}`} style={s.groupRow}>
                                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.titre}</span>
                                            <AudienceBadge audience={g.audience} size="sm" />
                                        </Link>
                                    ))}
                            </div>

                            <div style={s.actions}>
                                <button style={s.act} onClick={() => openEdit(t)}><Ic name="edit" size={13} color="#5B2EE8" /> Modifier</button>
                                <button style={s.act} onClick={() => resetPassword(t)}><Ic name="key" size={13} color="#5B2EE8" /> Mot de passe</button>
                                <button style={s.act} onClick={() => toggleActive(t)}>
                                    <Ic name={t.actif ? 'lock' : 'unlock'} size={13} color={t.actif ? '#D97706' : '#059669'} /> {t.actif ? 'Désactiver' : 'Réactiver'}
                                </button>
                                {t.taughtGroups.length === 0 && t.supervisedGroups.length === 0 && (
                                    <button style={{ ...s.act, color: '#DC2626' }} onClick={() => remove(t)} title="Supprimer"><Ic name="trash" size={13} color="#DC2626" /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Ajouter / modifier ── */}
            {showAdd && (
                <div style={s.modalBg} onClick={() => !saving && setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>{editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</h2>
                        {editing && (
                            <div style={{ background: '#F8F6FF', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                                <AvatarUpload user={editing} size={56} endpoint={`/users/${editing.id}/avatar`} onChange={(url) => updateAvatar(editing.id, url)} />
                            </div>
                        )}
                        <div style={s.formGrid}>
                            <Field label="Prénom *" value={form.prenom} onChange={set('prenom')} />
                            <Field label="Nom *" value={form.nom} onChange={set('nom')} />
                            <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="prenom@codinghost.fr" />
                            <Field label="Téléphone" value={form.telephone} onChange={set('telephone')} placeholder="06 XX XX XX XX" />
                            <Field label="Spécialités" value={form.specialites} onChange={set('specialites')} placeholder="ex : Python, Roblox, Bureautique" full />
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '-4px' }}>Séparez les spécialités par des virgules.</div>
                        {!editing && (
                            <label style={{ ...s.check, marginTop: '14px' }}>
                                <input type="checkbox" checked={!!form.sendEmail} onChange={e => set('sendEmail')(e.target.checked)} />
                                Envoyer les identifiants par email à l'enseignant
                            </label>
                        )}
                        {formError && <div style={s.formError}>{formError}</div>}
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)} disabled={saving}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
                                <Ic name="save" size={14} color="#fff" /> {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer l\'accès'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Identifiants ── */}
            {credentials && (
                <div style={s.modalBg} onClick={() => setCredentials(null)}>
                    <div style={{ ...s.modal, width: '440px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Identifiants de {credentials.name}</h2>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6B7280', margin: '0 0 16px' }}>
                            Ce mot de passe n'est affiché qu'une seule fois{credentials.emailSent ? ' (envoyé aussi par email)' : ''}.
                        </p>
                        <div style={s.credBox}>
                            <div style={s.credRow}><span style={s.credKey}>Adresse</span><span style={{ ...s.credVal, fontSize: '13px' }}>codinghost.fr/login/equipe</span></div>
                            <div style={s.credRow}><span style={s.credKey}>Login</span><span style={s.credVal}>{credentials.login}</span></div>
                            <div style={{ ...s.credRow, borderBottom: 'none' }}><span style={s.credKey}>Mot de passe</span><span style={s.credVal}>{credentials.password}</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button style={{ ...s.btnO, flex: 1, justifyContent: 'center' }}
                                    onClick={() => { navigator.clipboard.writeText(`Adresse : codinghost.fr/login/equipe\nLogin : ${credentials.login}\nMot de passe : ${credentials.password}`); notify('Copié !'); }}>
                                <Ic name="copy" size={14} color="#1A1040" /> Copier
                            </button>
                            <button style={{ ...s.btnP, flex: 1, justifyContent: 'center' }} onClick={() => setCredentials(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
    headIcon: { width: '44px', height: '44px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    kicker: { fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#059669' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: 800, color: '#1A1040', margin: '2px 0 0' },
    btnP: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#5B2EE8', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnO: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '9px', color: '#1A1040', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    filters: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '9px', padding: '8px 12px', flex: 1, minWidth: '200px', maxWidth: '340px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%', fontFamily: 'inherit' },
    check: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', fontWeight: 600, cursor: 'pointer' },
    countBadge: { fontSize: '12px', color: '#6B7280', fontWeight: 700, marginLeft: 'auto', background: '#F3F4F6', padding: '4px 10px', borderRadius: '50px' },
    empty: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' },
    card: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(26,16,64,0.04)' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '12px' },
    name: { fontSize: '16px', fontWeight: 800, color: '#1A1040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    login: { fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace', marginTop: '2px' },
    inactive: { display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: 800, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1px 8px', borderRadius: '50px' },
    contact: { display: 'flex', flexDirection: 'column', gap: '6px' },
    contactLine: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#374151', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    tags: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
    tag: { fontSize: '11px', fontWeight: 700, color: '#5B2EE8', background: '#F0EEFF', border: '1px solid #DDD5FF', padding: '2px 9px', borderRadius: '50px' },
    groupsBox: { background: '#FAFAFE', border: '1px solid #EEEBF8', borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
    groupsHead: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6B7280' },
    groupRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1A1040', fontWeight: 600, textDecoration: 'none' },
    actions: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid #F3F4F6' },
    act: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', border: '1px solid #EEEBF8', background: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: 800, color: '#1A1040', margin: '0 0 16px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '6px' },
    fl: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    formError: { marginTop: '14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600 },
    credBox: { background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '8px 18px' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,128,96,0.12)', gap: '12px' },
    credKey: { color: '#6B7280', fontWeight: 600, fontSize: '13px' },
    credVal: { fontFamily: 'monospace', fontSize: '15px', fontWeight: 800, color: '#5B2EE8' },
    toast: { position: 'fixed', top: '70px', right: '20px', zIndex: 999, padding: '12px 18px', borderRadius: '10px', border: '1px solid', fontWeight: 700, fontSize: '13px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
};
