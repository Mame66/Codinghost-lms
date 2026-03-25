import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Homeworks() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ note: '', commentaire: '' });
    const [filter, setFilter] = useState('RENDU');

    useEffect(() => { fetchHomeworks(); }, []);

    const fetchHomeworks = async () => {
        try {
            const res = await api.get('/homeworks');
            setHomeworks(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const corriger = async (id) => {
        if (!form.note) return alert('La note est obligatoire');
        try {
            await api.put(`/homeworks/${id}`, form);
            setSelected(null);
            setForm({ note: '', commentaire: '' });
            fetchHomeworks();
        } catch (err) { alert('Erreur correction'); }
    };

    const filtered = homeworks.filter(h => h.statut === filter);

    const statusColors = {
        RENDU: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: 'Rendu' },
        CORRIGE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: 'Corrigé' },
        EN_ATTENTE: { bg: 'rgba(91,46,232,0.12)', color: '#5B2EE8', label: 'En attente' },
    };

    return (
        <div>
            <div style={styles.ph}>
                <h1 style={styles.h1}>✏️ Correction des devoirs</h1>
            </div>

            {/* Filter tabs */}
            <div style={styles.ftabs}>
                {['RENDU', 'CORRIGE', 'EN_ATTENTE'].map(s => (
                    <button
                        key={s}
                        style={{
                            ...styles.ft,
                            ...(filter === s ? styles.ftOn : {}),
                        }}
                        onClick={() => setFilter(s)}
                    >
                        {statusColors[s].label}
                        <span style={styles.fc}>
              {homeworks.filter(h => h.statut === s).length}
            </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={styles.tw}>
                {loading ? (
                    <div style={styles.empty}>Chargement...</div>
                ) : filtered.length === 0 ? (
                    <div style={styles.empty}>
                        {filter === 'RENDU'
                            ? '✅ Aucun devoir en attente de correction'
                            : 'Aucun devoir dans cette catégorie'}
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            {['Étudiant', 'Devoir', 'Rendu le', 'Statut', 'Note', 'Action'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(hw => (
                            <tr key={hw.id} style={styles.tr}>
                                <td style={styles.tdLink}>
                                    {hw.student?.user?.prenom} {hw.student?.user?.nom}
                                </td>
                                <td style={styles.td}>Tâche #{hw.taskId}</td>
                                <td style={styles.tdMuted}>
                                    {new Date(hw.createdAt).toLocaleDateString('fr-FR')}
                                </td>
                                <td style={styles.td}>
                    <span style={{
                        ...styles.pill,
                        background: statusColors[hw.statut]?.bg,
                        color: statusColors[hw.statut]?.color,
                    }}>
                      {statusColors[hw.statut]?.label}
                    </span>
                                </td>
                                <td style={styles.td}>
                                    {hw.note !== null ? (
                                        <span style={styles.note}>{hw.note}/20</span>
                                    ) : '—'}
                                </td>
                                <td style={styles.td}>
                                    {hw.statut === 'RENDU' && (
                                        <button
                                            style={styles.btnP}
                                            onClick={() => { setSelected(hw); setForm({ note: hw.note || '', commentaire: hw.commentaire || '' }); }}
                                        >
                                            Corriger
                                        </button>
                                    )}
                                    {hw.statut === 'CORRIGE' && (
                                        <button
                                            style={styles.btnO}
                                            onClick={() => { setSelected(hw); setForm({ note: hw.note || '', commentaire: hw.commentaire || '' }); }}
                                        >
                                            Modifier
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal correction */}
            {selected && (
                <div style={styles.modalBg} onClick={() => setSelected(null)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>✏️ Corriger le devoir</h2>

                        <div style={styles.studentInfo}>
                            <div style={styles.studentAvatar}>👤</div>
                            <div>
                                <div style={styles.studentName}>
                                    {selected.student?.user?.prenom} {selected.student?.user?.nom}
                                </div>
                                <div style={styles.studentMeta}>Tâche #{selected.taskId}</div>
                            </div>
                        </div>

                        {selected.contenu && (
                            <div style={styles.contenuBox}>
                                <div style={styles.contenuTitle}>📝 Réponse de l'étudiant :</div>
                                <div style={styles.contenuText}>{selected.contenu}</div>
                            </div>
                        )}

                        <div style={styles.fg}>
                            <label style={styles.fl}>
                                Note <span style={{ color: 'red' }}>*</span>
                                <span style={{ color: '#6B7280', fontWeight: '400', marginLeft: '4px' }}>(sur 20)</span>
                            </label>
                            <input
                                style={styles.fi}
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                placeholder="ex: 15"
                                value={form.note}
                                onChange={e => setForm({ ...form, note: e.target.value })}
                            />
                        </div>

                        <div style={styles.fg}>
                            <label style={styles.fl}>Commentaire</label>
                            <textarea
                                style={{ ...styles.fi, minHeight: '100px', resize: 'vertical' }}
                                placeholder="Feedback pour l'étudiant..."
                                value={form.commentaire}
                                onChange={e => setForm({ ...form, commentaire: e.target.value })}
                            />
                        </div>

                        {/* Note preview */}
                        {form.note && (
                            <div style={{
                                ...styles.notePreview,
                                background: form.note >= 10 ? 'rgba(0,196,140,0.1)' : 'rgba(255,59,92,0.1)',
                                borderColor: form.note >= 10 ? '#00C48C' : '#FF3B5C',
                            }}>
                <span style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: form.note >= 10 ? '#008060' : '#CC0033',
                }}>
                  {form.note}/20
                </span>
                                <span style={{ fontSize: '13px', color: '#6B7280', marginLeft: '8px' }}>
                  {form.note >= 16 ? '🌟 Excellent !'
                      : form.note >= 12 ? '👍 Bien'
                          : form.note >= 10 ? '✅ Passable'
                              : '❌ Insuffisant'}
                </span>
                            </div>
                        )}

                        <div style={styles.modalFoot}>
                            <button style={styles.btnO} onClick={() => setSelected(null)}>Annuler</button>
                            <button style={styles.btnP} onClick={() => corriger(selected.id)}>
                                ✅ Valider la correction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    ph: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    ftabs: { display: 'flex', gap: '6px', marginBottom: '18px' },
    ft: { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#6B7280', border: 'none', transition: 'all 0.15s' },
    ftOn: { background: '#EDE8FF', color: '#5B2EE8' },
    fc: { display: 'inline-block', marginLeft: '5px', background: 'rgba(91,46,232,0.12)', color: '#5B2EE8', borderRadius: '50px', padding: '0 6px', fontSize: '10px' },
    tw: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E0F5', overflow: 'hidden' },
    empty: { padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6B7280', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5' },
    tr: { borderTop: '1px solid #E5E0F5' },
    td: { padding: '12px 14px', fontSize: '13px', color: '#1A1040' },
    tdMuted: { padding: '12px 14px', fontSize: '12px', color: '#6B7280' },
    tdLink: { padding: '12px 14px', fontSize: '13px', color: '#5B2EE8', fontWeight: '700' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    note: { fontFamily: 'monospace', fontSize: '14px', fontWeight: '800', color: '#1A1040' },
    btnP: { padding: '6px 14px', background: '#5B2EE8', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    btnO: { padding: '6px 14px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '7px', color: '#1A1040', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    studentInfo: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '10px', padding: '14px', marginBottom: '20px' },
    studentAvatar: { width: '40px', height: '40px', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
    studentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    studentMeta: { fontSize: '12px', color: '#6B7280' },
    contenuBox: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '10px', padding: '14px', marginBottom: '16px' },
    contenuTitle: { fontSize: '12px', fontWeight: '700', color: '#8B6200', marginBottom: '8px' },
    contenuText: { fontSize: '13px', color: '#1A1040', lineHeight: 1.6 },
    notePreview: { border: '1.5px solid', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
};