import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Groups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        titre: '', lieu: '', statut: 'INSCRIPTION',
        format: 'OFFLINE', type: 'GROUPE',
    });

    const canAdd = ['ADMIN', 'TEACHER'].includes(user?.role);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        try {
            await api.post('/groups', form);
            setShowModal(false);
            setForm({ titre: '', lieu: '', statut: 'INSCRIPTION', format: 'OFFLINE', type: 'GROUPE' });
            fetchGroups();
        } catch (err) {
            alert('Erreur lors de la création');
        }
    };

    const filtered = groups.filter(g =>
        g.titre.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors = {
        ACTIF: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'Actif' },
        INSCRIPTION: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: 'Inscription en cours' },
        SUSPENDU: { bg: 'rgba(255,59,92,0.12)', color: '#CC0033', label: 'Suspendu' },
        TERMINE: { bg: 'rgba(107,114,128,0.12)', color: '#374151', label: 'Terminé' },
    };

    const formatColors = {
        ONLINE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'En ligne' },
        OFFLINE: { bg: '#F3F4F6', color: '#6B7280', label: 'Hors ligne' },
        HYBRIDE: { bg: 'rgba(33,150,243,0.12)', color: '#0069C0', label: 'Hybride' },
    };

    return (
        <div>
            {/* Header */}
            <div style={styles.ph}>
                <h1 style={styles.h1}>🏫 Groupes</h1>
                {canAdd && (
                    <button style={styles.btnP} onClick={() => setShowModal(true)}>
                        + Ajouter
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={styles.tw}>
                {/* Search bar */}
                <div style={styles.tc}>
                    <div style={styles.search}>
                        <span>🔍</span>
                        <input
                            style={styles.searchInput}
                            type="text"
                            placeholder="Rechercher un groupe..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <span style={styles.count}>
            {filtered.length} groupe(s)
          </span>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            {['ID', 'Titre', 'Lieu', 'Cours', 'Enseignant', 'Type', 'Statut', 'Format'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={styles.tdCenter}>Chargement...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={styles.tdCenter}>Aucun groupe trouvé</td></tr>
                        ) : (
                            filtered.map(g => (
                                <tr key={g.id} style={styles.tr}>
                                    <td style={styles.tdMuted}>{g.id}</td>
                                    <td style={styles.tdLink}>{g.titre}</td>
                                    <td style={styles.td}>{g.lieu || '—'}</td>
                                    <td style={styles.td}>{g.course?.titre || '—'}</td>
                                    <td style={styles.td}>
                                        {g.teacher ? `${g.teacher.prenom} ${g.teacher.nom}` : '—'}
                                    </td>
                                    <td style={styles.td}>
                      <span style={{
                          ...styles.pill,
                          background: g.type === 'GROUPE' ? '#1A1040' : '#F3F4F6',
                          color: g.type === 'GROUPE' ? '#fff' : '#6B7280',
                      }}>
                        {g.type === 'GROUPE' ? 'Groupe' :
                            g.type === 'INTRO' ? 'Leçon intro' :
                                g.type === 'INTENSIF' ? 'Intensif' : 'Individuel'}
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
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL Ajouter groupe */}
            {showModal && (
                <div style={styles.modalBg} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Ajouter un groupe</h2>

                        <div style={styles.modalGrid}>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Titre <span style={{ color: 'red' }}>*</span></label>
                                <input style={styles.fi} placeholder="Titre du groupe"
                                       value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Type</label>
                                <select style={styles.fi} value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="GROUPE">Groupe</option>
                                    <option value="INTRO">Leçon introductive</option>
                                    <option value="INTENSIF">Intensif</option>
                                    <option value="INDIVIDUEL">Individuel</option>
                                </select>
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Lieu</label>
                                <input style={styles.fi} placeholder="ex: Alger Centre"
                                       value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} />
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Format</label>
                                <select style={styles.fi} value={form.format}
                                        onChange={e => setForm({ ...form, format: e.target.value })}>
                                    <option value="OFFLINE">Hors ligne</option>
                                    <option value="ONLINE">En ligne</option>
                                    <option value="HYBRIDE">Hybride</option>
                                </select>
                            </div>
                            <div style={styles.fg}>
                                <label style={styles.fl}>Statut</label>
                                <select style={styles.fi} value={form.statut}
                                        onChange={e => setForm({ ...form, statut: e.target.value })}>
                                    <option value="INSCRIPTION">Inscription en cours</option>
                                    <option value="ACTIF">Actif</option>
                                    <option value="SUSPENDU">Suspendu</option>
                                    <option value="TERMINE">Terminé</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setShowModal(false)}>Annuler</button>
                            <button style={styles.btnP} onClick={handleCreate}>Créer</button>
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
    tdCenter: { padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    pill: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '600px', maxWidth: '95vw' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '24px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF' },
};