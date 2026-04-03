import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ⚠️ IMPORTANT: FormFields est DEHORS du composant principal
// pour éviter le bug du curseur qui se replace à chaque frappe
const FormFields = ({ titre, setTitre, lieu, setLieu, teacherId, setTeacherId,
                        supervisorId, setSupervisorId, statut, setStatut, format, setFormat,
                        type, setType, teachers }) => (
    <div style={s.formGrid}>
        <div style={{ ...s.fg, gridColumn: '1/-1' }}>
            <label style={s.fl}>Titre *</label>
            <input
                style={s.fi}
                placeholder="ex: 2025 Python Samedi 10H"
                value={titre}
                onChange={e => setTitre(e.target.value)}
            />
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Type</label>
            <select style={s.fi} value={type} onChange={e => setType(e.target.value)}>
                <option value="GROUPE">Groupe</option>
                <option value="INTRO">Leçon introductive</option>
                <option value="INTENSIF">Intensif</option>
                <option value="INDIVIDUEL">Individuel</option>
            </select>
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Lieu</label>
            <input
                style={s.fi}
                placeholder="ex: Thionville, Metz"
                value={lieu}
                onChange={e => setLieu(e.target.value)}
            />
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Format</label>
            <select style={s.fi} value={format} onChange={e => setFormat(e.target.value)}>
                <option value="OFFLINE">Présentiel</option>
                <option value="ONLINE">En ligne</option>
                <option value="HYBRIDE">Hybride</option>
            </select>
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Statut</label>
            <select style={s.fi} value={statut} onChange={e => setStatut(e.target.value)}>
                <option value="INSCRIPTION">Inscription en cours</option>
                <option value="ACTIF">Actif</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="TERMINE">Terminé</option>
            </select>
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Enseignant</label>
            <select style={s.fi} value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                <option value="">— Aucun —</option>
                {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                ))}
            </select>
        </div>
        <div style={s.fg}>
            <label style={s.fl}>Superviseur</label>
            <select style={s.fi} value={supervisorId} onChange={e => setSupervisorId(e.target.value)}>
                <option value="">— Aucun —</option>
                {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                ))}
            </select>
        </div>
    </div>
);

export default function Groups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterFormat, setFilterFormat] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    // Form fields as separate states to fix cursor bug
    const [titre, setTitre] = useState('');
    const [lieu, setLieu] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [supervisorId, setSupervisorId] = useState('');
    const [statut, setStatut] = useState('INSCRIPTION');
    const [format, setFormat] = useState('OFFLINE');
    const [type, setType] = useState('GROUPE');

    const resetForm = () => {
        setTitre(''); setLieu(''); setTeacherId('');
        setSupervisorId(''); setStatut('INSCRIPTION');
        setFormat('OFFLINE'); setType('GROUPE');
    };

    const loadEditForm = (group) => {
        setTitre(group.titre || '');
        setLieu(group.lieu || '');
        setTeacherId(group.teacher?.id?.toString() || '');
        setSupervisorId(group.supervisor?.id?.toString() || '');
        setStatut(group.statut || 'INSCRIPTION');
        setFormat(group.format || 'OFFLINE');
        setType(group.type || 'GROUPE');
    };

    const getFormData = () => ({ titre, lieu, teacherId, supervisorId, statut, format, type });

    useEffect(() => { fetchGroups(); fetchTeachers(); }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/auth/teachers');
            setTeachers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        if (!titre) return alert('Le titre est obligatoire');
        try {
            await api.post('/groups', getFormData());
            setShowAdd(false);
            resetForm();
            fetchGroups();
        } catch (err) { alert('Erreur création'); }
    };

    const openEdit = (group) => {
        setSelectedGroup(group);
        loadEditForm(group);
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!titre) return alert('Le titre est obligatoire');
        try {
            await api.put(`/groups/${selectedGroup.id}`, getFormData());
            setShowEdit(false);
            setSelectedGroup(null);
            fetchGroups();
        } catch (err) { alert('Erreur modification'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce groupe ?')) return;
        try {
            await api.delete(`/groups/${id}`);
            fetchGroups();
        } catch (err) { alert('Erreur : ' + err.response?.data?.message); }
    };

    const openStudents = async (group) => {
        try {
            const res = await api.get(`/groups/${group.id}`);
            setSelectedGroup(res.data);
            setShowStudents(true);
        } catch (err) { console.error(err); }
    };

    const statusConfig = {
        ACTIF: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'Actif' },
        INSCRIPTION: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: 'Inscription en cours' },
        SUSPENDU: { bg: 'rgba(255,59,92,0.12)', color: '#CC0033', label: 'Suspendu' },
        TERMINE: { bg: '#F3F4F6', color: '#6B7280', label: 'Terminé' },
    };

    const formatConfig = {
        ONLINE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'En ligne' },
        OFFLINE: { bg: '#F3F4F6', color: '#6B7280', label: 'Présentiel' },
        HYBRIDE: { bg: 'rgba(33,150,243,0.12)', color: '#0069C0', label: 'Hybride' },
    };

    const typeLabels = {
        GROUPE: 'Groupe', INTRO: 'Leçon intro',
        INTENSIF: 'Intensif', INDIVIDUEL: 'Individuel',
    };

    const filtered = groups.filter(g => {
        const teacherName = `${g.teacher?.prenom || ''} ${g.teacher?.nom || ''}`.toLowerCase();
        const matchSearch = g.titre.toLowerCase().includes(search.toLowerCase()) ||
            teacherName.includes(search.toLowerCase()) ||
            (g.lieu || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || g.statut === filterStatus;
        const matchTeacher = !filterTeacher || g.teacherId === parseInt(filterTeacher);
        const matchFormat = !filterFormat || g.format === filterFormat;
        return matchSearch && matchStatus && matchTeacher && matchFormat;
    });

    const formProps = {
        titre, setTitre, lieu, setLieu, teacherId, setTeacherId,
        supervisorId, setSupervisorId, statut, setStatut,
        format, setFormat, type, setType, teachers,
    };

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>🏫 Groupes</h1>
                {canAdd && (
                    <button style={s.btnP} onClick={() => { resetForm(); setShowAdd(true); }}>
                        + Ajouter
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div style={s.filtersRow}>
                <div style={s.searchBox}>
                    <span>🔍</span>
                    <input style={s.searchInput}
                           placeholder="Rechercher groupe, enseignant, lieu..."
                           value={search}
                           onChange={e => setSearch(e.target.value)} />
                </div>
                <select style={s.filterSelect} value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    <option value="ACTIF">Actif</option>
                    <option value="INSCRIPTION">Inscription en cours</option>
                    <option value="SUSPENDU">Suspendu</option>
                    <option value="TERMINE">Terminé</option>
                </select>
                <select style={s.filterSelect} value={filterTeacher}
                        onChange={e => setFilterTeacher(e.target.value)}>
                    <option value="">Tous les enseignants</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                    ))}
                </select>
                <select style={s.filterSelect} value={filterFormat}
                        onChange={e => setFilterFormat(e.target.value)}>
                    <option value="">Tous les formats</option>
                    <option value="OFFLINE">Présentiel</option>
                    <option value="ONLINE">En ligne</option>
                    <option value="HYBRIDE">Hybride</option>
                </select>
                <span style={s.countBadge}>{filtered.length} groupe(s)</span>
            </div>

            {/* Table */}
            <div style={s.tw}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                        <thead>
                        <tr>
                            {['ID', 'Titre', 'Enseignant', 'Étudiants', 'Lieu', 'Type', 'Statut', 'Format', 'Actions'].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={s.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" style={s.tdCenter}>Aucun groupe trouvé</td></tr>
                        ) : filtered.map(g => (
                            <tr key={g.id} style={s.tr}>
                                <td style={s.tdMuted}>{g.id}</td>
                                <td style={s.tdLink} onClick={() => openStudents(g)}>{g.titre}</td>
                                <td style={s.td}>
                                    {g.teacher ? (
                                        <div style={s.teacherCell}>
                                            <div style={s.teacherAvatar}>
                                                {g.teacher.prenom?.[0]}{g.teacher.nom?.[0]}
                                            </div>
                                            <span>{g.teacher.prenom} {g.teacher.nom}</span>
                                        </div>
                                    ) : <span style={s.noTeacher}>Non assigné</span>}
                                </td>
                                <td style={s.td}>
                    <span style={s.countPill} onClick={() => openStudents(g)}>
                      👥 {g._count?.enrollments || 0}
                    </span>
                                </td>
                                <td style={s.td}>{g.lieu || '—'}</td>
                                <td style={s.td}>
                    <span style={{
                        ...s.pill,
                        background: g.type === 'GROUPE' ? '#1A1040' : '#F3F4F6',
                        color: g.type === 'GROUPE' ? '#fff' : '#6B7280',
                    }}>
                      {typeLabels[g.type]}
                    </span>
                                </td>
                                <td style={s.td}>
                    <span style={{ ...s.pill, background: statusConfig[g.statut]?.bg, color: statusConfig[g.statut]?.color }}>
                      {statusConfig[g.statut]?.label}
                    </span>
                                </td>
                                <td style={s.td}>
                    <span style={{ ...s.pill, background: formatConfig[g.format]?.bg, color: formatConfig[g.format]?.color }}>
                      {formatConfig[g.format]?.label}
                    </span>
                                </td>
                                <td style={s.td}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {canAdd && (
                                            <button style={s.btnEdit} onClick={() => openEdit(g)}>✏️</button>
                                        )}
                                        <button style={s.btnView} onClick={() => openStudents(g)}>👥</button>
                                        {user?.role === 'ADMIN' && (
                                            <button style={s.btnDel} onClick={() => handleDelete(g.id)}>🗑️</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Ajouter */}
            {showAdd && (
                <div style={s.modalBg} onClick={() => setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>➕ Ajouter un groupe</h2>
                        <FormFields {...formProps} />
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={s.btnP} onClick={handleAdd}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modifier */}
            {showEdit && selectedGroup && (
                <div style={s.modalBg} onClick={() => setShowEdit(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>✏️ Modifier le groupe</h2>
                        <div style={s.groupInfoBox}>
                            <span style={s.groupId}>#{selectedGroup.id}</span>
                            <span style={s.groupName}>{selectedGroup.titre}</span>
                        </div>
                        <FormFields {...formProps} />
                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEdit(false)}>Annuler</button>
                            <button style={s.btnP} onClick={handleEdit}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Étudiants */}
            {showStudents && selectedGroup && (
                <div style={s.modalBg} onClick={() => setShowStudents(false)}>
                    <div style={{ ...s.modal, width: '720px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>👥 {selectedGroup.titre}</h2>

                        <div style={s.groupDetails}>
                            {[
                                { label: '👩‍🏫 Enseignant', val: selectedGroup.teacher ? `${selectedGroup.teacher.prenom} ${selectedGroup.teacher.nom}` : '—' },
                                { label: '📍 Lieu', val: selectedGroup.lieu || '—' },
                                { label: '👥 Étudiants', val: selectedGroup.enrollments?.length || 0 },
                                { label: '🧑‍💼 Superviseur', val: selectedGroup.supervisor ? `${selectedGroup.supervisor.prenom} ${selectedGroup.supervisor.nom}` : '—' },
                                { label: '📊 Statut', val: statusConfig[selectedGroup.statut]?.label },
                                { label: '💻 Format', val: formatConfig[selectedGroup.format]?.label },
                            ].map((item, i) => (
                                <div key={i} style={s.groupDetailItem}>
                                    <div style={s.gdLabel}>{item.label}</div>
                                    <div style={s.gdVal}>{item.val}</div>
                                </div>
                            ))}
                        </div>

                        {selectedGroup.enrollments?.length === 0 ? (
                            <div style={s.empty}>Aucun étudiant dans ce groupe</div>
                        ) : (
                            <table style={s.table}>
                                <thead>
                                <tr>
                                    {['#', 'Nom & Prénom', 'Login', 'Âge', 'Parent', 'Inscrit le'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {selectedGroup.enrollments?.map((e, i) => (
                                    <tr key={e.id} style={s.tr}>
                                        <td style={s.tdMuted}>{i + 1}</td>
                                        <td style={s.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={s.miniAvatar}>
                                                    {e.student?.user?.prenom?.[0]}{e.student?.user?.nom?.[0]}
                                                </div>
                                                <span style={{ fontWeight: '700', fontSize: '13px' }}>
                            {e.student?.user?.prenom} {e.student?.user?.nom}
                          </span>
                                            </div>
                                        </td>
                                        <td style={s.tdMono}>{e.student?.user?.login}</td>
                                        <td style={s.td}>{e.student?.age || '—'}</td>
                                        <td style={s.td}>{e.student?.parentNom || '—'}</td>
                                        <td style={s.tdMuted}>
                                            {new Date(e.createdAt).toLocaleDateString('fr-FR', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
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
    ph: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    btnP: { padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnEdit: { padding: '5px 10px', background: '#EDE8FF', border: 'none', borderRadius: '6px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnView: { padding: '5px 10px', background: '#ECFDF5', border: 'none', borderRadius: '6px', color: '#008060', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnDel: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', color: '#CC0033', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    filtersRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    filterSelect: { padding: '7px 12px', border: '1.5px solid #E5E0F5', borderRadius: '8px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    countBadge: { fontSize: '12px', color: '#6B7280', fontWeight: '700', whiteSpace: 'nowrap' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040', verticalAlign: 'middle' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280', verticalAlign: 'middle' },
    tdLink: { padding: '10px 14px', fontSize: '13px', color: '#5B2EE8', fontWeight: '700', cursor: 'pointer', verticalAlign: 'middle' },
    tdMono: { padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#1A1040', verticalAlign: 'middle' },
    tdCenter: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    teacherCell: { display: 'flex', alignItems: 'center', gap: '8px' },
    teacherAvatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    noTeacher: { color: '#9CA3AF', fontStyle: 'italic', fontSize: '12px' },
    countPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '50px', background: '#EDE8FF', color: '#5B2EE8', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '620px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    groupInfoBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F6FF', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' },
    groupId: { background: '#EDE8FF', color: '#5B2EE8', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' },
    groupName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    groupDetails: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' },
    groupDetailItem: { background: '#F8F6FF', borderRadius: '10px', padding: '12px' },
    gdLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' },
    gdVal: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    miniAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    empty: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
};