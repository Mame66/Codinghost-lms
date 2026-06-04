import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Ic, ActionBtn, IconBadge } from '../components/Icons';

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const [studentId, setStudentId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [montant, setMontant] = useState('');
    const [description, setDescription] = useState('');
    const [statut, setStatut] = useState('EN_ATTENTE');

    const resetForm = () => { setStudentId(''); setGroupId(''); setMontant(''); setDescription(''); setStatut('EN_ATTENTE'); };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [pRes, gRes, sRes] = await Promise.all([api.get('/payments'), api.get('/groups'), api.get('/students')]);
            setPayments(pRes.data); setGroups(gRes.data); setStudents(sRes.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };
    const addPayment = async () => {
        if (!studentId || !groupId || !montant) return alert('Étudiant, groupe et montant obligatoires');
        try { await api.post('/payments', { studentId, groupId, montant, description, statut, devise: 'EUR' }); setShowAdd(false); resetForm(); fetchAll(); }
        catch { alert('Erreur création'); }
    };
    const updateStatut = async (id, newStatut) => { try { await api.put(`/payments/${id}`, { statut: newStatut }); fetchAll(); } catch { alert('Erreur mise à jour'); } };
    const deletePayment = async (id) => { if (!window.confirm('Supprimer ce paiement ?')) return; try { await api.delete(`/payments/${id}`); fetchAll(); } catch { alert('Erreur suppression'); } };

    const statusConfig = {
        PAYE:       { bg: 'rgba(0,196,140,0.12)',  color: '#008060', label: 'Payé',       icon: 'check_circle' },
        EN_ATTENTE: { bg: 'rgba(255,184,0,0.15)',  color: '#8B6200', label: 'En attente', icon: 'clock' },
        RETARD:     { bg: 'rgba(255,59,92,0.12)',  color: '#CC0033', label: 'En retard',  icon: 'alert' },
    };

    const filtered = payments.filter(p => {
        const matchFilter = filter === 'ALL' || p.statut === filter;
        const name = `${p.student?.user?.prenom} ${p.student?.user?.nom}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) || p.group?.titre?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const totalMontant = payments.reduce((a, b) => a + (b.montant || 0), 0);
    const totalPaye    = payments.filter(p => p.statut === 'PAYE').reduce((a, b) => a + (b.montant || 0), 0);
    const totalAttente = payments.filter(p => p.statut === 'EN_ATTENTE').reduce((a, b) => a + (b.montant || 0), 0);
    const totalRetard  = payments.filter(p => p.statut === 'RETARD').reduce((a, b) => a + (b.montant || 0), 0);
    const counts = { ALL: payments.length, PAYE: payments.filter(p => p.statut === 'PAYE').length, EN_ATTENTE: payments.filter(p => p.statut === 'EN_ATTENTE').length, RETARD: payments.filter(p => p.statut === 'RETARD').length };
    const fmt = (v) => `${v.toFixed(2).replace('.', ',')} €`;

    const statsCards = [
        { icon: 'coin',        label: 'Total facturé', val: fmt(totalMontant), color: '#1A1040',  bg: '#F8F6FF' },
        { icon: 'check_circle',label: 'Total reçu',    val: fmt(totalPaye),    color: '#008060',  bg: '#ECFDF5' },
        { icon: 'clock',       label: 'En attente',    val: fmt(totalAttente), color: '#8B6200',  bg: 'rgba(255,184,0,0.08)' },
        { icon: 'alert',       label: 'En retard',     val: fmt(totalRetard),  color: '#CC0033',  bg: 'rgba(255,59,92,0.08)' },
    ];

    const filterTabs = [
        { key: 'ALL',       label: 'Tous',       icon: 'money' },
        { key: 'PAYE',      label: 'Payés',      icon: 'check_circle' },
        { key: 'EN_ATTENTE',label: 'En attente', icon: 'clock' },
        { key: 'RETARD',    label: 'En retard',  icon: 'alert' },
    ];

    return (
        <div>
            <div style={s.ph}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IconBadge icon="money" color="#008060" bg="#ECFDF5" size={36} iconSize={18} />
                        <h1 style={s.h1}>Paiements</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '4px', marginLeft: '46px' }}>
                        <Ic name="location" size={12} color="#9CA3AF" /> Thionville & Metz
                        <span style={{ color: '#D1D5DB' }}>·</span>
                        <Ic name="mail" size={12} color="#9CA3AF" /> contact@codinghost.fr
                        <span style={{ color: '#D1D5DB' }}>·</span>
                        <Ic name="phone" size={12} color="#9CA3AF" /> 07 49 26 10 17
                    </div>
                </div>
                <button style={s.btnP} onClick={() => { resetForm(); setShowAdd(true); }}>
                    <Ic name="add" size={14} color="#fff" /> Ajouter
                </button>
            </div>

            {/* Stats */}
            <div style={s.statsGrid}>
                {statsCards.map((st, i) => (
                    <div key={i} style={{ ...s.statCard, background: st.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <IconBadge icon={st.icon} color={st.color} bg={`${st.bg}`} size={34} iconSize={17} />
                            <div style={s.statLbl}>{st.label}</div>
                        </div>
                        <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            {totalMontant > 0 && (
                <div style={s.progressCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ic name="trending_up" size={15} color="#5B2EE8" />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>Taux de paiement</span>
                        </div>
                        <span style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#5B2EE8' }}>
                            {Math.round((totalPaye / totalMontant) * 100)}%
                        </span>
                    </div>
                    <div style={s.progressBar}>
                        <div style={{ ...s.progressFill, width: `${Math.round((totalPaye / totalMontant) * 100)}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ color: '#008060', fontSize: '12px', fontWeight: '700' }}>{fmt(totalPaye)} payé</span>
                        <span style={{ color: '#6B7280', fontSize: '12px' }}>{fmt(totalMontant - totalPaye)} restant</span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {filterTabs.map(f => (
                        <button key={f.key} style={{ ...s.ft, ...(filter === f.key ? s.ftOn : {}) }} onClick={() => setFilter(f.key)}>
                            <Ic name={f.icon} size={13} color={filter === f.key ? '#5B2EE8' : '#6B7280'} />
                            {f.label}
                            <span style={{ ...s.fc, background: filter === f.key ? '#5B2EE8' : '#E5E7EB', color: filter === f.key ? '#fff' : '#6B7280' }}>{counts[f.key]}</span>
                        </button>
                    ))}
                </div>
                <div style={s.searchBox}>
                    <Ic name="search" size={15} color="#9CA3AF" />
                    <input style={s.searchInput} placeholder="Rechercher étudiant ou groupe..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div style={s.tw}>
                {loading ? <div style={s.empty}>Chargement...</div>
                    : filtered.length === 0 ? <div style={s.empty}>Aucun paiement trouvé</div>
                        : (
                            <table style={s.table}>
                                <thead><tr>{['Étudiant', 'Groupe', 'Montant', 'Description', 'Date', 'Statut', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {filtered.map(p => {
                                    const sc = statusConfig[p.statut] || statusConfig.EN_ATTENTE;
                                    return (
                                        <tr key={p.id} style={s.tr}>
                                            <td style={s.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={s.avatar}>{p.student?.user?.prenom?.[0]}{p.student?.user?.nom?.[0]}</div>
                                                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{p.student?.user?.prenom} {p.student?.user?.nom}</span>
                                                </div>
                                            </td>
                                            <td style={s.td}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', background: '#EDE8FF', color: '#5B2EE8' }}>
                                            {p.group?.titre}
                                        </span>
                                            </td>
                                            <td style={s.td}>
                                                <span style={{ fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' }}>{fmt(p.montant || 0)}</span>
                                            </td>
                                            <td style={s.tdMuted}>{p.description || '—'}</td>
                                            <td style={s.tdMuted}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Ic name="calendar" size={12} color="#9CA3AF" />
                                                    {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td style={s.td}>
                                                <select style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}
                                                        value={p.statut} onChange={e => updateStatut(p.id, e.target.value)}>
                                                    <option value="EN_ATTENTE">En attente</option>
                                                    <option value="PAYE">Payé</option>
                                                    <option value="RETARD">En retard</option>
                                                </select>
                                            </td>
                                            <td style={s.td}>
                                                <ActionBtn icon="trash" color="#CC0033" bg="#FFF0F0" borderColor="#FFD0D0" onClick={() => deletePayment(p.id)} title="Supprimer" />
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
                        <div style={s.modalHead}><IconBadge icon="add" color="#5B2EE8" bg="#EDE8FF" size={36} iconSize={18} /><h2 style={s.modalTitle}>Nouveau paiement</h2></div>

                        <div style={s.fg}><label style={s.fl}>Étudiant *</label>
                            <select style={s.fi} value={studentId} onChange={e => setStudentId(e.target.value)}>
                                <option value="">— Choisir un étudiant —</option>
                                {students.map(st => <option key={st.id} value={st.id}>{st.user?.prenom} {st.user?.nom}</option>)}
                            </select></div>

                        <div style={s.fg}><label style={s.fl}>Groupe *</label>
                            <select style={s.fi} value={groupId} onChange={e => setGroupId(e.target.value)}>
                                <option value="">— Choisir un groupe —</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                            </select></div>

                        <div style={s.formGrid}>
                            <div style={s.fg}><label style={s.fl}>Montant (€) *</label>
                                <div style={{ position: 'relative' }}>
                                    <input style={{ ...s.fi, paddingRight: '36px' }} type="number" placeholder="ex: 150" value={montant} onChange={e => setMontant(e.target.value)} />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '800', color: '#5B2EE8' }}>€</span>
                                </div></div>
                            <div style={s.fg}><label style={s.fl}>Statut</label>
                                <select style={s.fi} value={statut} onChange={e => setStatut(e.target.value)}>
                                    <option value="EN_ATTENTE">En attente</option>
                                    <option value="PAYE">Payé</option>
                                    <option value="RETARD">En retard</option>
                                </select></div>
                        </div>

                        <div style={s.fg}><label style={s.fl}>Description</label>
                            <input style={s.fi} placeholder="ex: Mensualité Avril 2026" value={description} onChange={e => setDescription(e.target.value)} /></div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={s.btnP} onClick={addPayment}><Ic name="save" size={14} color="#fff" /> Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', margin: 0 },
    btnP: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#5B2EE8', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    btnO: { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '9px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '16px' },
    statCard: { border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px' },
    statVal: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    progressCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
    progressBar: { height: '8px', background: '#F3F4F6', borderRadius: '50px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg,#5B2EE8,#00C48C)', borderRadius: '50px', transition: 'width 0.5s' },
    ft: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#6B7280', border: '1.5px solid transparent', fontFamily: 'inherit', transition: 'all 0.15s' },
    ftOn: { background: '#EDE8FF', color: '#5B2EE8', border: '1.5px solid #C4B5FD' },
    fc: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', borderRadius: '50px', padding: '0 5px', fontSize: '10px', fontWeight: '800' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '9px', padding: '8px 12px', minWidth: '220px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    empty: { padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5', whiteSpace: 'nowrap' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#1A1040', verticalAlign: 'middle' },
    tdMuted: { padding: '10px 14px', fontSize: '12px', color: '#6B7280', verticalAlign: 'middle' },
    avatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalHead: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', margin: 0 },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
};