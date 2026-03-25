import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Students() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [form, setForm] = useState({
        nom: '', prenom: '', age: '',
        parentNom: '', parentTel: '', parentEmail: '',
    });

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!form.prenom || !form.nom) {
            alert('Le nom et prénom sont obligatoires');
            return;
        }
        try {
            const res = await api.post('/students', form);
            setCredentials(res.data.credentials);
            setForm({ nom: '', prenom: '', age: '', parentNom: '', parentTel: '', parentEmail: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    // Générer preview login
    const previewLogin = () => {
        if (!form.prenom && !form.nom) return '';
        const clean = str => str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '.');
        return `${clean(form.prenom)}.${clean(form.nom)}`;
    };

    const filtered = students.filter(s =>
        `${s.user?.prenom} ${s.user?.nom}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>👥 Étudiants</h1>
                {canAdd && (
                    <button style={styles.btnP} onClick={() => { setShowModal(true); setCredentials(null); }}>
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
                            {['ID', 'Prénom', 'Nom', 'Login', 'Âge', 'Parent', 'Groupe'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={styles.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="7" style={styles.tdCenter}>Aucun étudiant trouvé</td></tr>
                        ) : (
                            filtered.map(s => (
                                <tr key={s.id} style={styles.tr}>
                                    <td style={styles.tdMuted}>{s.id}</td>
                                    <td style={styles.tdLink}>{s.user?.prenom}</td>
                                    <td style={styles.td}>{s.user?.nom}</td>
                                    <td style={styles.tdMono}>{s.user?.login}</td>
                                    <td style={styles.td}>{s.age || '—'}</td>
                                    <td style={styles.td}>{s.parentNom || '—'}</td>
                                    <td style={styles.td}>
                                        {s.enrollments?.length > 0
                                            ? s.enrollments[0].group?.titre
                                            : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div style={styles.modalBg} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>

                        {/* Credentials view après création */}
                        {credentials ? (
                            <div>
                                <div style={styles.successIcon}>✅</div>
                                <h2 style={styles.modalTitle}>Étudiant créé !</h2>
                                <p style={{ color: '#6B7280', marginBottom: '20px', textAlign: 'center' }}>
                                    Voici les identifiants de connexion :
                                </p>
                                <div style={styles.credBox}>
                                    <div style={styles.credTitle}>🔑 Identifiants générés automatiquement</div>
                                    <div style={styles.credRow}>
                                        <span style={styles.credKey}>Login :</span>
                                        <span style={styles.credVal}>{credentials.login}</span>
                                    </div>
                                    <div style={styles.credRow}>
                                        <span style={styles.credKey}>Mot de passe :</span>
                                        <span style={styles.credVal}>{credentials.password}</span>
                                    </div>
                                </div>
                                <p style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
                                    📋 Notez ces identifiants — le mot de passe ne sera plus affiché
                                </p>
                                <div style={styles.modalFoot}>
                                    <button style={styles.btnP} onClick={() => {
                                        setShowModal(false);
                                        setCredentials(null);
                                    }}>Fermer</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 style={styles.modalTitle}>Ajouter un étudiant</h2>

                                {/* Preview login */}
                                {(form.prenom || form.nom) && (
                                    <div style={styles.loginPreview}>
                    <span style={{ fontSize: '12px', color: '#5B2EE8', fontWeight: '700' }}>
                      🔑 Login généré :
                    </span>
                                        <span style={styles.loginPreviewVal}>{previewLogin()}</span>
                                    </div>
                                )}

                                <div style={styles.section}>
                                    <div style={styles.sectionTitle}>Étudiant</div>
                                    <div style={styles.formGrid}>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Prénom <span style={{ color: 'red' }}>*</span></label>
                                            <input style={styles.fi} placeholder="Prénom"
                                                   value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                                        </div>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Nom <span style={{ color: 'red' }}>*</span></label>
                                            <input style={styles.fi} placeholder="Nom de famille"
                                                   value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                                        </div>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Âge</label>
                                            <input style={styles.fi} type="number" placeholder="ex: 10"
                                                   value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.section}>
                                    <div style={styles.sectionTitle}>Parent</div>
                                    <div style={styles.formGrid}>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Nom du parent</label>
                                            <input style={styles.fi} placeholder="Nom complet"
                                                   value={form.parentNom} onChange={e => setForm({ ...form, parentNom: e.target.value })} />
                                        </div>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Téléphone</label>
                                            <input style={styles.fi} placeholder="+213 5X XX XX XX"
                                                   value={form.parentTel} onChange={e => setForm({ ...form, parentTel: e.target.value })} />
                                        </div>
                                        <div style={styles.fg}>
                                            <label style={styles.fl}>Email parent</label>
                                            <input style={styles.fi} type="email" placeholder="parent@email.com"
                                                   value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.modalFoot}>
                                    <button style={styles.btnO} onClick={() => setShowModal(false)}>Annuler</button>
                                    <button style={styles.btnP} onClick={handleCreate}>Créer</button>
                                </div>
                            </div>
                        )}
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
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
    section: { marginBottom: '20px' },
    sectionTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF' },
    loginPreview: { background: '#EDE8FF', border: '1.5px solid #C4B5FD', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    loginPreviewVal: { fontFamily: 'monospace', fontSize: '14px', fontWeight: '800', color: '#5B2EE8' },
    credBox: { background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '20px', marginBottom: '8px' },
    credTitle: { fontSize: '12px', fontWeight: '800', color: '#5B2EE8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(91,46,232,0.1)' },
    credKey: { color: '#6B7280', fontWeight: '600', fontSize: '13px' },
    credVal: { fontFamily: 'monospace', fontSize: '16px', fontWeight: '800', color: '#5B2EE8' },
    successIcon: { textAlign: 'center', fontSize: '48px', marginBottom: '12px' },
};