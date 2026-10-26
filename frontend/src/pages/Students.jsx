import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Ic, ActionBtn } from '../components/Icons';
import Avatar, { AvatarUpload } from '../components/Avatar';
import ImportStudentsModal from '../components/ImportStudentsModal';
import { AUDIENCES } from '../utils/audience';

const EMPTY = { nom: '', prenom: '', age: '', email: '', telephone: '', parentNom: '', parentTel: '', parentEmail: '', groupId: '' };

const previewLogin = (prenom, nom) => {
    const clean = str => String(str || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '.').replace(/[^a-z0-9.-]/g, '');
    return [clean(prenom), clean(nom)].filter(Boolean).join('.');
};

// Champ de formulaire — défini HORS du composant (sinon perte du focus à chaque frappe)
const Field = ({ label, value, onChange, type = 'text', placeholder, full }) => (
    <div style={{ ...s.fg, ...(full ? { gridColumn: '1/-1' } : {}) }}>
        <label style={s.fl}>{label}</label>
        <input style={s.fi} type={type} placeholder={placeholder} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
);

// Formulaire élève (adapté enfant / adulte)
const StudentForm = ({ form, setForm, audience, groups, otherGroups = [] }) => {
    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
    const isKid = audience === 'ENFANT';
    return (
        <>
            <div style={s.sectionTitle}><Ic name="user" size={14} color="#1A1040" /> {isKid ? "L'enfant" : "L'élève"}</div>
            <div style={s.formGrid}>
                <Field label="Prénom *" value={form.prenom} onChange={set('prenom')} placeholder="Prénom" />
                <Field label="Nom *" value={form.nom} onChange={set('nom')} placeholder="Nom" />
                {isKid ? (
                    <Field label="Âge" type="number" value={form.age} onChange={set('age')} placeholder="ex : 10" />
                ) : (
                    <>
                        <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="prenom.nom@email.com" />
                        <Field label="Téléphone" value={form.telephone} onChange={set('telephone')} placeholder="06 XX XX XX XX" />
                    </>
                )}
            </div>

            <div style={s.sectionTitle}><Ic name="group" size={14} color="#1A1040" /> Groupe</div>
            <div style={s.fg}>
                <select style={s.fi} value={form.groupId} onChange={e => set('groupId')(e.target.value)}>
                    <option value="">— Aucun groupe —</option>
                    <optgroup label={`Groupes ${AUDIENCES[audience].label.toLowerCase()}`}>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.titre}{g.ville ? ` (${g.ville})` : ''}</option>)}
                    </optgroup>
                    {otherGroups.length > 0 && (
                        <optgroup label={`Changer d'espace → groupes ${AUDIENCES[audience === 'ENFANT' ? 'ADULTE' : 'ENFANT'].label.toLowerCase()}`}>
                            {otherGroups.map(g => <option key={g.id} value={g.id}>{g.titre}{g.ville ? ` (${g.ville})` : ''}</option>)}
                        </optgroup>
                    )}
                </select>
                {groups.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        Aucun groupe « {AUDIENCES[audience].label} » : créez-en un dans la page Groupes.
                    </span>
                )}
            </div>

            {isKid && (
                <>
                    <div style={s.sectionTitle}><Ic name="users" size={14} color="#1A1040" /> Parent / tuteur</div>
                    <div style={s.formGrid}>
                        <Field label="Nom du parent" value={form.parentNom} onChange={set('parentNom')} placeholder="Nom complet" />
                        <Field label="Téléphone" value={form.parentTel} onChange={set('parentTel')} placeholder="06 XX XX XX XX" />
                        <Field label="Email parent" type="email" value={form.parentEmail} onChange={set('parentEmail')} placeholder="parent@email.com" full />
                    </div>
                </>
            )}
        </>
    );
};

export default function Students({ audience = 'ENFANT' }) {
    const { user } = useAuth();
    const A = AUDIENCES[audience];
    const isKid = audience === 'ENFANT';
    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);
    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';

    const [students, setStudents] = useState([]);
    const [noGroup, setNoGroup] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [showNoGroup, setShowNoGroup] = useState(false);
    const [showPassword, setShowPassword] = useState({});

    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selected, setSelected] = useState(null);
    const [addForm, setAddForm] = useState(EMPTY);
    const [editForm, setEditForm] = useState({ ...EMPTY, resetPassword: false });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [credentials, setCredentials] = useState(null);
    const [toast, setToast] = useState(null);

    const audienceGroups = useMemo(() => groups.filter(g => g.audience === audience), [groups, audience]);

    useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    const fetchAll = async () => {
        setLoading(true);
        const [sRes, nRes, gRes] = await Promise.allSettled([
            api.get(`/students?audience=${audience}`),
            api.get('/students?audience=NONE'),
            api.get('/groups'),
        ]);
        if (sRes.status === 'fulfilled') setStudents(sRes.value.data); else notify('Impossible de charger les élèves', 'error');
        if (nRes.status === 'fulfilled') setNoGroup(nRes.value.data);
        if (gRes.status === 'fulfilled') setGroups(gRes.value.data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!addForm.prenom.trim() || !addForm.nom.trim()) return setFormError('Prénom et nom obligatoires');
        setSaving(true);
        setFormError('');
        try {
            const res = await api.post('/students', addForm);
            setCredentials({ ...res.data.credentials, name: `${addForm.prenom} ${addForm.nom}`, emailSent: res.data.emailSent });
            setShowAdd(false);
            setAddForm(EMPTY);
            fetchAll();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de la création');
        }
        setSaving(false);
    };

    const openEdit = (st) => {
        setSelected(st);
        setFormError('');
        setEditForm({
            nom: st.user?.nom || '', prenom: st.user?.prenom || '', age: st.age || '',
            email: st.user?.email && !/@(eleve\.)?codinghost\.(fr|dz)$/.test(st.user.email) ? st.user.email : '',
            telephone: st.user?.telephone || '',
            parentNom: st.parentNom || '', parentTel: st.parentTel || '', parentEmail: st.parentEmail || '',
            groupId: st.enrollments?.[0]?.group?.id || '', resetPassword: false,
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!editForm.prenom.trim() || !editForm.nom.trim()) return setFormError('Prénom et nom obligatoires');
        setSaving(true);
        setFormError('');
        try {
            const payload = { ...editForm };
            if (isKid) { delete payload.email; delete payload.telephone; }
            const res = await api.put(`/students/${selected.id}/full`, payload);
            setShowEdit(false);
            if (res.data.newPassword) setCredentials({ login: res.data.login, password: res.data.newPassword, name: `${editForm.prenom} ${editForm.nom}` });
            else notify('Élève mis à jour');
            fetchAll();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de la modification');
        }
        setSaving(false);
    };

    const handleDelete = async (st) => {
        if (!window.confirm(`Supprimer définitivement ${st.user?.prenom} ${st.user?.nom} ?\nSes présences, devoirs et sa progression seront supprimés.`)) return;
        try {
            await api.delete(`/students/${st.id}`);
            notify('Élève supprimé');
            fetchAll();
        } catch (err) {
            notify(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
        }
    };

    const updateAvatarLocal = (id, url) => {
        const patch = (list) => list.map(x => (x.id === id ? { ...x, user: { ...x.user, avatarUrl: url } } : x));
        setStudents(patch);
        setNoGroup(patch);
        setSelected(sel => (sel && sel.id === id ? { ...sel, user: { ...sel.user, avatarUrl: url } } : sel));
    };

    const list = showNoGroup ? noGroup : students;
    const filtered = list.filter(st => {
        const q = search.toLowerCase();
        const hay = `${st.user?.prenom} ${st.user?.nom} ${st.user?.login} ${st.parentNom || ''} ${st.user?.email || ''}`.toLowerCase();
        const matchGroup = showNoGroup || !filterGroup || st.enrollments?.some(e => e.group?.id === parseInt(filterGroup));
        return hay.includes(q) && matchGroup;
    });

    const otherAudience = isKid ? AUDIENCES.ADULTE : AUDIENCES.ENFANT;
    const columns = ['Élève', 'Login', ...(isAdmin ? ['Mot de passe'] : []), ...(isKid ? ['Âge', 'Parent', 'Tél. parent'] : ['Email', 'Téléphone']), 'Groupe', ''];

    return (
        <div>
            {toast && (
                <div style={{ ...s.toast, background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', borderColor: toast.type === 'error' ? '#FECACA' : '#A7F3D0', color: toast.type === 'error' ? '#B91C1C' : '#047857' }}>
                    {toast.msg}
                </div>
            )}

            {/* ── En-tête ── */}
            <div style={s.ph}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ ...s.headIcon, background: A.bg, border: `1px solid ${A.border}` }}>
                        <Ic name="student" size={20} color={A.color} />
                    </div>
                    <div>
                        <div style={{ ...s.kicker, color: A.color }}>Espace {A.label}</div>
                        <h1 style={s.h1}>Élèves {A.label.toLowerCase()}</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to={`/students/${otherAudience.slug}`} style={s.switchLink}>Voir les élèves {otherAudience.label.toLowerCase()} →</Link>
                    {canAdd && (
                        <>
                            <button style={s.btnO} onClick={() => setShowImport(true)}>
                                <Ic name="upload" size={14} color="#1A1040" /> Importer (Kommo)
                            </button>
                            <button style={{ ...s.btnP, background: A.color }} onClick={() => { setAddForm(EMPTY); setFormError(''); setShowAdd(true); }}>
                                <Ic name="add" size={14} color="#fff" /> Ajouter
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Filtres ── */}
            <div style={s.filters}>
                <div style={s.searchBox}>
                    <Ic name="search" size={15} color="#9CA3AF" />
                    <input style={s.searchInput} placeholder={isKid ? 'Nom, login, parent…' : 'Nom, login, email…'}
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {!showNoGroup && (
                    <select style={s.filterSelect} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                        <option value="">Tous les groupes {A.label.toLowerCase()}</option>
                        {audienceGroups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                    </select>
                )}
                {noGroup.length > 0 && (
                    <button style={{ ...s.chip, ...(showNoGroup ? { background: '#1A1040', color: '#fff', borderColor: '#1A1040' } : {}) }}
                            onClick={() => setShowNoGroup(v => !v)}>
                        {showNoGroup ? '← Retour aux élèves' : `Sans groupe (${noGroup.length})`}
                    </button>
                )}
                <span style={s.countBadge}>{filtered.length} élève(s)</span>
            </div>
            {showNoGroup && (
                <div style={s.info}>Ces élèves ne sont dans aucun groupe : ils ne voient aucun cours. Ouvrez leur fiche pour les assigner à un groupe {A.label.toLowerCase()}.</div>
            )}

            {/* ── Tableau ── */}
            <div style={s.tw}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                        <thead><tr>{columns.map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length} style={s.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={columns.length} style={s.tdCenter}>
                                {search || filterGroup ? 'Aucun élève ne correspond à la recherche' : `Aucun élève ${A.label.toLowerCase()} pour l'instant`}
                            </td></tr>
                        ) : filtered.map(st => (
                            <tr key={st.id} style={s.tr}>
                                <td style={s.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: canAdd ? 'pointer' : 'default' }} onClick={() => canAdd && openEdit(st)}>
                                        <Avatar user={st.user} size={34} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1040' }}>{st.user?.prenom} {st.user?.nom}</span>
                                    </div>
                                </td>
                                <td style={s.tdMono}>{st.user?.login}</td>
                                {isAdmin && (
                                    <td style={s.td}>
                                        <div style={s.passRow}>
                                            <span style={s.passVal}>{showPassword[st.id] ? (st.user?.plainPassword || '—') : '••••••••'}</span>
                                            <button style={s.eyeBtn} onClick={() => setShowPassword(p => ({ ...p, [st.id]: !p[st.id] }))} title="Afficher">
                                                <Ic name={showPassword[st.id] ? 'eye_off' : 'eye'} size={14} color="#9CA3AF" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                                {isKid ? (
                                    <>
                                        <td style={s.td}>{st.age ? `${st.age} ans` : '—'}</td>
                                        <td style={s.td}>{st.parentNom || '—'}</td>
                                        <td style={s.tdMuted}>{st.parentTel || '—'}</td>
                                    </>
                                ) : (
                                    <>
                                        <td style={s.tdMuted}>{st.user?.email && !/@(eleve\.)?codinghost\.(fr|dz)$/.test(st.user.email) ? st.user.email : '—'}</td>
                                        <td style={s.tdMuted}>{st.user?.telephone || '—'}</td>
                                    </>
                                )}
                                <td style={s.td}>
                                    {st.enrollments?.length > 0 ? st.enrollments.map(e => (
                                        <Link key={e.id} to={`/groups/${e.group?.id}`} style={{ ...s.groupPill, background: A.bg, color: A.color }}>{e.group?.titre}</Link>
                                    )) : <span style={s.noGroup}>Sans groupe</span>}
                                </td>
                                <td style={s.td}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                        {canAdd && <ActionBtn icon="mail" color="#DB2777" bg="#FDF2F8" onClick={() => navigate(`/emails?student=${st.id}`)} title={audience === 'ADULTE' ? 'Envoyer un email' : 'Envoyer un email aux parents'} />}
                                        {canAdd && <ActionBtn icon="edit" color="#5B2EE8" bg="#EDE8FF" onClick={() => openEdit(st)} title="Modifier" />}
                                        {isAdmin && <ActionBtn icon="trash" color="#CC0033" bg="#FFF0F0" borderColor="#FFD0D0" onClick={() => handleDelete(st)} title="Supprimer" />}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Ajouter ── */}
            {showAdd && (
                <div style={s.modalBg} onClick={() => !saving && setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <div style={{ ...s.headIcon, background: A.bg, width: 36, height: 36 }}><Ic name="add" size={18} color={A.color} /></div>
                            <div>
                                <h2 style={s.modalTitle}>Nouvel élève {A.labelOne.toLowerCase()}</h2>
                                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Login et mot de passe générés automatiquement</div>
                            </div>
                        </div>
                        {(addForm.prenom || addForm.nom) && (
                            <div style={s.loginPreview}>
                                <Ic name="key" size={14} color="#5B2EE8" />
                                <span style={{ fontSize: '12px', color: '#5B2EE8', fontWeight: 700 }}>Login :</span>
                                <span style={s.loginPreviewVal}>{previewLogin(addForm.prenom, addForm.nom)}</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>(un chiffre est ajouté si déjà pris)</span>
                            </div>
                        )}
                        <StudentForm form={addForm} setForm={setAddForm} audience={audience} groups={audienceGroups} />
                        {formError && <div style={s.formError}>{formError}</div>}
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)} disabled={saving}>Annuler</button>
                            <button style={{ ...s.btnP, background: A.color, opacity: saving ? 0.7 : 1 }} onClick={handleAdd} disabled={saving}>
                                <Ic name="save" size={14} color="#fff" /> {saving ? 'Création…' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Modifier ── */}
            {showEdit && selected && (
                <div style={s.modalBg} onClick={() => !saving && setShowEdit(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <div style={{ ...s.headIcon, background: '#EDE8FF', width: 36, height: 36 }}><Ic name="edit" size={18} color="#5B2EE8" /></div>
                            <h2 style={s.modalTitle}>Fiche élève</h2>
                        </div>

                        <div style={s.studentInfoBox}>
                            {isAdmin ? (
                                <AvatarUpload user={selected.user} size={56} endpoint={`/users/${selected.user?.id}/avatar`}
                                              onChange={(url) => updateAvatarLocal(selected.id, url)} />
                            ) : <Avatar user={selected.user} size={56} />}
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', justifyContent: 'flex-end' }}>
                                    <Ic name="key" size={12} color="#9CA3AF" /> <span style={{ fontFamily: 'monospace' }}>{selected.user?.login}</span>
                                </div>
                                {isAdmin && selected.user?.plainPassword && (
                                    <div style={{ fontSize: '12px', color: '#008060', fontWeight: 700, marginTop: '3px', fontFamily: 'monospace' }}>
                                        {selected.user.plainPassword}
                                    </div>
                                )}
                            </div>
                        </div>

                        <StudentForm form={editForm} setForm={setEditForm} audience={audience} groups={audienceGroups}
                                     otherGroups={groups.filter(g => g.audience !== audience)} />

                        <div style={s.sectionTitle}><Ic name="key" size={14} color="#1A1040" /> Mot de passe</div>
                        <div style={s.resetPassBox}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1040' }}>Générer un nouveau mot de passe</div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>L'ancien ne fonctionnera plus</div>
                            </div>
                            <div style={{ ...s.toggleSlider, background: editForm.resetPassword ? '#5B2EE8' : '#E5E7EB' }}
                                 onClick={() => setEditForm(f => ({ ...f, resetPassword: !f.resetPassword }))}>
                                <div style={{ ...s.toggleThumb, transform: editForm.resetPassword ? 'translateX(20px)' : 'translateX(2px)' }} />
                            </div>
                        </div>

                        {formError && <div style={s.formError}>{formError}</div>}
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEdit(false)} disabled={saving}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }} onClick={handleEdit} disabled={saving}>
                                <Ic name="save" size={14} color="#fff" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Identifiants ── */}
            {credentials && (
                <div style={s.modalBg} onClick={() => setCredentials(null)}>
                    <div style={{ ...s.modal, width: '440px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ width: '56px', height: '56px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Ic name="check_circle" size={28} color="#008060" />
                            </div>
                            <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Identifiants de {credentials.name}</h2>
                            <p style={{ color: '#6B7280', fontSize: '13px', margin: '6px 0 0' }}>
                                À transmettre à {isKid ? "l'enfant et à ses parents" : "l'élève"}
                                {credentials.emailSent ? ' — envoyés aussi par email ✉️' : ''}
                            </p>
                        </div>
                        <div style={s.credBox}>
                            <div style={s.credRow}><span style={s.credKey}>Adresse</span><span style={{ ...s.credVal, fontSize: '13px' }}>codinghost.fr/login/{A.slug}</span></div>
                            <div style={s.credRow}><span style={s.credKey}>Login</span><span style={s.credVal}>{credentials.login}</span></div>
                            <div style={{ ...s.credRow, borderBottom: 'none' }}><span style={s.credKey}>Mot de passe</span><span style={s.credVal}>{credentials.password}</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button style={{ ...s.btnO, flex: 1, justifyContent: 'center' }}
                                    onClick={() => { navigator.clipboard.writeText(`Adresse : codinghost.fr/login/${A.slug}\nLogin : ${credentials.login}\nMot de passe : ${credentials.password}`); notify('Copié !'); }}>
                                <Ic name="copy" size={14} color="#1A1040" /> Copier
                            </button>
                            <button style={{ ...s.btnP, flex: 1, justifyContent: 'center' }} onClick={() => setCredentials(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {showImport && (
                <ImportStudentsModal
                    audience={audience}
                    groups={groups}
                    existingStudents={[...students, ...noGroup]}
                    onClose={() => setShowImport(false)}
                    onDone={fetchAll}
                />
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
    headIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    kicker: { fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: 800, color: '#1A1040', margin: '2px 0 0' },
    switchLink: { fontSize: '12px', fontWeight: 700, color: '#6B7280', textDecoration: 'none', marginRight: '6px' },
    btnP: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#5B2EE8', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnO: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '9px', color: '#1A1040', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    filters: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '9px', padding: '8px 12px', flex: 1, minWidth: '200px', maxWidth: '340px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%', fontFamily: 'inherit' },
    filterSelect: { padding: '8px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    chip: { padding: '7px 12px', border: '1.5px solid #E5E0F5', borderRadius: '50px', fontSize: '12px', fontWeight: 700, color: '#6B7280', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' },
    countBadge: { fontSize: '12px', color: '#6B7280', fontWeight: 700, marginLeft: 'auto', background: '#F3F4F6', padding: '4px 10px', borderRadius: '50px' },
    info: { background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '12px' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #F1EEF9' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040', verticalAlign: 'middle' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280', verticalAlign: 'middle' },
    tdMono: { padding: '10px 14px', fontSize: '12px', color: '#1A1040', fontFamily: 'monospace', verticalAlign: 'middle' },
    tdCenter: { padding: '36px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    passRow: { display: 'flex', alignItems: 'center', gap: '6px' },
    passVal: { fontFamily: 'monospace', fontSize: '12px', color: '#1A1040', fontWeight: 700 },
    eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' },
    groupPill: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, textDecoration: 'none', marginRight: '4px' },
    noGroup: { fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' },
    modalHead: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '19px', fontWeight: 800, color: '#1A1040', margin: 0 },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 800, color: '#1A1040', marginBottom: '12px', marginTop: '18px', paddingBottom: '7px', borderBottom: '1px solid #E5E0F5' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px', marginBottom: '4px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '6px' },
    fl: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    formError: { marginTop: '14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600 },
    loginPreview: { display: 'flex', alignItems: 'center', gap: '8px', background: '#EDE8FF', border: '1.5px solid #C4B5FD', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', flexWrap: 'wrap' },
    loginPreviewVal: { fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: '#5B2EE8' },
    studentInfoBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '12px', padding: '14px', flexWrap: 'wrap' },
    resetPassBox: { display: 'flex', alignItems: 'center', gap: '16px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '10px', padding: '14px' },
    toggleSlider: { width: '44px', height: '24px', borderRadius: '50px', position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer' },
    toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
    credBox: { background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '8px 18px' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,128,96,0.12)', gap: '12px' },
    credKey: { color: '#6B7280', fontWeight: 600, fontSize: '13px' },
    credVal: { fontFamily: 'monospace', fontSize: '15px', fontWeight: 800, color: '#5B2EE8' },
    toast: { position: 'fixed', top: '70px', right: '20px', zIndex: 999, padding: '12px 18px', borderRadius: '10px', border: '1px solid', fontWeight: 700, fontSize: '13px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
};
