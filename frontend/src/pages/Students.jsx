import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Students() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);

    // Selected student
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newCredentials, setNewCredentials] = useState(null);

    // Add form
    const [addForm, setAddForm] = useState({
        nom: '', prenom: '', age: '',
        parentNom: '', parentTel: '', parentEmail: '',
        groupId: '',
    });

    // Edit form
    const [editForm, setEditForm] = useState({
        nom: '', prenom: '', age: '',
        parentNom: '', parentTel: '', parentEmail: '',
        groupId: '',
        resetPassword: false,
    });

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    useEffect(() => {
        fetchStudents();
        fetchGroups();
    }, []);

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

    // ===== ADD STUDENT =====
    const handleAdd = async () => {
        if (!addForm.prenom || !addForm.nom) {
            alert('Le nom et prénom sont obligatoires');
            return;
        }
        try {
            const res = await api.post('/students', addForm);
            setNewCredentials(res.data.credentials);
            setShowAdd(false);
            setShowCredentials(true);
            setAddForm({ nom: '', prenom: '', age: '', parentNom: '', parentTel: '', parentEmail: '', groupId: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    // ===== EDIT STUDENT =====
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
        if (!editForm.prenom || !editForm.nom) {
            alert('Le nom et prénom sont obligatoires');
            return;
        }
        try {
            const res = await api.put(`/students/${selectedStudent.id}/full`, editForm);
            if (res.data.newPassword) {
                setNewCredentials({
                    login: res.data.login,
                    password: res.data.newPassword,
                });
                setShowEdit(false);
                setShowCredentials(true);
            } else {
                setShowEdit(false);
                alert('✅ Étudiant mis à jour avec succès !');
            }
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    // ===== DELETE STUDENT =====
    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet étudiant ?')) return;
        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
        } catch (err) {
            alert('Erreur suppression');
        }
    };

    // Preview login
    const previewLogin = (prenom, nom) => {
        if (!prenom && !nom) return '';
        const clean = str => str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '.');
        return `${clean(prenom)}.${clean(nom)}`;
    };

    const filtered = students.filter(s =>
        `${s.user?.prenom} ${s.user?.nom}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>👥 Étudiants</h1>
                {canAdd && (
                    <button style={styles.btnP} onClick={() => { setShowAdd(true); setNewCredentials(null); }}>
                        + Ajouter
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={styles.tw}>
                <div style={styles.tc}>
                    <div style={styles.search}>
                        <span>🔍</span>
                        <input
                            style={styles.searchInput}
                            type="text"
                            placeholder="Rechercher un étudiant..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <span style={styles.count}>{filtered.length} étudiant(s)</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            {['ID', 'Prénom', 'Nom', 'Login', 'Âge', 'Groupe', 'Parent', 'Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={styles.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={styles.tdCenter}>Aucun étudiant trouvé</td></tr>
                        ) : (
                            filtered.map(s => (
                                <tr key={s.id} style={styles.tr}>
                                    <td style={styles.tdMuted}>{s.id}</td>
                                    <td style={styles.tdLink} onClick={() => openEdit(s)}>{s.user?.prenom}</td>
                                    <td style={styles.td}>{s.user?.nom}</td>
                                    <td style={styles.tdMono}>{s.user?.login}</td>
                                    <td style={styles.td}>{s.age || '—'}</td>
                                    <td style={styles.td}>
                                        {s.enrollments?.length > 0 ? (
                                            <span style={styles.groupPill}>
                          🏫 {s.enrollments[0].group?.titre}
                        </span>
                                        ) : (
                                            <span style={styles.noGroup}>Aucun groupe</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{s.parentNom || '—'}</td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button style={styles.btnEdit} onClick={() => openEdit(s)}>
                                                ✏️ Modifier
                                            </button>
                                            {user?.role === 'ADMIN' && (
                                                <button style={styles.btnDel} onClick={() => handleDelete(s.id)}>
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
                        <h2 style={styles.modalTitle}>➕ Ajouter un étudiant</h2>

                        {(addForm.prenom || addForm.nom) && (
                            <div style={styles.loginPreview}>
                <span style={{ fontSize: '12px', color: '#5B2EE8', fontWeight: '700' }}>
                  🔑 Login généré :
                </span>
                                <span style={styles.loginPreviewVal}>
                  {previewLogin(addForm.prenom, addForm.nom)}
                </span>
                            </div>
                        )}

                        <div style={styles.sectionTitle}>👤 Étudiant</div>
                        <div style={styles.formGrid}>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Prénom <span style={{ color: 'red' }}>*</span></label>
                                <input style={styles.fi} placeholder="Prénom"
                                       value={addForm.prenom}
                                       onChange={e => setAddForm({ ...addForm, prenom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Nom <span style={{ color: 'red' }}>*</span></label>
                                <input style={styles.fi} placeholder="Nom de famille"
                                       value={addForm.nom}
                                       onChange={e => setAddForm({ ...addForm, nom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Âge</label>
                                <input style={styles.fi} type="number" placeholder="ex: 10"
                                       value={addForm.age}
                                       onChange={e => setAddForm({ ...addForm, age: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.sectionTitle}>🏫 Groupe</div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Assigner à un groupe</label>
                            <select style={styles.fi}
                                    value={addForm.groupId}
                                    onChange={e => setAddForm({ ...addForm, groupId: e.target.value })}>
                                <option value="">— Aucun groupe —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.titre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.sectionTitle}>👨‍👩‍👧 Parent</div>
                        <div style={styles.formGrid}>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Nom du parent</label>
                                <input style={styles.fi} placeholder="Nom complet"
                                       value={addForm.parentNom}
                                       onChange={e => setAddForm({ ...addForm, parentNom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Téléphone</label>
                                <input style={styles.fi} placeholder="+213 5X XX XX XX"
                                       value={addForm.parentTel}
                                       onChange={e => setAddForm({ ...addForm, parentTel: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Email parent</label>
                                <input style={styles.fi} type="email" placeholder="parent@email.com"
                                       value={addForm.parentEmail}
                                       onChange={e => setAddForm({ ...addForm, parentEmail: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={handleAdd}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL MODIFIER ===== */}
            {showEdit && selectedStudent && (
                <div style={styles.modalBg} onClick={() => setShowEdit(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>✏️ Modifier l'étudiant</h2>

                        <div style={styles.studentInfoBox}>
                            <div style={styles.studentAvatar}>👤</div>
                            <div>
                                <div style={styles.studentName}>
                                    {selectedStudent.user?.prenom} {selectedStudent.user?.nom}
                                </div>
                                <div style={styles.studentLogin}>
                                    🔑 Login : <strong>{selectedStudent.user?.login}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={styles.sectionTitle}>👤 Informations</div>
                        <div style={styles.formGrid}>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Prénom <span style={{ color: 'red' }}>*</span></label>
                                <input style={styles.fi} placeholder="Prénom"
                                       value={editForm.prenom}
                                       onChange={e => setEditForm({ ...editForm, prenom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Nom <span style={{ color: 'red' }}>*</span></label>
                                <input style={styles.fi} placeholder="Nom de famille"
                                       value={editForm.nom}
                                       onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Âge</label>
                                <input style={styles.fi} type="number" placeholder="ex: 10"
                                       value={editForm.age}
                                       onChange={e => setEditForm({ ...editForm, age: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.sectionTitle}>🏫 Groupe</div>
                        <div style={styles.fg}>
                            <label style={styles.fl}>Assigner à un groupe</label>
                            <select style={styles.fi}
                                    value={editForm.groupId}
                                    onChange={e => setEditForm({ ...editForm, groupId: e.target.value })}>
                                <option value="">— Aucun groupe —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.titre}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                💡 L'étudiant ne verra que les cours et exercices de ce groupe
              </span>
                        </div>

                        <div style={styles.sectionTitle}>👨‍👩‍👧 Parent</div>
                        <div style={styles.formGrid}>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Nom du parent</label>
                                <input style={styles.fi} placeholder="Nom complet"
                                       value={editForm.parentNom}
                                       onChange={e => setEditForm({ ...editForm, parentNom: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Téléphone</label>
                                <input style={styles.fi} placeholder="+213 5X XX XX XX"
                                       value={editForm.parentTel}
                                       onChange={e => setEditForm({ ...editForm, parentTel: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Email parent</label>
                                <input style={styles.fi} type="email" placeholder="parent@email.com"
                                       value={editForm.parentEmail}
                                       onChange={e => setEditForm({ ...editForm, parentEmail: e.target.value })} />
                            </div>
                        </div>

                        <div style={styles.sectionTitle}>🔑 Mot de passe</div>
                        <div style={styles.resetPassBox}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>
                                    Réinitialiser le mot de passe
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                    Un nouveau mot de passe sera généré automatiquement
                                </div>
                            </div>
                            <label style={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={editForm.resetPassword}
                                    onChange={e => setEditForm({ ...editForm, resetPassword: e.target.checked })}
                                    style={{ display: 'none' }}
                                />
                                <div style={{
                                    ...styles.toggleSlider,
                                    background: editForm.resetPassword ? '#5B2EE8' : '#E5E7EB',
                                }}>
                                    <div style={{
                                        ...styles.toggleThumb,
                                        transform: editForm.resetPassword ? 'translateX(20px)' : 'translateX(2px)',
                                    }} />
                                </div>
                            </label>
                        </div>

                        {editForm.resetPassword && (
                            <div style={styles.resetWarning}>
                                ⚠️ Un nouveau mot de passe sera généré. Notez-le bien car il ne sera affiché qu'une seule fois.
                            </div>
                        )}

                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowEdit(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={handleEdit}>💾 Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL CREDENTIALS ===== */}
            {showCredentials && newCredentials && (
                <div style={styles.modalBg} onClick={() => setShowCredentials(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>✅</div>
                        <h2 style={{ ...styles.modalTitle, textAlign: 'center' }}>
                            Identifiants de connexion
                        </h2>
                        <p style={{ color: '#6B7280', marginBottom: '20px', textAlign: 'center', fontSize: '13px' }}>
                            Transmettez ces identifiants à l'étudiant
                        </p>

                        <div style={styles.credBox}>
                            <div style={styles.credTitle}>🔑 Identifiants générés automatiquement</div>
                            <div style={styles.credRow}>
                                <span style={styles.credKey}>Login :</span>
                                <span style={styles.credVal}>{newCredentials.login}</span>
                            </div>
                            <div style={styles.credRow}>
                                <span style={styles.credKey}>Mot de passe :</span>
                                <span style={styles.credVal}>{newCredentials.password}</span>
                            </div>
                        </div>

                        <p style={{ color: '#FF5C35', fontSize: '12px', textAlign: 'center', marginTop: '12px', fontWeight: '700' }}>
                            ⚠️ Notez ce mot de passe — il ne sera plus affiché après fermeture
                        </p>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button style={{ ...styles.btnO, flex: 1 }} onClick={() => {
                                navigator.clipboard.writeText(`Login: ${newCredentials.login}\nMot de passe: ${newCredentials.password}`);
                                alert('✅ Identifiants copiés !');
                            }}>
                                📋 Copier
                            </button>
                            <button style={{ ...styles.btnP, flex: 1 }} onClick={() => setShowCredentials(false)}>
                                Fermer
                            </button>
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
    btnEdit: { padding: '5px 12px', background: '#EDE8FF', border: 'none', borderRadius: '6px', color: '#5B2EE8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
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
    tdMono: { padding: '10px 14px', fontSize: '12px', color: '#1A1040', fontFamily: 'monospace' },
    tdCenter: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    groupPill: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8' },
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
    studentAvatar: { width: '44px', height: '44px', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    studentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    studentLogin: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    resetPassBox: { display: 'flex', alignItems: 'center', gap: '16px', background: '#F8F6FF', border: '1.5px solid #E5E0F5', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
    toggle: { cursor: 'pointer', flexShrink: 0 },
    toggleSlider: { width: '44px', height: '24px', borderRadius: '50px', position: 'relative', transition: 'background 0.2s' },
    toggleThumb: { position: 'absolute', top: '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
    resetWarning: { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', marginBottom: '10px', fontWeight: '600' },
    credBox: { background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '20px' },
    credTitle: { fontSize: '12px', fontWeight: '800', color: '#5B2EE8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(91,46,232,0.1)' },
    credKey: { color: '#6B7280', fontWeight: '600', fontSize: '13px' },
    credVal: { fontFamily: 'monospace', fontSize: '16px', fontWeight: '800', color: '#5B2EE8' },
};