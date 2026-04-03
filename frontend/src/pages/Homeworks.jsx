import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Homeworks() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [homeworks, setHomeworks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState('ALL');
    const [selectedType, setSelectedType] = useState('ALL');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ note: '', commentaire: '' });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // pending | done

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [hwRes, grpRes] = await Promise.all([
                api.get('/homeworks'),
                api.get('/groups'),
            ]);
            setHomeworks(hwRes.data);
            setGroups(grpRes.data);
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
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur correction');
        }
        setSaving(false);
    };

    const typeConfig = {
        SLIDE: { icon: '📊', label: 'Slide', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { icon: '✅', label: 'QCM', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { icon: '📁', label: 'Devoir', color: '#CC3300', bg: '#FFF0EB' },
    };

    // Trouver le groupe d'un étudiant
    const getStudentGroup = (hw) => {
        return hw.student?.enrollments?.[0]?.group || null;
    };

    // Filtrer
    const filtered = homeworks.filter(hw => {
        const grp = getStudentGroup(hw);
        const matchGroup = selectedGroup === 'ALL' || grp?.id === parseInt(selectedGroup);
        const matchType = selectedType === 'ALL' || hw.task?.type === selectedType;
        const name = `${hw.student?.user?.prenom} ${hw.student?.user?.nom}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase()) ||
            hw.task?.titre?.toLowerCase().includes(search.toLowerCase());
        return matchGroup && matchType && matchSearch;
    });

    const pending = filtered.filter(h => h.statut === 'RENDU');
    const done = filtered.filter(h => h.statut === 'CORRIGE');

    // Grouper par groupe puis par tâche
    const groupByGroupAndTask = (list) => {
        const result = {};
        list.forEach(hw => {
            const grp = getStudentGroup(hw);
            const grpKey = grp ? `${grp.id}` : 'no-group';
            const grpTitle = grp?.titre || 'Sans groupe';
            if (!result[grpKey]) result[grpKey] = { title: grpTitle, tasks: {} };
            const taskKey = hw.taskId;
            if (!result[grpKey].tasks[taskKey]) {
                result[grpKey].tasks[taskKey] = {
                    taskTitle: hw.task?.titre || `Tâche #${hw.taskId}`,
                    taskType: hw.task?.type,
                    homeworks: []
                };
            }
            result[grpKey].tasks[taskKey].homeworks.push(hw);
        });
        return result;
    };

    const pendingGrouped = groupByGroupAndTask(pending);
    const doneGrouped = groupByGroupAndTask(done);
    const currentGrouped = activeTab === 'pending' ? pendingGrouped : doneGrouped;
    const currentList = activeTab === 'pending' ? pending : done;

    // Stats globales
    const totalStudentsWithHomework = new Set(homeworks.map(h => h.studentId)).size;
    const avgNote = done.filter(h => h.note !== null).length > 0
        ? (done.filter(h => h.note !== null).reduce((a, b) => a + (b.note || 0), 0) /
            done.filter(h => h.note !== null).length).toFixed(1)
        : '—';

    const parseQcmAnswers = (q) => {
        if (!q) return null;
        try { return typeof q === 'string' ? JSON.parse(q) : q; }
        catch { return null; }
    };

    return (
        <div>
            <div style={s.ph}>
                <div>
                    <h1 style={s.h1}>✏️ Correction des devoirs</h1>
                    <div style={s.subtitle}>
                        {user?.role === 'TEACHER'
                            ? 'Devoirs et QCM de vos groupes uniquement'
                            : 'Tous les devoirs et QCM'}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
                {[
                    { icon: '📥', val: homeworks.length, lbl: 'Total reçus', color: '#1A1040' },
                    { icon: '⏳', val: pending.length, lbl: 'À corriger', color: '#8B6200', bg: 'rgba(255,184,0,0.08)' },
                    { icon: '✅', val: done.length, lbl: 'Corrigés', color: '#008060', bg: 'rgba(0,196,140,0.08)' },
                    { icon: '⭐', val: avgNote, lbl: 'Moyenne classe', color: '#5B2EE8' },
                ].map((st, i) => (
                    <div key={i} style={{ ...s.statCard, background: st.bg || '#fff' }}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{st.icon}</div>
                        <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                        <div style={s.statLbl}>{st.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={s.filtersRow}>
                <div style={s.searchBox}>
                    <span>🔍</span>
                    <input style={s.searchInput} placeholder="Rechercher étudiant ou devoir..."
                           value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select style={s.filterSelect} value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}>
                    <option value="ALL">Tous les groupes</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.titre}</option>)}
                </select>
                <select style={s.filterSelect} value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}>
                    <option value="ALL">Tous les types</option>
                    <option value="DEVOIR">📁 Devoir</option>
                    <option value="QCM">✅ QCM</option>
                </select>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
                <button style={{ ...s.tab, ...(activeTab === 'pending' ? s.tabOn : {}) }}
                        onClick={() => setActiveTab('pending')}>
                    ⏳ À corriger
                    <span style={{ ...s.tabBadge, background: activeTab === 'pending' ? '#FF3B5C' : '#E5E7EB', color: activeTab === 'pending' ? '#fff' : '#6B7280' }}>
            {pending.length}
          </span>
                </button>
                <button style={{ ...s.tab, ...(activeTab === 'done' ? s.tabOnGreen : {}) }}
                        onClick={() => setActiveTab('done')}>
                    ✅ Corrigés
                    <span style={{ ...s.tabBadge, background: activeTab === 'done' ? '#00C48C' : '#E5E7EB', color: activeTab === 'done' ? '#fff' : '#6B7280' }}>
            {done.length}
          </span>
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={s.empty}>Chargement...</div>
            ) : currentList.length === 0 ? (
                <div style={s.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {activeTab === 'pending' ? '🎉' : '📭'}
                    </div>
                    <div style={s.emptyTitle}>
                        {activeTab === 'pending'
                            ? 'Aucun devoir à corriger !'
                            : 'Aucun devoir corrigé'}
                    </div>
                    {activeTab === 'pending' && (
                        <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>
                            Tous les devoirs ont été corrigés 🎊
                        </div>
                    )}
                </div>
            ) : (
                Object.entries(currentGrouped).map(([grpKey, grpData]) => (
                    <div key={grpKey} style={s.groupSection}>
                        {/* Group header */}
                        <div style={s.groupHeader}>
                            <div style={s.groupAvatar}>🏫</div>
                            <div>
                                <div style={s.groupTitle}>{grpData.title}</div>
                                <div style={s.groupMeta}>
                                    {Object.keys(grpData.tasks).length} devoir(s) •{' '}
                                    {Object.values(grpData.tasks).reduce((a, t) => a + t.homeworks.length, 0)} rendu(s)
                                </div>
                            </div>
                        </div>

                        {/* Tasks in this group */}
                        {Object.entries(grpData.tasks).map(([taskKey, taskData]) => {
                            const tc = typeConfig[taskData.taskType] || typeConfig.DEVOIR;
                            return (
                                <div key={taskKey} style={s.taskSection}>
                                    {/* Task header */}
                                    <div style={s.taskHeader}>
                                        <div style={{ ...s.taskIcon, background: tc.bg, color: tc.color }}>
                                            {tc.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={s.taskTitle}>{taskData.taskTitle}</div>
                                            <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>
                        {tc.icon} {tc.label}
                      </span>
                                        </div>
                                        <div style={s.taskCount}>
                                            {taskData.homeworks.length} rendu(s)
                                        </div>
                                    </div>

                                    {/* Table header */}
                                    <div style={s.tableHead}>
                                        <div>Étudiant</div>
                                        <div style={{ textAlign: 'center' }}>Date rendu</div>
                                        <div>Travail</div>
                                        <div style={{ textAlign: 'center' }}>Note</div>
                                        <div style={{ textAlign: 'center' }}>Action</div>
                                    </div>

                                    {/* Rows */}
                                    {taskData.homeworks.map(hw => {
                                        const answers = parseQcmAnswers(hw.qcmAnswers);
                                        return (
                                            <div key={hw.id} style={s.hwRow}>
                                                {/* Student */}
                                                <div style={s.studentCell}>
                                                    <div style={s.avatar}>
                                                        {hw.student?.user?.prenom?.[0]}{hw.student?.user?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={s.studentName}>
                                                            {hw.student?.user?.prenom} {hw.student?.user?.nom}
                                                        </div>
                                                        <div style={s.studentLogin}>🔑 {hw.student?.user?.login}</div>
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={s.dateVal}>
                                                        {new Date(hw.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div style={s.dateTime}>
                                                        {new Date(hw.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                {/* Travail */}
                                                <div style={s.workCell}>
                                                    {hw.lienRendu ? (
                                                        <a href={hw.lienRendu} target="_blank" rel="noreferrer" style={s.workLink}>
                                                            🔗 Voir le fichier
                                                        </a>
                                                    ) : answers ? (
                                                        <span style={s.workQcm}>
                              ✅ {Object.keys(answers).length} réponse(s)
                            </span>
                                                    ) : hw.contenu ? (
                                                        <span style={s.workText}>
                              📝 {hw.contenu.length > 40 ? hw.contenu.substring(0, 40) + '...' : hw.contenu}
                            </span>
                                                    ) : (
                                                        <span style={s.workEmpty}>Aucun contenu</span>
                                                    )}
                                                    {hw.commentaire && hw.statut === 'CORRIGE' && (
                                                        <div style={s.commentPreview}>💬 {hw.commentaire.substring(0, 50)}{hw.commentaire.length > 50 ? '...' : ''}</div>
                                                    )}
                                                </div>

                                                {/* Note */}
                                                <div style={{ textAlign: 'center' }}>
                                                    {hw.note !== null && hw.note !== undefined ? (
                                                        <div style={{
                                                            ...s.noteBadge,
                                                            background: hw.note >= 10 ? 'rgba(0,196,140,0.12)' : 'rgba(255,59,92,0.12)',
                                                            color: hw.note >= 10 ? '#008060' : '#CC0033',
                                                        }}>
                                                            {hw.note}/20
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#D1D5DB', fontWeight: '700' }}>—</span>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <button
                                                        style={hw.statut === 'RENDU' ? s.btnCorrect : s.btnEdit}
                                                        onClick={() => {
                                                            setSelected(hw);
                                                            setForm({ note: hw.note || '', commentaire: hw.commentaire || '' });
                                                        }}>
                                                        {hw.statut === 'RENDU' ? '✏️ Corriger' : '📝 Modifier'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                ))
            )}

            {/* Modal Correction */}
            {selected && (
                <div style={s.modalBg} onClick={() => setSelected(null)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>✏️ Corriger le devoir</h2>

                        {/* Student info */}
                        <div style={s.corrStudentBox}>
                            <div style={s.corrAvatar}>
                                {selected.student?.user?.prenom?.[0]}{selected.student?.user?.nom?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={s.corrStudentName}>
                                    {selected.student?.user?.prenom} {selected.student?.user?.nom}
                                </div>
                                <div style={s.corrStudentMeta}>
                                    🔑 {selected.student?.user?.login} •{' '}
                                    🏫 {getStudentGroup(selected)?.titre || '—'} •{' '}
                                    📅 {new Date(selected.createdAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                })}
                                </div>
                            </div>
                            <span style={{
                                ...s.pill,
                                background: typeConfig[selected.task?.type]?.bg || '#F3F4F6',
                                color: typeConfig[selected.task?.type]?.color || '#6B7280',
                            }}>
                {typeConfig[selected.task?.type]?.icon} {selected.task?.titre}
              </span>
                        </div>

                        {/* Travail rendu */}
                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>📥 Travail rendu</div>
                            {selected.lienRendu && (
                                <div style={s.corrLienBox}>
                                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700' }}>🔗 Lien :</span>
                                    <a href={selected.lienRendu} target="_blank" rel="noreferrer" style={s.corrLink}>
                                        {selected.lienRendu}
                                    </a>
                                </div>
                            )}
                            {selected.contenu && !selected.qcmSoumis && (
                                <div style={s.corrContenu}>
                                    <div style={s.corrContenuTitle}>📝 Réponse</div>
                                    <div style={{ fontSize: '13px', color: '#1A1040', lineHeight: 1.6 }}>{selected.contenu}</div>
                                </div>
                            )}
                            {selected.qcmSoumis && (
                                <div style={{ ...s.corrContenu, background: '#ECFDF5' }}>
                                    <div style={{ ...s.corrContenuTitle, color: '#008060' }}>✅ QCM soumis</div>
                                    <div style={{ fontSize: '13px', color: '#1A1040' }}>
                                        {(() => {
                                            const a = parseQcmAnswers(selected.qcmAnswers);
                                            return a ? `${Object.keys(a).length} question(s) répondue(s)` : 'Données invalides';
                                        })()}
                                    </div>
                                    {selected.note !== null && selected.note !== undefined && (
                                        <div style={{ fontSize: '13px', color: '#008060', fontWeight: '700', marginTop: '4px' }}>
                                            Score automatique : {selected.note}/20
                                        </div>
                                    )}
                                </div>
                            )}
                            {!selected.lienRendu && !selected.contenu && !selected.qcmSoumis && (
                                <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Aucun contenu soumis</div>
                            )}
                        </div>

                        {/* Évaluation */}
                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>⭐ Évaluation</div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={s.fl}>Note * (sur 20)</label>
                                    <input style={s.fi} type="number" min="0" max="20" step="0.5"
                                           placeholder="ex: 15"
                                           value={form.note}
                                           onChange={e => setForm({ ...form, note: e.target.value })} />
                                </div>
                                {form.note && (
                                    <div style={{
                                        border: `1.5px solid ${parseFloat(form.note) >= 10 ? '#00C48C' : '#FF3B5C'}`,
                                        borderRadius: '10px', padding: '10px 16px', textAlign: 'center',
                                        background: parseFloat(form.note) >= 10 ? 'rgba(0,196,140,0.08)' : 'rgba(255,59,92,0.08)',
                                        minWidth: '90px',
                                    }}>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: parseFloat(form.note) >= 10 ? '#008060' : '#CC0033' }}>
                                            {form.note}/20
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                            {parseFloat(form.note) >= 16 ? '🌟 Excellent'
                                                : parseFloat(form.note) >= 14 ? '👍 Bien'
                                                    : parseFloat(form.note) >= 12 ? '👌 Assez bien'
                                                        : parseFloat(form.note) >= 10 ? '✅ Passable'
                                                            : '❌ Insuffisant'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '14px' }}>
                                <label style={s.fl}>Commentaire pour l'étudiant</label>
                                <textarea style={{ ...s.fi, minHeight: '90px', resize: 'vertical' }}
                                          placeholder="Feedback, remarques, conseils..."
                                          value={form.commentaire}
                                          onChange={e => setForm({ ...form, commentaire: e.target.value })} />
                            </div>
                        </div>

                        <div style={s.notifInfo}>
                            🔔 L'étudiant recevra une notification avec sa note dès validation.
                        </div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setSelected(null)}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }}
                                    onClick={corriger} disabled={saving}>
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
    ph: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    subtitle: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '4px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' },
    statCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '12px', padding: '16px', textAlign: 'center' },
    statVal: { fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    filtersRow: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    filterSelect: { padding: '7px 12px', border: '1.5px solid #E5E0F5', borderRadius: '8px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
    tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #E5E0F5', background: '#fff', fontWeight: '700', fontSize: '14px', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' },
    tabOn: { background: '#FFF0EB', borderColor: '#FF3B5C', color: '#CC0033' },
    tabOnGreen: { background: '#ECFDF5', borderColor: '#00C48C', color: '#008060' },
    tabBadge: { padding: '2px 8px', borderRadius: '50px', fontSize: '12px', fontWeight: '800' },
    empty: { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' },
    groupSection: { marginBottom: '24px' },
    groupHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1A1040', borderRadius: '12px 12px 0 0', marginBottom: '2px' },
    groupAvatar: { width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
    groupTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#fff' },
    groupMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
    taskSection: { background: '#fff', border: '1px solid #E5E0F5', borderTop: 'none', overflow: 'hidden', marginBottom: '2px' },
    taskHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5' },
    taskIcon: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 },
    taskTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '3px' },
    taskCount: { fontSize: '12px', color: '#6B7280', fontWeight: '700', background: '#F3F4F6', padding: '3px 10px', borderRadius: '50px' },
    tableHead: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 100px', gap: '12px', padding: '8px 16px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
    hwRow: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 100px', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' },
    studentCell: { display: 'flex', alignItems: 'center', gap: '8px' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
    studentName: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    studentLogin: { fontSize: '11px', color: '#9CA3AF' },
    dateVal: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    dateTime: { fontSize: '11px', color: '#6B7280' },
    workCell: { overflow: 'hidden' },
    workLink: { color: '#5B2EE8', fontSize: '12px', fontWeight: '700', textDecoration: 'none' },
    workQcm: { fontSize: '12px', color: '#008060', fontWeight: '700' },
    workText: { fontSize: '12px', color: '#6B7280' },
    workEmpty: { fontSize: '12px', color: '#D1D5DB', fontStyle: 'italic' },
    commentPreview: { fontSize: '11px', color: '#6B7280', marginTop: '3px', fontStyle: 'italic' },
    noteBadge: { display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '13px', fontWeight: '800' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    btnCorrect: { padding: '6px 12px', background: '#5B2EE8', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
    btnEdit: { padding: '6px 12px', background: '#F3F4F6', border: '1px solid #E5E0F5', borderRadius: '7px', color: '#6B7280', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    corrStudentBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', flexWrap: 'wrap' },
    corrAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 },
    corrStudentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    corrStudentMeta: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    corrSection: { marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' },
    corrSectionTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    corrLienBox: { display: 'flex', flexDirection: 'column', gap: '4px', background: '#F0F9FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrLink: { color: '#5B2EE8', fontWeight: '700', fontSize: '13px', wordBreak: 'break-all' },
    corrContenu: { background: '#F8F6FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrContenuTitle: { fontSize: '11px', fontWeight: '800', color: '#5B2EE8', marginBottom: '6px', textTransform: 'uppercase' },
    notifInfo: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', fontWeight: '600', marginBottom: '16px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' },
    fi: { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit', boxSizing: 'border-box' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnO: { padding: '10px 20px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
};