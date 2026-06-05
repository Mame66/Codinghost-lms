import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ic, ActionBtn, IconBadge } from '../components/Icons';

// ════════════════════════════════════════════════════════════
// TOAST SYSTEM — remplace tous les alert() natifs
// ════════════════════════════════════════════════════════════
function Toast({ toasts }) {
    return (
        <div style={{
            position: 'fixed', top: '20px', right: '20px',
            zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
            pointerEvents: 'none',
        }}>
            {toasts.map(t => {
                const colors = {
                    error:   { border: '#FECACA', iconBg: '#FEF2F2', icon: '#DC2626', title: '#991B1B' },
                    success: { border: '#A7F3D0', iconBg: '#ECFDF5', icon: '#059669', title: '#065F46' },
                    warn:    { border: '#FDE68A', iconBg: '#FFFBEB', icon: '#D97706', title: '#92400E' },
                    info:    { border: '#C4B5FD', iconBg: '#EDE8FF', icon: '#5B2EE8', title: '#3730A3' },
                };
                const c = colors[t.type] || colors.info;
                return (
                    <div key={t.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '14px 18px', borderRadius: '12px',
                        minWidth: '300px', maxWidth: '400px',
                        background: '#fff',
                        border: `1.5px solid ${c.border}`,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                        pointerEvents: 'all',
                        animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                        {/* Icône */}
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: c.iconBg,
                        }}>
                            {t.type === 'success' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            {t.type === 'error'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                            {t.type === 'warn'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                            {t.type === 'info'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
                        </div>
                        {/* Texte */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {t.title && (
                                <div style={{ fontSize: '13px', fontWeight: '700', color: c.title, marginBottom: '2px' }}>
                                    {t.title}
                                </div>
                            )}
                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{t.message}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = (message, type = 'info', title = '', duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, title }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };
    return {
        toasts,
        success: (msg, title = 'Succès')    => show(msg, 'success', title),
        error:   (msg, title = 'Erreur')    => show(msg, 'error',   title),
        warn:    (msg, title = 'Attention') => show(msg, 'warn',    title),
        info:    (msg, title = '')          => show(msg, 'info',    title),
    };
}

// ════════════════════════════════════════════════════════════
// FORMULAIRE — un seul objet form (fix bug ville)
// ════════════════════════════════════════════════════════════
const EMPTY_FORM = {
    titre: '', lieu: '', ville: 'Thionville',
    teacherId: '', supervisorId: '',
    statut: 'INSCRIPTION', format: 'OFFLINE', type: 'GROUPE',
};

const FormFields = ({ form, setForm, teachers }) => {
    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
    return (
        <div style={s.formGrid}>
            <div style={{ ...s.fg, gridColumn: '1/-1' }}>
                <label style={s.fl}>Titre *</label>
                <input style={s.fi} placeholder="ex: 2025 Python Samedi 10H"
                       value={form.titre} onChange={set('titre')} />
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Type</label>
                <select style={s.fi} value={form.type} onChange={set('type')}>
                    <option value="GROUPE">Groupe</option>
                    <option value="INTRO">Leçon introductive</option>
                    <option value="INTENSIF">Intensif</option>
                    <option value="INDIVIDUEL">Individuel</option>
                </select>
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Ville</label>
                <select style={s.fi} value={form.ville} onChange={set('ville')}>
                    <option value="Thionville">Thionville</option>
                    <option value="Metz">Metz</option>
                </select>
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Lieu</label>
                <input style={s.fi} placeholder="ex: Salle 3, Centre culturel..."
                       value={form.lieu} onChange={set('lieu')} />
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Format</label>
                <select style={s.fi} value={form.format} onChange={set('format')}>
                    <option value="OFFLINE">Présentiel</option>
                    <option value="ONLINE">En ligne</option>
                    <option value="HYBRIDE">Hybride</option>
                </select>
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Statut</label>
                <select style={s.fi} value={form.statut} onChange={set('statut')}>
                    <option value="INSCRIPTION">Inscription en cours</option>
                    <option value="ACTIF">Actif</option>
                    <option value="SUSPENDU">Suspendu</option>
                    <option value="TERMINE">Terminé</option>
                </select>
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Enseignant</label>
                <select style={s.fi} value={form.teacherId} onChange={set('teacherId')}>
                    <option value="">— Aucun —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                </select>
            </div>
            <div style={s.fg}>
                <label style={s.fl}>Superviseur</label>
                <select style={s.fi} value={form.supervisorId} onChange={set('supervisorId')}>
                    <option value="">— Aucun —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                </select>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Groups() {
    const { user }  = useAuth();
    const navigate  = useNavigate();
    const toast     = useToast();

    const [groups, setGroups]     = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [filterStatus, setFilterStatus]   = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterFormat, setFilterFormat]   = useState('');

    const [showAdd, setShowAdd]               = useState(false);
    const [showEdit, setShowEdit]             = useState(false);
    const [showStudents, setShowStudents]     = useState(false);
    const [selectedGroup, setSelectedGroup]   = useState(null);
    const [saving, setSaving]                 = useState(false);

    const [form, setForm] = useState({ ...EMPTY_FORM });
    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    useEffect(() => { fetchGroups(); fetchTeachers(); }, []);

    const fetchGroups = async () => {
        try { const r = await api.get('/groups'); setGroups(r.data); }
        catch { toast.error('Impossible de charger les groupes', 'Erreur réseau'); }
        setLoading(false);
    };
    const fetchTeachers = async () => {
        try { const r = await api.get('/auth/teachers'); setTeachers(r.data); }
        catch (err) { console.error(err); }
    };

    const resetForm    = () => setForm({ ...EMPTY_FORM });
    const loadEditForm = (g) => setForm({
        titre:        g.titre                      || '',
        lieu:         g.lieu                       || '',
        ville:        g.ville                      || 'Thionville',
        teacherId:    g.teacher?.id?.toString()    || '',
        supervisorId: g.supervisor?.id?.toString() || '',
        statut:       g.statut                     || 'INSCRIPTION',
        format:       g.format                     || 'OFFLINE',
        type:         g.type                       || 'GROUPE',
    });

    const buildPayload = () => ({
        titre:        form.titre,
        lieu:         form.lieu         || null,
        ville:        form.ville,
        teacherId:    form.teacherId    || null,
        supervisorId: form.supervisorId || null,
        statut:       form.statut,
        format:       form.format,
        type:         form.type,
    });

    const handleAdd = async () => {
        if (!form.titre.trim()) {
            toast.warn('Le titre du groupe est obligatoire.', 'Champ manquant');
            return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            await api.post('/groups', payload);
            setShowAdd(false);
            resetForm();
            fetchGroups();
            toast.success(`Groupe "${payload.titre}" créé à ${payload.ville}`, 'Groupe créé');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de créer le groupe.', 'Erreur création');
        }
        setSaving(false);
    };

    const openEdit = (g) => { loadEditForm(g); setSelectedGroup(g); setShowEdit(true); };

    const handleEdit = async () => {
        if (!form.titre.trim()) {
            toast.warn('Le titre du groupe est obligatoire.', 'Champ manquant');
            return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            await api.put(`/groups/${selectedGroup.id}`, payload);
            setShowEdit(false);
            setSelectedGroup(null);
            fetchGroups();
            toast.success(`Groupe "${payload.titre}" mis à jour`, 'Modifications sauvegardées');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de modifier le groupe.', 'Erreur modification');
        }
        setSaving(false);
    };

    const handleDelete = async (id, titre) => {
        if (!window.confirm(`Supprimer le groupe "${titre}" ?`)) return;
        try {
            await api.delete(`/groups/${id}`);
            fetchGroups();
            toast.success('Le groupe a été supprimé définitivement.', 'Supprimé');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Impossible de supprimer ce groupe.', 'Erreur suppression');
        }
    };

    const openStudents = async (g) => {
        try { const r = await api.get(`/groups/${g.id}`); setSelectedGroup(r.data); setShowStudents(true); }
        catch { toast.error('Impossible de charger les étudiants.', 'Erreur'); }
    };

    const statusConfig = {
        ACTIF:       { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'Actif',       icon: 'check_circle' },
        INSCRIPTION: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: 'Inscription',  icon: 'clock' },
        SUSPENDU:    { bg: 'rgba(255,59,92,0.12)', color: '#CC0033', label: 'Suspendu',     icon: 'alert' },
        TERMINE:     { bg: '#F3F4F6',              color: '#6B7280', label: 'Terminé',       icon: 'check' },
    };
    const formatConfig = {
        ONLINE:  { bg: 'rgba(0,196,140,0.12)',  color: '#008060', label: 'En ligne',   icon: 'globe' },
        OFFLINE: { bg: '#F3F4F6',               color: '#6B7280', label: 'Présentiel', icon: 'location' },
        HYBRIDE: { bg: 'rgba(33,150,243,0.12)', color: '#0069C0', label: 'Hybride',    icon: 'globe' },
    };
    const typeLabels = { GROUPE: 'Groupe', INTRO: 'Leçon intro', INTENSIF: 'Intensif', INDIVIDUEL: 'Individuel' };

    const filtered = groups.filter(g => {
        const tn = `${g.teacher?.prenom||''} ${g.teacher?.nom||''}`.toLowerCase();
        const ms = g.titre.toLowerCase().includes(search.toLowerCase()) ||
            tn.includes(search.toLowerCase()) ||
            (g.lieu||'').toLowerCase().includes(search.toLowerCase()) ||
            (g.ville||'').toLowerCase().includes(search.toLowerCase());
        return ms &&
            (!filterStatus  || g.statut    === filterStatus) &&
            (!filterTeacher || g.teacherId === parseInt(filterTeacher)) &&
            (!filterFormat  || g.format    === filterFormat);
    });

    return (
        <div style={{ position: 'relative' }}>

            {/* Animation CSS toast */}
            <style>{`
                @keyframes toastIn {
                    from { opacity:0; transform:translateX(20px) scale(0.96); }
                    to   { opacity:1; transform:translateX(0)     scale(1); }
                }
            `}</style>

            {/* Toasts */}
            <Toast toasts={toast.toasts} />

            {/* ── Header ── */}
            <div style={s.ph}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <IconBadge icon="group" color="#0069C0" bg="#EFF6FF" size={36} iconSize={18} />
                    <h1 style={s.h1}>Groupes</h1>
                </div>
                {canAdd && (
                    <button style={s.btnP} onClick={() => { resetForm(); setShowAdd(true); }}>
                        <Ic name="add" size={14} color="#fff" /> Ajouter
                    </button>
                )}
            </div>

            {/* ── Filtres ── */}
            <div style={s.filtersRow}>
                <div style={s.searchBox}>
                    <Ic name="search" size={15} color="#9CA3AF" />
                    <input style={s.searchInput} placeholder="Groupe, enseignant, lieu, ville..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    <option value="ACTIF">Actif</option>
                    <option value="INSCRIPTION">Inscription</option>
                    <option value="SUSPENDU">Suspendu</option>
                    <option value="TERMINE">Terminé</option>
                </select>
                <select style={s.filterSelect} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                    <option value="">Tous les enseignants</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                </select>
                <select style={s.filterSelect} value={filterFormat} onChange={e => setFilterFormat(e.target.value)}>
                    <option value="">Tous les formats</option>
                    <option value="OFFLINE">Présentiel</option>
                    <option value="ONLINE">En ligne</option>
                    <option value="HYBRIDE">Hybride</option>
                </select>
                <span style={s.countBadge}>{filtered.length} groupe(s)</span>
            </div>

            {/* ── Tableau ── */}
            <div style={s.tw}>
                <div style={{ overflowX:'auto' }}>
                    <table style={s.table}>
                        <thead>
                        <tr>{['ID','Titre','Enseignant','Étudiants','Ville','Lieu','Type','Statut','Format','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="10" style={s.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="10" style={s.tdCenter}>Aucun groupe trouvé</td></tr>
                        ) : filtered.map(g => {
                            const sc = statusConfig[g.statut] || statusConfig.INSCRIPTION;
                            const fc = formatConfig[g.format] || formatConfig.OFFLINE;
                            return (
                                <tr key={g.id} style={s.tr}>
                                    <td style={s.tdMuted}>{g.id}</td>
                                    <td style={s.tdLink} onClick={() => navigate(`/groups/${g.id}`)}>{g.titre}</td>
                                    <td style={s.td}>
                                        {g.teacher ? (
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                                <div style={s.teacherAvatar}>{g.teacher.prenom?.[0]}{g.teacher.nom?.[0]}</div>
                                                <span style={{ fontSize:'13px' }}>{g.teacher.prenom} {g.teacher.nom}</span>
                                            </div>
                                        ) : <span style={s.noTeacher}>Non assigné</span>}
                                    </td>
                                    <td style={s.td}>
                                        <button style={s.countPill} onClick={() => openStudents(g)}>
                                            <Ic name="users" size={12} color="#5B2EE8" />
                                            {g._count?.enrollments || 0}
                                        </button>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{
                                            display:'inline-flex', alignItems:'center',
                                            fontSize:'12px', fontWeight:'700', padding:'3px 10px', borderRadius:'50px',
                                            background: g.ville === 'Metz' ? '#EFF6FF' : '#F0FDF4',
                                            color:      g.ville === 'Metz' ? '#0069C0' : '#166534',
                                            border:    `1px solid ${g.ville === 'Metz' ? '#BFDBFE' : '#BBF7D0'}`,
                                        }}>
                                            {g.ville || '—'}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        {g.lieu
                                            ? <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'13px' }}><Ic name="location" size={13} color="#9CA3AF" /> {g.lieu}</span>
                                            : '—'}
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ ...s.pill, background: g.type==='GROUPE'?'#1A1040':'#F3F4F6', color: g.type==='GROUPE'?'#fff':'#6B7280' }}>
                                            {typeLabels[g.type]}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', ...s.pill, background:sc.bg, color:sc.color }}>
                                            <Ic name={sc.icon} size={11} color={sc.color} /> {sc.label}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', ...s.pill, background:fc.bg, color:fc.color }}>
                                            <Ic name={fc.icon} size={11} color={fc.color} /> {fc.label}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <div style={{ display:'flex', gap:'6px' }}>
                                            {canAdd && <ActionBtn icon="edit" color="#5B2EE8" bg="#EDE8FF" onClick={() => openEdit(g)} title="Modifier" />}
                                            <ActionBtn icon="users" color="#008060" bg="#ECFDF5" onClick={() => openStudents(g)} title="Voir les étudiants" />
                                            {user?.role === 'ADMIN' && <ActionBtn icon="trash" color="#CC0033" bg="#FFF0F0" borderColor="#FFD0D0" onClick={() => handleDelete(g.id, g.titre)} title="Supprimer" />}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════ MODAL AJOUTER ════ */}
            {showAdd && (
                <div style={s.modalBg} onClick={() => setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <IconBadge icon="add" color="#5B2EE8" bg="#EDE8FF" size={36} iconSize={18} />
                            <h2 style={s.modalTitle}>Ajouter un groupe</h2>
                        </div>
                        <FormFields form={form} setForm={setForm} teachers={teachers} />
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.65 : 1 }} onClick={handleAdd} disabled={saving}>
                                <Ic name="save" size={14} color="#fff" /> {saving ? 'Création...' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL MODIFIER ════ */}
            {showEdit && selectedGroup && (
                <div style={s.modalBg} onClick={() => setShowEdit(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <IconBadge icon="edit" color="#5B2EE8" bg="#EDE8FF" size={36} iconSize={18} />
                            <h2 style={s.modalTitle}>Modifier le groupe</h2>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#F8F6FF', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
                            <span style={{ background:'#EDE8FF', color:'#5B2EE8', padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'800' }}>#{selectedGroup.id}</span>
                            <span style={{ fontFamily:'sans-serif', fontSize:'15px', fontWeight:'800', color:'#1A1040' }}>{selectedGroup.titre}</span>
                        </div>
                        <FormFields form={form} setForm={setForm} teachers={teachers} />
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEdit(false)}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.65 : 1 }} onClick={handleEdit} disabled={saving}>
                                <Ic name="save" size={14} color="#fff" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL ÉTUDIANTS ════ */}
            {showStudents && selectedGroup && (
                <div style={s.modalBg} onClick={() => setShowStudents(false)}>
                    <div style={{ ...s.modal, width:'720px' }} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHead}>
                            <IconBadge icon="users" color="#5B2EE8" bg="#EDE8FF" size={36} iconSize={18} />
                            <h2 style={s.modalTitle}>{selectedGroup.titre}</h2>
                        </div>
                        <div style={s.groupDetails}>
                            {[
                                { icon:'teacher',      label:'Enseignant', val: selectedGroup.teacher ? `${selectedGroup.teacher.prenom} ${selectedGroup.teacher.nom}` : '—' },
                                { icon:'location',     label:'Lieu',       val: selectedGroup.lieu  || '—' },
                                { icon:'map',          label:'Ville',      val: selectedGroup.ville || '—' },
                                { icon:'users',        label:'Étudiants',  val: selectedGroup.enrollments?.length || 0 },
                                { icon:'user',         label:'Superviseur',val: selectedGroup.supervisor ? `${selectedGroup.supervisor.prenom} ${selectedGroup.supervisor.nom}` : '—' },
                                { icon:'check_circle', label:'Statut',     val: statusConfig[selectedGroup.statut]?.label },
                                { icon:'globe',        label:'Format',     val: formatConfig[selectedGroup.format]?.label },
                            ].map((item, i) => (
                                <div key={i} style={s.groupDetailItem}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' }}>
                                        <Ic name={item.icon} size={12} color="#9CA3AF" />
                                        <div style={s.gdLabel}>{item.label}</div>
                                    </div>
                                    <div style={s.gdVal}>{item.val}</div>
                                </div>
                            ))}
                        </div>
                        {selectedGroup.enrollments?.length === 0 ? (
                            <div style={{ padding:'30px', textAlign:'center', color:'#6B7280', fontSize:'13px' }}>Aucun étudiant dans ce groupe</div>
                        ) : (
                            <table style={s.table}>
                                <thead><tr>{['#','Nom & Prénom','Login','Âge','Parent','Inscrit le'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {selectedGroup.enrollments?.map((e, i) => (
                                    <tr key={e.id} style={s.tr}>
                                        <td style={s.tdMuted}>{i + 1}</td>
                                        <td style={s.td}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#5B2EE8,#A78BFF)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', flexShrink:0 }}>
                                                    {e.student?.user?.prenom?.[0]}{e.student?.user?.nom?.[0]}
                                                </div>
                                                <span style={{ fontWeight:'700', fontSize:'13px' }}>{e.student?.user?.prenom} {e.student?.user?.nom}</span>
                                            </div>
                                        </td>
                                        <td style={s.tdMono}>{e.student?.user?.login}</td>
                                        <td style={s.td}>{e.student?.age || '—'}</td>
                                        <td style={s.td}>{e.student?.parentNom || '—'}</td>
                                        <td style={s.tdMuted}>{new Date(e.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <div style={s.modalFoot}>
                            <button style={s.btnP} onClick={() => setShowStudents(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph:             { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' },
    h1:             { fontFamily:'sans-serif', fontSize:'22px', fontWeight:'800', color:'#1A1040', margin:0 },
    btnP:           { display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', background:'#5B2EE8', border:'none', borderRadius:'9px', color:'#fff', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    btnO:           { display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', background:'transparent', border:'1.5px solid #E5E0F5', borderRadius:'9px', color:'#1A1040', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' },
    filtersRow:     { display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' },
    searchBox:      { display:'flex', alignItems:'center', gap:'8px', background:'#fff', border:'1.5px solid #E5E0F5', borderRadius:'9px', padding:'8px 12px', flex:1, minWidth:'200px' },
    searchInput:    { border:'none', background:'transparent', outline:'none', fontSize:'13px', color:'#1A1040', width:'100%' },
    filterSelect:   { padding:'8px 12px', border:'1.5px solid #E5E0F5', borderRadius:'9px', fontSize:'13px', color:'#1A1040', outline:'none', background:'#fff', fontFamily:'inherit' },
    countBadge:     { fontSize:'12px', color:'#6B7280', fontWeight:'700', background:'#F3F4F6', padding:'4px 10px', borderRadius:'50px', whiteSpace:'nowrap' },
    tw:             { background:'#fff', borderRadius:'14px', border:'1px solid #E5E0F5', overflow:'hidden' },
    table:          { width:'100%', borderCollapse:'collapse' },
    th:             { padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.7px', color:'#6B7280', background:'#F8F6FF', borderBottom:'1px solid #E5E0F5', whiteSpace:'nowrap' },
    tr:             { borderTop:'1px solid #E5E0F5' },
    td:             { padding:'10px 14px', fontSize:'13px', color:'#1A1040', verticalAlign:'middle' },
    tdMuted:        { padding:'10px 14px', fontSize:'12px', color:'#6B7280', verticalAlign:'middle' },
    tdLink:         { padding:'10px 14px', fontSize:'13px', color:'#5B2EE8', fontWeight:'700', cursor:'pointer', verticalAlign:'middle' },
    tdMono:         { padding:'10px 14px', fontSize:'12px', fontFamily:'monospace', color:'#1A1040', verticalAlign:'middle' },
    tdCenter:       { padding:'30px', textAlign:'center', color:'#6B7280', fontSize:'13px' },
    teacherAvatar:  { width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#5B2EE8,#A78BFF)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', flexShrink:0 },
    noTeacher:      { color:'#9CA3AF', fontStyle:'italic', fontSize:'12px' },
    countPill:      { display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'50px', background:'#EDE8FF', color:'#5B2EE8', fontSize:'12px', fontWeight:'800', cursor:'pointer', border:'none', fontFamily:'inherit' },
    pill:           { display:'inline-flex', padding:'3px 9px', borderRadius:'50px', fontSize:'11px', fontWeight:'800' },
    modalBg:        { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' },
    modal:          { background:'#fff', borderRadius:'16px', padding:'32px', width:'620px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' },
    modalHead:      { display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' },
    modalTitle:     { fontFamily:'sans-serif', fontSize:'20px', fontWeight:'800', color:'#1A1040', margin:0 },
    modalFoot:      { display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'24px' },
    formGrid:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' },
    fg:             { display:'flex', flexDirection:'column', gap:'5px', marginBottom:'4px' },
    fl:             { fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px' },
    fi:             { padding:'10px 12px', border:'1.5px solid #E5E0F5', borderRadius:'9px', fontSize:'13px', color:'#1A1040', outline:'none', background:'#F8F6FF', fontFamily:'inherit' },
    groupDetails:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' },
    groupDetailItem:{ background:'#F8F6FF', borderRadius:'10px', padding:'12px' },
    gdLabel:        { fontSize:'11px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase' },
    gdVal:          { fontSize:'13px', fontWeight:'700', color:'#1A1040', marginTop:'2px' },
};