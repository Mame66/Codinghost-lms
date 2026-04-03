import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    // Form fields outside to fix cursor bug
    const [studentId, setStudentId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [montant, setMontant] = useState('');
    const [description, setDescription] = useState('');
    const [statut, setStatut] = useState('EN_ATTENTE');

    const resetForm = () => {
        setStudentId(''); setGroupId(''); setMontant('');
        setDescription(''); setStatut('EN_ATTENTE');
    };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [pRes, gRes, sRes] = await Promise.all([
                api.get('/payments'),
                api.get('/groups'),
                api.get('/students'),
            ]);
            setPayments(pRes.data);
            setGroups(gRes.data);
            setStudents(sRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const addPayment = async () => {
        if (!studentId || !groupId || !montant) {
            return alert('Étudiant, groupe et montant sont obligatoires');
        }
        try {
            await api.post('/payments', { studentId, groupId, montant, description, statut, devise: 'EUR' });
            setShowAdd(false);
            resetForm();
            fetchAll();
        } catch (err) { alert('Erreur création'); }
    };

    const updateStatut = async (id, newStatut) => {
        try {
            await api.put(`/payments/${id}`, { statut: newStatut });
            fetchAll();
        } catch (err) { alert('Erreur mise à jour'); }
    };

    const deletePayment = async (id) => {
        if (!window.confirm('Supprimer ce paiement ?')) return;
        try {
            await api.delete(`/payments/${id}`);
            fetchAll();
        } catch (err) { alert('Erreur suppression'); }
    };

    const statusConfig = {
        PAYE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: '✅ Payé' },
        EN_ATTENTE: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: '⏳ En attente' },
        RETARD: { bg: 'rgba(255,59,92,0.12)', color: '#CC0033', label: '🔴 En retard' },
    };

    const filtered = payments.filter(p => {
        const matchFilter = filter === 'ALL' || p.statut === filter;
        const name = `${p.student?.user?.prenom} ${p.student?.user?.nom}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) ||
            p.group?.titre?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const totalMontant = payments.reduce((a, b) => a + (b.montant || 0), 0);
    const totalPaye = payments.filter(p => p.statut === 'PAYE').reduce((a, b) => a + (b.montant || 0), 0);
    const totalAttente = payments.filter(p => p.statut === 'EN_ATTENTE').reduce((a, b) => a + (b.montant || 0), 0);
    const totalRetard = payments.filter(p => p.statut === 'RETARD').reduce((a, b) => a + (b.montant || 0), 0);

    const counts = {
        ALL: payments.length,
        PAYE: payments.filter(p => p.statut === 'PAYE').length,
        EN_ATTENTE: payments.filter(p => p.statut === 'EN_ATTENTE').length,
        RETARD: payments.filter(p => p.statut === 'RETARD').length,
    };

    const fmt = (amount) => `${amount.toFixed(2).replace('.', ',')} €`;

    return (
        <div>
            <div style={s.ph}>
                <div>
                    <h1 style={s.h1}>💰 Paiements</h1>
                    <div style={s.schoolInfo}>
                        📍 Présentiel : Thionville & Metz · 📧 contact@codinghost.fr · 📞 07 49 26 10 17
                    </div>
                </div>
                <button style={s.btnP} onClick={() => { resetForm(); setShowAdd(true); }}>+ Ajouter</button>
            </div>

            {/* Stats */}
            <div style={s.statsGrid}>
                {[
                    { icon: '💰', label: 'Total facturé', val: fmt(totalMontant), color: '#1A1040', bg: '#F8F6FF' },
                    { icon: '✅', label: 'Total reçu', val: fmt(totalPaye), color: '#008060', bg: '#ECFDF5' },
                    { icon: '⏳', label: 'En attente', val: fmt(totalAttente), color: '#8B6200', bg: 'rgba(255,184,0,0.08)' },
                    { icon: '🔴', label: 'En retard', val: fmt(totalRetard), color: '#CC0033', bg: 'rgba(255,59,92,0.08)' },
                ].map((st, i) => (
                    <div key={i} style={{ ...s.statCard, background: st.bg }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{st.icon}</div>
                        <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                        <div style={s.statLbl}>{st.label}</div>
                    </div>
                ))}
            </div>

            {/* Taux paiement */}
            {totalMontant > 0 && (
                <div style={s.progressCard}>
                    <div style={s.progressHeader}>
                        <span style={s.progressTitle}>Taux de paiement</span>
                        <span style={s.progressPct}>{Math.round((totalPaye / totalMontant) * 100)}%</span>
                    </div>
                    <div style={s.progressBar}>
                        <div style={{
                            ...s.progressFill,
                            width: `${Math.round((totalPaye / totalMontant) * 100)}%`,
                        }} />
                    </div>
                    <div style={s.progressLabels}>
            <span style={{ color: '#008060', fontSize: '12px', fontWeight: '700' }}>
              {fmt(totalPaye)} payé
            </span>
                        <span style={{ color: '#6B7280', fontSize: '12px' }}>
              {fmt(totalMontant - totalPaye)} restant
            </span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div style={s.toolbar}>
                <div style={s.ftabs}>
                    {[
                        { key: 'ALL', label: 'Tous' },
                        { key: 'PAYE', label: '✅ Payés' },
                        { key: 'EN_ATTENTE', label: '⏳ En attente' },
                        { key: 'RETARD', label: '🔴 En retard' },
                    ].map(f => (
                        <button key={f.key}
                                style={{ ...s.ft, ...(filter === f.key ? s.ftOn : {}) }}
                                onClick={() => setFilter(f.key)}>
                            {f.label} <span style={s.fc}>{counts[f.key] ?? payments.length}</span>
                        </button>
                    ))}
                </div>
                <div style={s.searchBox}>
                    <span>🔍</span>
                    <input style={s.searchInput} placeholder="Rechercher étudiant ou groupe..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div style={s.tw}>
                {loading ? (
                    <div style={s.empty}>Chargement...</div>
                ) : filtered.length === 0 ? (
                    <div style={s.empty}>Aucun paiement trouvé</div>
                ) : (
                    <table style={s.table}>
                        <thead>
                        <tr>
                            {['Étudiant', 'Groupe', 'Montant', 'Description', 'Date', 'Statut', 'Action'].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(p => {
                            const sc = statusConfig[p.statut] || statusConfig.EN_ATTENTE;
                            return (
                                <tr key={p.id} style={s.tr}>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={s.avatar}>
                                                {p.student?.user?.prenom?.[0]}{p.student?.user?.nom?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1A1040' }}>
                                                    {p.student?.user?.prenom} {p.student?.user?.nom}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={s.td}>
                                        <span style={s.groupPill}>🏫 {p.group?.titre}</span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={s.montantBadge}>{fmt(p.montant || 0)}</span>
                                    </td>
                                    <td style={s.tdMuted}>{p.description || '—'}</td>
                                    <td style={s.tdMuted}>
                                        {new Date(p.createdAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td style={s.td}>
                                        <select
                                            style={{ ...s.statusSelect, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44` }}
                                            value={p.statut}
                                            onChange={e => updateStatut(p.id, e.target.value)}
                                        >
                                            <option value="EN_ATTENTE">⏳ En attente</option>
                                            <option value="PAYE">✅ Payé</option>
                                            <option value="RETARD">🔴 En retard</option>
                                        </select>
                                    </td>
                                    <td style={s.td}>
                                        <button style={s.btnDel} onClick={() => deletePayment(p.id)}>🗑️</button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Add */}
            {showAdd && (
                <div style={s.modalBg} onClick={() => setShowAdd(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>➕ Nouveau paiement</h2>

                        <div style={s.fg}>
                            <label style={s.fl}>Étudiant *</label>
                            <select style={s.fi} value={studentId} onChange={e => setStudentId(e.target.value)}>
                                <option value="">— Choisir un étudiant —</option>
                                {students.map(st => (
                                    <option key={st.id} value={st.id}>
                                        {st.user?.prenom} {st.user?.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={s.fg}>
                            <label style={s.fl}>Groupe *</label>
                            <select style={s.fi} value={groupId} onChange={e => setGroupId(e.target.value)}>
                                <option value="">— Choisir un groupe —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.titre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={s.formGrid}>
                            <div style={s.fg}>
                                <label style={s.fl}>Montant (€) *</label>
                                <div style={s.inputWithUnit}>
                                    <input style={{ ...s.fi, paddingRight: '40px' }} type="number"
                                           placeholder="ex: 150" value={montant}
                                           onChange={e => setMontant(e.target.value)} />
                                    <span style={s.unit}>€</span>
                                </div>
                            </div>
                            <div style={s.fg}>
                                <label style={s.fl}>Statut</label>
                                <select style={s.fi} value={statut} onChange={e => setStatut(e.target.value)}>
                                    <option value="EN_ATTENTE">⏳ En attente</option>
                                    <option value="PAYE">✅ Payé</option>
                                    <option value="RETARD">🔴 En retard</option>
                                </select>
                            </div>
                        </div>

                        <div style={s.fg}>
                            <label style={s.fl}>Description</label>
                            <input style={s.fi} placeholder="ex: Mensualité Avril 2026"
                                   value={description} onChange={e => setDescription(e.target.value)} />
                        </div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={s.btnP} onClick={addPayment}>Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', marginBottom: '4px' },
    schoolInfo: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    btnP: { padding: '8px 18px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0 },
    btnO: { padding: '8px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnDel: { padding: '5px 10px', background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '16px' },
    statCard: { border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px', textAlign: 'center' },
    statVal: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', marginBottom: '2px' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    progressCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
    progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    progressTitle: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    progressPct: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#5B2EE8' },
    progressBar: { height: '8px', background: '#F3F4F6', borderRadius: '50px', overflow: 'hidden', marginBottom: '6px' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg,#5B2EE8,#00C48C)', borderRadius: '50px', transition: 'width 0.5s' },
    progressLabels: { display: 'flex', justifyContent: 'space-between' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' },
    ftabs: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    ft: { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#6B7280', border: 'none' },
    ftOn: { background: '#EDE8FF', color: '#5B2EE8' },
    fc: { display: 'inline-block', marginLeft: '4px', background: 'rgba(91,46,232,0.12)', color: '#5B2EE8', borderRadius: '50px', padding: '0 5px', fontSize: '10px' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '6px 12px', minWidth: '220px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    empty: { padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040', verticalAlign: 'middle' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280', verticalAlign: 'middle' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    groupPill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8' },
    montantBadge: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    statusSelect: { padding: '5px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '95vw' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    inputWithUnit: { position: 'relative' },
    unit: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '800', color: '#5B2EE8' },
};