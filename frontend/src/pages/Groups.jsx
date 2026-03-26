import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Groups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showStudents, setShowStudents] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    const emptyForm = {
        titre: '', teacherId: '', supervisorId: '',
        lieu: '', statut: 'INSCRIPTION', format: 'OFFLINE', type: 'GROUPE',
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchTeachers = async () => {
        try {
            // On récupère tous les users et filtre les enseignants
            const res = await api.get('/auth/teachers');
            setTeachers(res.data);
        } catch (err) {
            console.error(err);
            setTeachers([]);
        }
    };

    const handleAdd = async () => {
        if (!form.titre) return alert('Le titre est obligatoire');
        try {
            await api.post('/groups', form);
            setShowAdd(false);
            setForm(emptyForm);
            fetchGroups();
        } catch (err) {
            alert('Erreur lors de la création');
        }
    };

    const openEdit = (group) => {
        setSelectedGroup(group);
        setForm({
            titre: group.titre || '',
            teacherId: group.teacher?.id || '',
            supervisorId: group.supervisor?.id || '',
            lieu: group.lieu || '',
            statut: group.statut || 'INSCRIPTION',
            format: group.format || 'OFFLINE',
            type: group.type || 'GROUPE',
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!form.titre) return alert('Le titre est obligatoire');
        try {
            await api.put(`/groups/${selectedGroup.id}`, form);
            setShowEdit(false);
            setSelectedGroup(null);
            fetchGroups();
        } catch (err) {
            alert('Erreur lors de la modification');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce groupe ?')) return;
        try {
            await api.delete(`/groups/${id}`);
            fetchGroups();
        } catch (err) {
            alert('Erreur suppression : ' + err.response?.data?.message);
        }
    };

    const openStudents = (group) => {
        setSelectedGroup(group);
        setShowStudents(true);
    };

    const filtered = groups.filter(g =>
        g.titre.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors = {
        ACTIF: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'Actif' },
        INSCRIPTION: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: 'Inscription en cours' },
        SUSPENDU: { bg: 'rgba(255,59,92,0.12)', color: '#CC0033', label: 'Suspendu' },
        TERMINE: { bg: '#F3F4F6', color: '#6B7280', label: 'Terminé' },
    };

    const formatColors = {
        ONLINE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'En ligne' },
        OFFLINE: { bg: '#F3F4F6', color: '#6B7280', label: 'Hors ligne' },
        HYBRIDE: { bg: 'rgba(33,150,243,0.12)', color: '#0069C0', label: 'Hybride' },
    };

    const typeLabels = {
        GROUPE: 'Groupe', INTRO: 'Leçon intro',
        INTENSIF: 'Intensif', INDIVIDUEL: 'Individuel',
    };

    const FormFields = ({ f, setF }) => (
        <>
            <div style={styles.formGrid}>
                <div style={{ ...styles.fg, gridColumn: '1/-1' }}>
                    <label style={styles.fl}>Titre <span style={{ color: 'red' }}>*</span></label>
                    <input style={styles.fi} placeholder="ex: 2025 Python Samedi 10H"
                           value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} />
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Type</label>
                    <select style={styles.fi} value={f.type}
                            onChange={e => setF({ ...f, type: e.target.value })}>
                        <option value="GROUPE">Groupe</option>
                        <option value="INTRO">Leçon introductive</option>
                        <option value="INTENSIF">Intensif</option>
                        <option value="INDIVIDUEL">Individuel</option>
                    </select>
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Lieu</label>
                    <input style={styles.fi} placeholder="ex: Alger Centre"
                           value={f.lieu} onChange={e => setF({ ...f, lieu: e.target.value })} />
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Format</label>
                    <select style={styles.fi} value={f.format}
                            onChange={e => setF({ ...f, format: e.target.value })}>
                        <option value="OFFLINE">Hors ligne</option>
                        <option value="ONLINE">En ligne</option>
                        <option value="HYBRIDE">Hybride</option>
                    </select>
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Statut</label>
                    <select style={styles.fi} value={f.statut}
                            onChange={e => setF({ ...f, statut: e.target.value })}>
                        <option value="INSCRIPTION">Inscription en cours</option>
                        <option value="ACTIF">Actif</option>
                        <option value="SUSPENDU">Suspendu</option>
                        <option value="TERMINE">Terminé</option>
                    </select>
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Enseignant</label>
                    <select style={styles.fi} value={f.teacherId}
                            onChange={e => setF({ ...f, teacherId: e.target.value })}>
                        <option value="">— Aucun —</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.prenom} {t.nom}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.fg}>
                    <label style={styles.fl}>Superviseur</label>
                    <select style={styles.fi} value={f.supervisorId}
                            onChange={e => setF({ ...f, supervisorId: e.target.value })}>
                        <option value="">— Aucun —</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.prenom} {t.nom}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    );

    return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>🏫 Groupes</h1>
                {canAdd && (
                    <button style={styles.btnP} onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
                        + Ajouter
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={styles.tw}>
                <div style={styles.tc}>
                    <div style={styles.search}>
                        <span>🔍</span>
                        <input style={styles.searchInput} type="text"
                               placeholder="Rechercher un groupe..."
                               value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <span style={styles.count}>{filtered.length} groupe(s)</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            {['ID', 'Titre', 'Enseignant', 'Étudiants', 'Lieu', 'Type', 'Statut', 'Format', 'Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={styles.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" style={styles.tdCenter}>Aucun groupe trouvé</td></tr>
                        ) : (
                            filtered.map(g => (
                                <tr key={g.id} style={styles.tr}>
                                    <td style={styles.tdMuted}>{g.id}</td>
                                    <td style={styles.tdLink} onClick={() => openStudents(g)}>{g.titre}</td>
                                    <td style={styles.td}>
                                        {g.teacher
                                            ? `${g.teacher.prenom} ${g.teacher.nom}`
                                            : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Non assigné</span>}
                                    </td>
                                    <td style={styles.td}>
                      <span
                          style={styles.countBadge}
                          onClick={() => openStudents(g)}
                      >
                        👥 {g._count?.enrollments || 0}
                      </span>
                                    </td>
                                    <td style={styles.td}>{g.lieu || '—'}</td>
                                    <td style={styles.td}>
                      <span style={{
                          ...styles.pill,
                          background: g.type === 'GROUPE' ? '#1A1040' : '#F3F4F6',
                          color: g.type === 'GROUPE' ? '#fff' : '#6B7280',
                      }}>
                        {typeLabels[g.type]}
                      </span>
                                    </td>
                                    <td style={styles.td}>
                      <span style={{
                          ...styles.pill,
                          background: statusColors[g.statut]?.bg,
                          color: statusColors[g.statut]?.color,
                      }}>
                        {statusColors[g.statut]?.label}
                      </span>
                                    </td>
                                    <td style={styles.td}>
                      <span style={{
                          ...styles.pill,
                          background: formatColors[g.format]?.bg,
                          color: formatColors[g.format]?.color,
                      }}>
                        {formatColors[g.format]?.label}
                      </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {canAdd && (
                                                <button style={styles.btnEdit} onClick={() => openEdit(g)}>
                                                    ✏️
                                                </button>
                                            )}
                                            <button style={styles.btnView} onClick={() => openStudents(g)}>
                                                👥
                                            </button>
                                            {user?.role === 'ADMIN' && (
                                                <button style={styles.btnDel} onClick={() => handleDelete(g.id)}>
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== MODAL AJOUTER ===== */}
            {showAdd && (
                <div style={styles.modalBg} onClick={() => setShowAdd(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>➕ Ajouter un groupe</h2>
                        <FormFields f={form} setF={setForm} />
                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={handleAdd}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL MODIFIER ===== */}
            {showEdit && selectedGroup && (
                <div style={styles.modalBg} onClick={() => setShowEdit(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>✏️ Modifier le groupe</h2>
                        <div style={styles.groupInfoBox}>
                            <span style={styles.groupId}>#{selectedGroup.id}</span>
                            <span style={styles.groupName}>{selectedGroup.titre}</span>
                        </div>
                        <FormFields f={form} setF={setForm} />
                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowEdit(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={handleEdit}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL ÉTUDIANTS ===== */}
            {showStudents && selectedGroup && (
                <div style={styles.modalBg} onClick={() => setShowStudents(false)}>
                    <div style={{ ...styles.modal, width: '700px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>
                            👥 Étudiants — {selectedGroup.titre}
                        </h2>
                        <div style={styles.groupStats}>
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>{selectedGroup._count?.enrollments || 0}</div>
                                <div style={styles.statLbl}>Étudiants</div>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>
                                    {selectedGroup.teacher
                                        ? `${selectedGroup.teacher.prenom} ${selectedGroup.teacher.nom}`
                                        : '—'}
                                </div>
                                <div style={styles.statLbl}>Enseignant</div>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statVal}>{selectedGroup.lieu || '—'}</div>
                                <div style={styles.statLbl}>Lieu</div>
                            </div>
                        </div>

                        {selectedGroup.enrollments?.length === 0 ? (
                            <div style={styles.empty}>
                                Aucun étudiant dans ce groupe
                            </div>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                <tr>
                                    {['#', 'Prénom', 'Nom', 'Login', 'Âge'].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {selectedGroup.enrollments?.map((e, i) => (
                                    <tr key={e.id} style={styles.tr}>
                                        <td style={styles.tdMuted}>{i + 1}</td>
                                        <td style={styles.tdLink}>{e.student?.user?.prenom}</td>
                                        <td style={styles.td}>{e.student?.user?.nom}</td>
                                        <td style={styles.tdMono}>{e.student?.user?.login}</td>
                                        <td style={styles.td}>{e.student?.age || '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}

                        <div style={styles.modalFoot}>
                            <button style={styles.btnP} onClick={() => setShowStudents(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    ph: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    btnP: { padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnEdit: { padding: '5px 10px', background: '#EDE8FF', border: 'none', borderRadius: '6px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnView: { padding: '5px 10px', background: '#ECFDF5', border: 'none', borderRadius: '6px', color: '#008060', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnDel: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', color: '#CC0033', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    tc: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #E5E0F5' },
    search: { display: 'flex', alignItems: 'center', gap: '6px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '6px 12px', flex: 1, maxWidth: '300px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    count: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginLeft: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280' },
    tdLink: { padding: '10px 14px', fontSize: '13px', color: '#5B2EE8', fontWeight: '700', cursor: 'pointer' },
    tdMono: { padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#1A1040' },
    tdCenter: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    countBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '50px', background: '#EDE8FF', color: '#5B2EE8', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
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
    groupStats: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' },
    statItem: { background: '#F8F6FF', borderRadius: '10px', padding: '12px', textAlign: 'center' },
    statVal: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040' },
    statLbl: { fontSize: '11px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    empty: { textAlign: 'center', padding: '30px', color: '#6B7280', fontSize: '13px' },
};