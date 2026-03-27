import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Homeworks() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ note: '', commentaire: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchHomeworks(); }, []);

    const fetchHomeworks = async () => {
        try {
            const res = await api.get('/homeworks');
            setHomeworks(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const corriger = async () => {
        if (!form.note) return alert('La note est obligatoire');
        if (parseFloat(form.note) < 0 || parseFloat(form.note) > 20) return alert('Note entre 0 et 20');
        setSaving(true);
        try {
            await api.put(`/homeworks/${selected.id}`, form);
            setSelected(null);
            setForm({ note: '', commentaire: '' });
            fetchHomeworks();
        } catch (err) { alert('Erreur correction'); }
        setSaving(false);
    };

    const statusConfig = {
        RENDU: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: '⏳ En attente' },
        CORRIGE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: '✅ Corrigé' },
        EN_ATTENTE: { bg: 'rgba(91,46,232,0.12)', color: '#5B2EE8', label: '📝 En attente' },
    };

    const typeConfig = {
        SLIDE: { icon: '📊', label: 'Slide', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { icon: '✅', label: 'QCM', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: '📁', label: 'Devoir', color: '#CC3300', bg: '#FFF0EB' },
        EXERCISE: { icon: '✏️', label: 'Exercice', color: '#CC3300', bg: '#FFF0EB' },
    };

    const filtered = homeworks.filter(hw => {
        const matchFilter = filter === 'ALL' || hw.statut === filter;
        const name = `${hw.student?.user?.prenom} ${hw.student?.user?.nom}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) ||
            hw.task?.titre?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const groupedByTask = filtered.reduce((acc, hw) => {
        const key = hw.taskId;
        if (!acc[key]) acc[key] = { task: hw.task, homeworks: [] };
        acc[key].homeworks.push(hw);
        return acc;
    }, {});

    const counts = {
        ALL: homeworks.length,
        RENDU: homeworks.filter(h => h.statut === 'RENDU').length,
        CORRIGE: homeworks.filter(h => h.statut === 'CORRIGE').length,
    };

    const parseQcmAnswers = (qcmAnswers) => {
        if (!qcmAnswers) return null;
        try { return typeof qcmAnswers === 'string' ? JSON.parse(qcmAnswers) : qcmAnswers; }
        catch { return null; }
    };

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>✏️ Correction des devoirs</h1>
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
                {[
                    { icon: '📥', val: counts.ALL, lbl: 'Total reçus', color: '#1A1040' },
                    { icon: '⏳', val: counts.RENDU, lbl: 'À corriger', color: '#8B6200' },
                    { icon: '✅', val: counts.CORRIGE, lbl: 'Corrigés', color: '#008060' },
                    {
                        icon: '⭐',
                        val: homeworks.filter(h => h.note !== null).length > 0
                            ? (homeworks.filter(h => h.note !== null).reduce((a, b) => a + (b.note || 0), 0) /
                                homeworks.filter(h => h.note !== null).length).toFixed(1)
                            : '—',
                        lbl: 'Moyenne classe', color: '#1A1040'
                    },
                ].map((st, i) => (
                    <div key={i} style={s.statCard}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{st.icon}</div>
                        <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                        <div style={s.statLbl}>{st.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={s.toolbar}>
                <div style={s.ftabs}>
                    {[{ key: 'ALL', label: 'Tous' }, { key: 'RENDU', label: '⏳ À corriger' }, { key: 'CORRIGE', label: '✅ Corrigés' }].map(f => (
                        <button key={f.key} style={{ ...s.ft, ...(filter === f.key ? s.ftOn : {}) }} onClick={() => setFilter(f.key)}>
                            {f.label} <span style={s.fc}>{counts[f.key] ?? homeworks.length}</span>
                        </button>
                    ))}
                </div>
                <div style={s.searchBox}>
                    <span>🔍</span>
                    <input style={s.searchInput} placeholder="Rechercher étudiant ou devoir..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* List */}
            {loading ? <div style={s.empty}>Chargement...</div>
                : filtered.length === 0 ? (
                    <div style={s.emptyBox}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                        <div style={s.emptyTitle}>{filter === 'RENDU' ? 'Aucun devoir à corriger !' : 'Aucun devoir trouvé'}</div>
                    </div>
                ) : (
                    Object.values(groupedByTask).map(({ task, homeworks: taskHws }) => {
                        const tc = typeConfig[task?.type] || typeConfig.DEVOIR;
                        return (
                            <div key={taskHws[0].taskId} style={s.taskGroup}>
                                {/* Task header */}
                                <div style={s.taskGroupHeader}>
                                    <div style={{ ...s.taskTypeIcon, background: tc.bg, color: tc.color }}>{tc.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={s.taskGroupTitle}>{task?.titre || `Tâche #${taskHws[0].taskId}`}</div>
                                        <div style={s.taskGroupMeta}>
                                            <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</span>
                                            <span style={s.metaDot}>•</span>
                                            <span style={s.metaText}>{taskHws.length} rendu(s)</span>
                                            <span style={s.metaDot}>•</span>
                                            <span style={{ color: '#8B6200', fontWeight: '700', fontSize: '12px' }}>
                        {taskHws.filter(h => h.statut === 'RENDU').length} à corriger
                      </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table header */}
                                <div style={s.tableHeader}>
                                    {['Étudiant', 'Date', 'Travail rendu', 'Note', 'Statut', 'Action'].map(h => (
                                        <div key={h} style={s.tableHeaderCell}>{h}</div>
                                    ))}
                                </div>

                                {/* Rows */}
                                {taskHws.map(hw => {
                                    const sc = statusConfig[hw.statut] || statusConfig.RENDU;
                                    const answers = parseQcmAnswers(hw.qcmAnswers);
                                    return (
                                        <div key={hw.id} style={s.hwRow}>
                                            <div style={s.hwStudent}>
                                                <div style={s.hwAvatar}>
                                                    {hw.student?.user?.prenom?.[0]}{hw.student?.user?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <div style={s.hwStudentName}>{hw.student?.user?.prenom} {hw.student?.user?.nom}</div>
                                                    <div style={s.hwStudentLogin}>🔑 {hw.student?.user?.login}</div>
                                                </div>
                                            </div>

                                            <div style={s.hwDate}>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>
                                                    {new Date(hw.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                                    {new Date(hw.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>

                                            <div style={s.hwContent}>
                                                {hw.lienRendu && (
                                                    <a href={hw.lienRendu} target="_blank" rel="noreferrer" style={s.hwLink}>
                                                        🔗 Voir le fichier rendu
                                                    </a>
                                                )}
                                                {hw.contenu && !hw.lienRendu && (
                                                    <div style={s.hwContenuPreview}>
                                                        📝 {hw.contenu.length > 50 ? hw.contenu.substring(0, 50) + '...' : hw.contenu}
                                                    </div>
                                                )}
                                                {answers && (
                                                    <div style={s.hwQcmPreview}>✅ QCM — {Object.keys(answers).length} réponse(s)</div>
                                                )}
                                                {!hw.lienRendu && !hw.contenu && !answers && (
                                                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>Aucun contenu</span>
                                                )}
                                            </div>

                                            <div style={{ textAlign: 'center' }}>
                                                {hw.note !== null ? (
                                                    <span style={{ ...s.noteBadge, background: hw.note >= 10 ? 'rgba(0,196,140,0.12)' : 'rgba(255,59,92,0.12)', color: hw.note >= 10 ? '#008060' : '#CC0033' }}>
                            {hw.note}/20
                          </span>
                                                ) : <span style={{ color: '#D1D5DB', fontSize: '16px', fontWeight: '700' }}>—</span>}
                                            </div>

                                            <div>
                                                <span style={{ ...s.pill, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </div>

                                            <div>
                                                <button style={hw.statut === 'RENDU' ? s.btnCorrect : s.btnEdit}
                                                        onClick={() => { setSelected(hw); setForm({ note: hw.note || '', commentaire: hw.commentaire || '' }); }}>
                                                    {hw.statut === 'RENDU' ? '✏️ Corriger' : '📝 Modifier'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}

            {/* Modal Correction */}
            {selected && (
                <div style={s.modalBg} onClick={() => setSelected(null)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>✏️ Correction du devoir</h2>

                        <div style={s.corrStudentBox}>
                            <div style={s.corrAvatar}>
                                {selected.student?.user?.prenom?.[0]}{selected.student?.user?.nom?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={s.corrStudentName}>{selected.student?.user?.prenom} {selected.student?.user?.nom}</div>
                                <div style={s.corrStudentMeta}>
                                    🔑 {selected.student?.user?.login} • 📅 {new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <span style={{ ...s.pill, background: typeConfig[selected.task?.type]?.bg || '#F3F4F6', color: typeConfig[selected.task?.type]?.color || '#6B7280' }}>
                {typeConfig[selected.task?.type]?.icon} {selected.task?.titre}
              </span>
                        </div>

                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>📥 Travail rendu</div>
                            {selected.lienRendu && (
                                <div style={s.corrLienBox}>
                                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700' }}>Lien partagé :</span>
                                    <a href={selected.lienRendu} target="_blank" rel="noreferrer" style={s.corrLink}>
                                        🔗 {selected.lienRendu}
                                    </a>
                                </div>
                            )}
                            {selected.contenu && (
                                <div style={s.corrContenu}>
                                    <div style={s.corrContenuTitle}>📝 Réponse texte</div>
                                    <div style={s.corrContenuText}>{selected.contenu}</div>
                                </div>
                            )}
                            {selected.qcmAnswers && (
                                <div style={{ ...s.corrContenu, background: '#ECFDF5' }}>
                                    <div style={{ ...s.corrContenuTitle, color: '#008060' }}>✅ Réponses QCM</div>
                                    <div style={{ fontSize: '13px', color: '#1A1040' }}>
                                        {(() => {
                                            const a = parseQcmAnswers(selected.qcmAnswers);
                                            return a ? `${Object.keys(a).length} question(s) répondue(s)` : 'Données invalides';
                                        })()}
                                    </div>
                                </div>
                            )}
                            {!selected.lienRendu && !selected.contenu && !selected.qcmAnswers && (
                                <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Aucun contenu soumis</div>
                            )}
                        </div>

                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>⭐ Évaluation</div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={s.fl}>Note * <span style={{ color: '#6B7280', fontWeight: '400', textTransform: 'none' }}>(sur 20)</span></label>
                                    <input style={s.fi} type="number" min="0" max="20" step="0.5" placeholder="ex: 15"
                                           value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                                </div>
                                {form.note && (
                                    <div style={{ border: `1.5px solid ${parseFloat(form.note) >= 10 ? '#00C48C' : '#FF3B5C'}`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center', background: parseFloat(form.note) >= 10 ? 'rgba(0,196,140,0.08)' : 'rgba(255,59,92,0.08)' }}>
                                        <div style={{ fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '900', color: parseFloat(form.note) >= 10 ? '#008060' : '#CC0033' }}>{form.note}/20</div>
                                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                            {parseFloat(form.note) >= 16 ? '🌟 Excellent' : parseFloat(form.note) >= 14 ? '👍 Bien' : parseFloat(form.note) >= 12 ? '👌 Assez bien' : parseFloat(form.note) >= 10 ? '✅ Passable' : '❌ Insuffisant'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '14px' }}>
                                <label style={s.fl}>Commentaire pour l'étudiant</label>
                                <textarea style={{ ...s.fi, minHeight: '90px', resize: 'vertical' }}
                                          placeholder="Feedback, remarques, conseils..."
                                          value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.notifInfo}>🔔 L'étudiant recevra une notification avec sa note dès validation.</div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setSelected(null)}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }} onClick={corriger} disabled={saving}>
                                {saving ? 'Sauvegarde...' : '✅ Valider la correction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' },
    statCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px', textAlign: 'center' },
    statVal: { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' },
    ftabs: { display: 'flex', gap: '6px' },
    ft: { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#6B7280', border: 'none' },
    ftOn: { background: '#EDE8FF', color: '#5B2EE8' },
    fc: { display: 'inline-block', marginLeft: '5px', background: 'rgba(91,46,232,0.12)', color: '#5B2EE8', borderRadius: '50px', padding: '0 6px', fontSize: '10px' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '6px 12px', minWidth: '240px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    empty: { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' },
    taskGroup: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' },
    taskGroupHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5' },
    taskTypeIcon: { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    taskGroupTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040', marginBottom: '4px' },
    taskGroupMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
    metaDot: { color: '#D1D5DB', fontSize: '12px' },
    metaText: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    tableHeader: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 130px 110px', gap: '12px', padding: '8px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' },
    tableHeaderCell: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' },
    hwRow: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 130px 110px', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' },
    hwStudent: { display: 'flex', alignItems: 'center', gap: '8px' },
    hwAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
    hwStudentName: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    hwStudentLogin: { fontSize: '11px', color: '#9CA3AF' },
    hwDate: { textAlign: 'center' },
    hwContent: { overflow: 'hidden' },
    hwLink: { color: '#5B2EE8', fontSize: '12px', fontWeight: '700', textDecoration: 'none' },
    hwContenuPreview: { fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    hwQcmPreview: { fontSize: '12px', color: '#008060', fontWeight: '700' },
    noteBadge: { display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '13px', fontWeight: '800' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    btnCorrect: { padding: '6px 12px', background: '#5B2EE8', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' },
    btnEdit: { padding: '6px 12px', background: '#F3F4F6', border: '1px solid #E5E0F5', borderRadius: '7px', color: '#6B7280', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    corrStudentBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' },
    corrAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 },
    corrStudentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    corrStudentMeta: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    corrSection: { marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' },
    corrSectionTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    corrLienBox: { display: 'flex', flexDirection: 'column', gap: '4px', background: '#F0F9FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrLink: { color: '#5B2EE8', fontWeight: '700', fontSize: '13px', wordBreak: 'break-all' },
    corrContenu: { background: '#F8F6FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrContenuTitle: { fontSize: '11px', fontWeight: '800', color: '#5B2EE8', marginBottom: '6px', textTransform: 'uppercase' },
    corrContenuText: { fontSize: '13px', color: '#1A1040', lineHeight: 1.6 },
    notifInfo: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', fontWeight: '600', marginBottom: '16px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' },
    fi: { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit', boxSizing: 'border-box' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
    btnO: { padding: '10px 20px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
};