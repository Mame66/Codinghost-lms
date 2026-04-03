import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Students() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [showPassword, setShowPassword] = useState({});

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newCredentials, setNewCredentials] = useState(null);

    const [addForm, setAddForm] = useState({
        nom: '', prenom: '', age: '',
        parentNom: '', parentTel: '', parentEmail: '', groupId: '',
    });

    const [editForm, setEditForm] = useState({
        nom: '', prenom: '', age: '',
        parentNom: '', parentTel: '', parentEmail: '',
        groupId: '', resetPassword: false,
    });

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => { fetchStudents(); fetchGroups(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        if (!addForm.prenom || !addForm.nom) return alert('Nom et prénom obligatoires');
        try {
            const res = await api.post('/students', addForm);
            setNewCredentials(res.data.credentials);
            setShowAdd(false);
            setShowCredentials(true);
            setAddForm({ nom: '', prenom: '', age: '', parentNom: '', parentTel: '', parentEmail: '', groupId: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur création');
        }
    };

    const openEdit = (student) => {
        setSelectedStudent(student);
        setEditForm({
            nom: student.user?.nom || '',
            prenom: student.user?.prenom || '',
            age: student.age || '',
            parentNom: student.parentNom || '',
            parentTel: student.parentTel || '',
            parentEmail: student.parentEmail || '',
            groupId: student.enrollments?.[0]?.group?.id || '',
            resetPassword: false,
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!editForm.prenom || !editForm.nom) return alert('Nom et prénom obligatoires');
        try {
            const res = await api.put(`/students/${selectedStudent.id}/full`, editForm);
            if (res.data.newPassword) {
                setNewCredentials({ login: res.data.login, password: res.data.newPassword });
                setShowEdit(false);
                setShowCredentials(true);
            } else {
                setShowEdit(false);
                alert('✅ Étudiant mis à jour !');
            }
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur modification');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet étudiant ?')) return;
        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
        } catch (err) { alert('Erreur suppression'); }
    };

    const togglePassword = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const previewLogin = (prenom, nom) => {
        if (!prenom && !nom) return '';
        const clean = str => str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '.');
        return `${clean(prenom || '')}.${clean(nom || '')}`;
    };

    const filtered = students.filter(s => {
        const name = `${s.user?.prenom} ${s.user?.nom}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) ||
            s.user?.login?.toLowerCase().includes(search.toLowerCase());
        const matchGroup = !filterGroup || s.enrollments?.[0]?.group?.id === parseInt(filterGroup);
        return matchSearch && matchGroup;
    });

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>👥 Étudiants</h1>
                {canAdd && (
                    <button style={s.btnP} onClick={() => { setShowAdd(true); setNewCredentials(null); }}>
                        + Ajouter
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={s.filters}>
                <div style={s.searchBox}>
                    <span>🔍</span>
                    <input style={s.searchInput} placeholder="Rechercher nom, prénom, login..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select style={s.filterSelect} value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}>
                    <option value="">Tous les groupes</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
                <span style={s.countBadge}>{filtered.length} étudiant(s)</span>
            </div>

            {/* Table */}
            <div style={s.tw}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                        <thead>
                        <tr>
                            {['ID', 'Prénom', 'Nom', 'Login',
                                ...(isAdmin ? ['Mot de passe'] : []),
                                'Âge', 'Groupe', 'Parent', 'Actions'].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={s.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" style={s.tdCenter}>Aucun étudiant trouvé</td></tr>
                        ) : filtered.map(st => (
                            <tr key={st.id} style={s.tr}>
                                <td style={s.tdMuted}>{st.id}</td>
                                <td style={s.tdLink} onClick={() => openEdit(st)}>{st.user?.prenom}</td>
                                <td style={s.td}>{st.user?.nom}</td>
                                <td style={s.tdMono}>{st.user?.login}</td>
                                {isAdmin && (
                                    <td style={s.td}>
                                        <div style={s.passRow}>
                        <span style={s.passVal}>
                          {showPassword[st.id]
                              ? (st.user?.plainPassword || '—')
                              : '••••••••'}
                        </span>
                                            <button style={s.eyeBtn} onClick={() => togglePassword(st.id)}>
                                                {showPassword[st.id] ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </td>
                                )}
                                <td style={s.td}>{st.age || '—'}</td>
                                <td style={s.td}>
                                    {st.enrollments?.length > 0 ? (
                                        <span style={s.groupPill}>
                        🏫 {st.enrollments[0].group?.titre}
                      </span>
                                    ) : (
                                        <span style={s.noGroup}>Sans groupe</span>
                                    )}
                                </td>
                                <td style={s.td}>{st.parentNom || '—'}</td>
                                <td style={s.td}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button style={s.btnEdit} onClick={() => openEdit(st)}>✏️</button>
                                        {isAdmin && (
                                            <button style={s.btnDel} onClick={() => handleDelete(st.id)}>🗑️</button>
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
                        <h2 style={s.modalTitle}>➕ Ajouter un étudiant</h2>

                        {(addForm.prenom || addForm.nom) && (
                            <div style={s.loginPreview}>
                                <span style={{ fontSize: '12px', color: '#5B2EE8', fontWeight: '700' }}>🔑 Login :</span>
                                <span style={s.loginPreviewVal}>{previewLogin(addForm.prenom, addForm.nom)}</span>
                            </div>
                        )}

                        <div style={s.sectionTitle}>👤 Étudiant</div>
                        <div style={s.formGrid}>
                            <div style={s.fg}>
                                <label style={s.fl}>Prénom *</label>
                                <input style={s.fi} placeholder="Prénom"
                                       value={addForm.prenom}
                                       onChange={e => setAddForm({ ...addForm, prenom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Nom *</label>
                                <input style={s.fi} placeholder="Nom"
                                       value={addForm.nom}
                                       onChange={e => setAddForm({ ...addForm, nom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Âge</label>
                                <input style={s.fi} type="number" placeholder="ex: 10"
                                       value={addForm.age}
                                       onChange={e => setAddForm({ ...addForm, age: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.sectionTitle}>🏫 Groupe</div>
                        <div style={s.fg}>
                            <label style={s.fl}>Assigner à un groupe</label>
                            <select style={s.fi} value={addForm.groupId}
                                    onChange={e => setAddForm({ ...addForm, groupId: e.target.value })}>
                                <option value="">— Aucun groupe —</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                            </select>
                        </div>

                        <div style={s.sectionTitle}>👨‍👩‍👧 Parent</div>
                        <div style={s.formGrid}>
                            <div style={s.fg}>
                                <label style={s.fl}>Nom du parent</label>
                                <input style={s.fi} placeholder="Nom complet"
                                       value={addForm.parentNom}
                                       onChange={e => setAddForm({ ...addForm, parentNom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Téléphone</label>
                                <input style={s.fi} placeholder="+33 X XX XX XX XX"
                                       value={addForm.parentTel}
                                       onChange={e => setAddForm({ ...addForm, parentTel: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Email parent</label>
                                <input style={s.fi} type="email" placeholder="parent@email.com"
                                       value={addForm.parentEmail}
                                       onChange={e => setAddForm({ ...addForm, parentEmail: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={s.btnP} onClick={handleAdd}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modifier */}
            {showEdit && selectedStudent && (
                <div style={s.modalBg} onClick={() => setShowEdit(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>✏️ Modifier l'étudiant</h2>

                        <div style={s.studentInfoBox}>
                            <div style={s.studentAvatar}>
                                {selectedStudent.user?.prenom?.[0]}{selectedStudent.user?.nom?.[0]}
                            </div>
                            <div>
                                <div style={s.studentName}>
                                    {selectedStudent.user?.prenom} {selectedStudent.user?.nom}
                                </div>
                                <div style={s.studentLogin}>🔑 {selectedStudent.user?.login}</div>
                                {isAdmin && selectedStudent.user?.plainPassword && (
                                    <div style={s.studentPass}>
                                        🔐 {selectedStudent.user.plainPassword}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={s.sectionTitle}>👤 Informations</div>
                        <div style={s.formGrid}>
                            <div style={s.fg}>
                                <label style={s.fl}>Prénom *</label>
                                <input style={s.fi} placeholder="Prénom"
                                       value={editForm.prenom}
                                       onChange={e => setEditForm({ ...editForm, prenom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Nom *</label>
                                <input style={s.fi} placeholder="Nom"
                                       value={editForm.nom}
                                       onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Âge</label>
                                <input style={s.fi} type="number"
                                       value={editForm.age}
                                       onChange={e => setEditForm({ ...editForm, age: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.sectionTitle}>🏫 Groupe</div>
                        <div style={s.fg}>
                            <label style={s.fl}>Groupe assigné</label>
                            <select style={s.fi} value={editForm.groupId}
                                    onChange={e => setEditForm({ ...editForm, groupId: e.target.value })}>
                                <option value="">— Aucun groupe —</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                            </select>
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                💡 L'étudiant verra uniquement les cours de ce groupe
              </span>
                        </div>

                        <div style={s.sectionTitle}>👨‍👩‍👧 Parent</div>
                        <div style={s.formGrid}>
                            <div style={s.fg}>
                                <label style={s.fl}>Nom du parent</label>
                                <input style={s.fi} placeholder="Nom complet"
                                       value={editForm.parentNom}
                                       onChange={e => setEditForm({ ...editForm, parentNom: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Téléphone</label>
                                <input style={s.fi} placeholder="+33 X XX XX XX XX"
                                       value={editForm.parentTel}
                                       onChange={e => setEditForm({ ...editForm, parentTel: e.target.value })} />
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Email parent</label>
                                <input style={s.fi} type="email"
                                       value={editForm.parentEmail}
                                       onChange={e => setEditForm({ ...editForm, parentEmail: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.sectionTitle}>🔑 Mot de passe</div>
                        <div style={s.resetPassBox}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>
                                    Réinitialiser le mot de passe
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                    Un nouveau mot de passe sera généré automatiquement
                                </div>
                            </div>
                            <div style={{
                                ...s.toggleSlider,
                                background: editForm.resetPassword ? '#5B2EE8' : '#E5E7EB',
                                cursor: 'pointer',
                            }} onClick={() => setEditForm({ ...editForm, resetPassword: !editForm.resetPassword })}>
                                <div style={{
                                    ...s.toggleThumb,
                                    transform: editForm.resetPassword ? 'translateX(20px)' : 'translateX(2px)',
                                }} />
                            </div>
                        </div>

                        {editForm.resetPassword && (
                            <div style={s.resetWarning}>
                                ⚠️ Un nouveau mot de passe sera généré. Notez-le bien !
                            </div>
                        )}

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowEdit(false)}>Annuler</button>
                            <button style={s.btnP} onClick={handleEdit}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Credentials */}
            {showCredentials && newCredentials && (
                <div style={s.modalBg} onClick={() => setShowCredentials(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>✅</div>
                        <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Identifiants de connexion</h2>
                        <p style={{ color: '#6B7280', marginBottom: '20px', textAlign: 'center', fontSize: '13px' }}>
                            Transmettez ces identifiants à l'étudiant
                        </p>
                        <div style={s.credBox}>
                            <div style={s.credTitle}>🔑 Identifiants générés automatiquement</div>
                            <div style={s.credRow}>
                                <span style={s.credKey}>Login :</span>
                                <span style={s.credVal}>{newCredentials.login}</span>
                            </div>
                            <div style={s.credRow}>
                                <span style={s.credKey}>Mot de passe :</span>
                                <span style={s.credVal}>{newCredentials.password}</span>
                            </div>
                        </div>
                        <p style={{ color: '#FF5C35', fontSize: '12px', textAlign: 'center', marginTop: '12px', fontWeight: '700' }}>
                            ⚠️ Notez ce mot de passe — il sera toujours visible dans la liste admin
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button style={{ ...s.btnO, flex: 1 }} onClick={() => {
                                navigator.clipboard.writeText(`Login: ${newCredentials.login}\nMot de passe: ${newCredentials.password}`);
                                alert('✅ Copié !');
                            }}>📋 Copier</button>
                            <button style={{ ...s.btnP, flex: 1 }} onClick={() => setShowCredentials(false)}>Fermer</button>
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
    btnDel: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', color: '#CC0033', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    filters: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '6px 12px', flex: 1, maxWidth: '320px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    filterSelect: { padding: '7px 12px', border: '1.5px solid #E5E0F5', borderRadius: '8px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    countBadge: { fontSize: '12px', color: '#6B7280', fontWeight: '700', marginLeft: 'auto' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040', verticalAlign: 'middle' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280', verticalAlign: 'middle' },
    tdLink: { padding: '10px 14px', fontSize: '13px', color: '#5B2EE8', fontWeight: '700', cursor: 'pointer', verticalAlign: 'middle' },
    tdMono: { padding: '10px 14px', fontSize: '12px', color: '#1A1040', fontFamily: 'monospace', verticalAlign: 'middle' },
    tdCenter: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    passRow: { display: 'flex', alignItems: 'center', gap: '6px' },
    passVal: { fontFamily: 'monospace', fontSize: '12px', color: '#1A1040', fontWeight: '700' },
    eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px' },
    groupPill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8' },
    noGroup: { fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
    sectionTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px', marginTop: '16px', paddingBottom: '6px', borderBottom: '1px solid #E5E0F5' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '4px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    loginPreview: { background: '#EDE8FF', border: '1.5px solid #C4B5FD', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    loginPreviewVal: { fontFamily: 'monospace', fontSize: '14px', fontWeight: '800', color: '#5B2EE8' },
    studentInfoBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '10px', padding: '14px', marginBottom: '16px' },
    studentAvatar: { width: '44px', height: '44px', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: '800', flexShrink: 0 },
    studentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    studentLogin: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    studentPass: { fontSize: '12px', color: '#008060', fontWeight: '700', marginTop: '2px', fontFamily: 'monospace' },
    resetPassBox: { display: 'flex', alignItems: 'center', gap: '16px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
    toggleSlider: { width: '44px', height: '24px', borderRadius: '50px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
    toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
    resetWarning: { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', marginBottom: '10px', fontWeight: '600' },
    credBox: { background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '20px' },
    credTitle: { fontSize: '12px', fontWeight: '800', color: '#5B2EE8', marginBottom: '12px', textTransform: 'uppercase' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(91,46,232,0.1)' },
    credKey: { color: '#6B7280', fontWeight: '600', fontSize: '13px' },
    credVal: { fontFamily: 'monospace', fontSize: '16px', fontWeight: '800', color: '#5B2EE8' },
};