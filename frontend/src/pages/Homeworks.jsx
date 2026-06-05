import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Icônes SVG inline ─────────────────────────────────────────
const Icon = ({ name, size = 18, color = 'currentColor' }) => {
    const icons = {
        inbox: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
        ),
        clock: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
        check: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
        ),
        star: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        ),
        search: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
        ),
        link: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
        ),
        edit: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        ),
        school: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        ),
        file: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
            </svg>
        ),
        text: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="10" x2="3" y2="10"/>
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="14" x2="3" y2="14"/>
                <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
        ),
        alert: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        ),
        bell: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
        ),
        user: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
        ),
        qcm: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
        ),
        slide: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
        ),
    };
    return icons[name] ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icons[name]}</span> : null;
};

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
    const [activeTab, setActiveTab] = useState('pending');

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
        SLIDE: { iconName: 'slide', label: 'Slide', color: '#5B2EE8', bg: '#EDE8FF' },
        QCM: { iconName: 'qcm', label: 'QCM', color: '#008060', bg: '#ECFDF5' },
        DEVOIR: { iconName: 'file', label: 'Devoir', color: '#CC3300', bg: '#FFF0EB' },
    };

    const getStudentGroup = (hw) => hw.student?.enrollments?.[0]?.group || null;

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

    const currentGrouped = activeTab === 'pending'
        ? groupByGroupAndTask(pending)
        : groupByGroupAndTask(done);
    const currentList = activeTab === 'pending' ? pending : done;

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
                    <h1 style={s.h1}>Correction des devoirs</h1>
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
                    { iconName: 'inbox', val: homeworks.length, lbl: 'Total reçus', color: '#5B2EE8', bg: '#EDE8FF' },
                    { iconName: 'clock', val: pending.length, lbl: 'À corriger', color: '#8B6200', bg: 'rgba(255,184,0,0.15)' },
                    { iconName: 'check', val: done.length, lbl: 'Corrigés', color: '#008060', bg: '#ECFDF5' },
                    { iconName: 'star', val: avgNote, lbl: 'Moyenne classe', color: '#5B2EE8', bg: '#EDE8FF' },
                ].map((st, i) => (
                    <div key={i} style={s.statCard}>
                        <div style={{ ...s.statIconBox, background: st.bg, color: st.color }}>
                            <Icon name={st.iconName} size={20} color={st.color} />
                        </div>
                        <div style={{ ...s.statVal, color: st.color }}>{st.val}</div>
                        <div style={s.statLbl}>{st.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={s.filtersRow}>
                <div style={s.searchBox}>
                    <Icon name="search" size={16} color="#9CA3AF" />
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
                    <option value="DEVOIR">Devoir</option>
                    <option value="QCM">QCM</option>
                </select>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
                <button style={{ ...s.tab, ...(activeTab === 'pending' ? s.tabOn : {}) }}
                        onClick={() => setActiveTab('pending')}>
                    <Icon name="clock" size={15} color={activeTab === 'pending' ? '#CC0033' : '#6B7280'} />
                    À corriger
                    <span style={{ ...s.tabBadge, background: activeTab === 'pending' ? '#FF3B5C' : '#E5E7EB', color: activeTab === 'pending' ? '#fff' : '#6B7280' }}>
            {pending.length}
          </span>
                </button>
                <button style={{ ...s.tab, ...(activeTab === 'done' ? s.tabOnGreen : {}) }}
                        onClick={() => setActiveTab('done')}>
                    <Icon name="check" size={15} color={activeTab === 'done' ? '#008060' : '#6B7280'} />
                    Corrigés
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
                    <div style={s.emptyIconBox}>
                        <Icon name={activeTab === 'pending' ? 'check' : 'inbox'} size={32}
                              color={activeTab === 'pending' ? '#008060' : '#9CA3AF'} />
                    </div>
                    <div style={s.emptyTitle}>
                        {activeTab === 'pending' ? 'Aucun devoir à corriger !' : 'Aucun devoir corrigé'}
                    </div>
                    {activeTab === 'pending' && (
                        <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>
                            Tous les devoirs ont été corrigés
                        </div>
                    )}
                </div>
            ) : (
                Object.entries(currentGrouped).map(([grpKey, grpData]) => (
                    <div key={grpKey} style={s.groupSection}>
                        <div style={s.groupHeader}>
                            <div style={s.groupAvatar}>
                                <Icon name="school" size={18} color="#fff" />
                            </div>
                            <div>
                                <div style={s.groupTitle}>{grpData.title}</div>
                                <div style={s.groupMeta}>
                                    {Object.keys(grpData.tasks).length} devoir(s) •{' '}
                                    {Object.values(grpData.tasks).reduce((a, t) => a + t.homeworks.length, 0)} rendu(s)
                                </div>
                            </div>
                        </div>

                        {Object.entries(grpData.tasks).map(([taskKey, taskData]) => {
                            const tc = typeConfig[taskData.taskType] || typeConfig.DEVOIR;
                            return (
                                <div key={taskKey} style={s.taskSection}>
                                    <div style={s.taskHeader}>
                                        <div style={{ ...s.taskIconBox, background: tc.bg, color: tc.color }}>
                                            <Icon name={tc.iconName} size={16} color={tc.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={s.taskTitle}>{taskData.taskTitle}</div>
                                            <span style={{ ...s.pill, background: tc.bg, color: tc.color }}>
                        {tc.label}
                      </span>
                                        </div>
                                        <div style={s.taskCount}>{taskData.homeworks.length} rendu(s)</div>
                                    </div>

                                    <div style={s.tableHead}>
                                        <div>Étudiant</div>
                                        <div style={{ textAlign: 'center' }}>Date rendu</div>
                                        <div>Travail</div>
                                        <div style={{ textAlign: 'center' }}>Note</div>
                                        <div style={{ textAlign: 'center' }}>Action</div>
                                    </div>

                                    {taskData.homeworks.map(hw => {
                                        const answers = parseQcmAnswers(hw.qcmAnswers);
                                        return (
                                            <div key={hw.id} style={s.hwRow}>
                                                <div style={s.studentCell}>
                                                    <div style={s.avatar}>
                                                        {hw.student?.user?.prenom?.[0]}{hw.student?.user?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={s.studentName}>
                                                            {hw.student?.user?.prenom} {hw.student?.user?.nom}
                                                        </div>
                                                        <div style={s.studentLogin}>{hw.student?.user?.login}</div>
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={s.dateVal}>
                                                        {new Date(hw.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div style={s.dateTime}>
                                                        {new Date(hw.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div style={s.workCell}>
                                                    {hw.lienRendu ? (
                                                        <a href={hw.lienRendu} target="_blank" rel="noreferrer" style={s.workLink}>
                                                            <Icon name="link" size={13} color="#5B2EE8" />
                                                            Voir le fichier
                                                        </a>
                                                    ) : answers ? (
                                                        <span style={s.workQcm}>
                              <Icon name="qcm" size={13} color="#008060" />
                                                            {Object.keys(answers).length} réponse(s)
                            </span>
                                                    ) : hw.contenu ? (
                                                        <span style={s.workText}>
                              <Icon name="text" size={13} color="#6B7280" />
                                                            {hw.contenu.length > 40 ? hw.contenu.substring(0, 40) + '...' : hw.contenu}
                            </span>
                                                    ) : (
                                                        <span style={s.workEmpty}>Aucun contenu</span>
                                                    )}
                                                    {hw.commentaire && hw.statut === 'CORRIGE' && (
                                                        <div style={s.commentPreview}>{hw.commentaire.substring(0, 50)}{hw.commentaire.length > 50 ? '...' : ''}</div>
                                                    )}
                                                </div>

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

                                                <div style={{ textAlign: 'center' }}>
                                                    <button
                                                        style={hw.statut === 'RENDU' ? s.btnCorrect : s.btnEdit}
                                                        onClick={() => {
                                                            setSelected(hw);
                                                            setForm({ note: hw.note || '', commentaire: hw.commentaire || '' });
                                                        }}>
                                                        <Icon name="edit" size={13} color={hw.statut === 'RENDU' ? '#fff' : '#6B7280'} />
                                                        {hw.statut === 'RENDU' ? 'Corriger' : 'Modifier'}
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
                        <h2 style={s.modalTitle}>Correction du devoir</h2>

                        <div style={s.corrStudentBox}>
                            <div style={s.corrAvatar}>
                                {selected.student?.user?.prenom?.[0]}{selected.student?.user?.nom?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={s.corrStudentName}>
                                    {selected.student?.user?.prenom} {selected.student?.user?.nom}
                                </div>
                                <div style={s.corrStudentMeta}>
                                    {selected.student?.user?.login} · {getStudentGroup(selected)?.titre || '—'} ·{' '}
                                    {new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <span style={{ ...s.pill, background: typeConfig[selected.task?.type]?.bg || '#F3F4F6', color: typeConfig[selected.task?.type]?.color || '#6B7280' }}>
                {selected.task?.titre}
              </span>
                        </div>

                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>Travail rendu</div>
                            {selected.lienRendu && (
                                <div style={s.corrLienBox}>
                                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700' }}>Lien partagé :</span>
                                    <a href={selected.lienRendu} target="_blank" rel="noreferrer" style={s.corrLink}>
                                        <Icon name="link" size={13} color="#5B2EE8" /> {selected.lienRendu}
                                    </a>
                                </div>
                            )}
                            {selected.contenu && !selected.qcmSoumis && (
                                <div style={s.corrContenu}>
                                    <div style={s.corrContenuTitle}>Réponse texte</div>
                                    <div style={{ fontSize: '13px', color: '#1A1040', lineHeight: 1.6 }}>{selected.contenu}</div>
                                </div>
                            )}
                            {selected.qcmSoumis && (
                                <div style={{ ...s.corrContenu, background: '#ECFDF5' }}>
                                    <div style={{ ...s.corrContenuTitle, color: '#008060' }}>QCM soumis</div>
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

                        <div style={s.corrSection}>
                            <div style={s.corrSectionTitle}>Évaluation</div>
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
                                            {parseFloat(form.note) >= 16 ? 'Excellent'
                                                : parseFloat(form.note) >= 14 ? 'Bien'
                                                    : parseFloat(form.note) >= 12 ? 'Assez bien'
                                                        : parseFloat(form.note) >= 10 ? 'Passable'
                                                            : 'Insuffisant'}
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
                            <Icon name="bell" size={14} color="#8B6200" />
                            L'étudiant recevra une notification avec sa note dès validation.
                        </div>

                        <div style={s.modalFoot}>
                            <button style={s.btnO} onClick={() => setSelected(null)}>Annuler</button>
                            <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }}
                                    onClick={corriger} disabled={saving}>
                                {saving ? 'Sauvegarde...' : 'Valider la correction'}
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
    statCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    statIconBox: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    statVal: { fontFamily: 'sans-serif', fontSize: '28px', fontWeight: '800' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
    filtersRow: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #E5E0F5', borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1A1040', width: '100%' },
    filterSelect: { padding: '7px 14px', border: '1.5px solid #E5E0F5', borderRadius: '8px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
    tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #E5E0F5', background: '#fff', fontWeight: '700', fontSize: '14px', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' },
    tabOn: { background: '#FFF0EB', borderColor: '#FF3B5C', color: '#CC0033' },
    tabOnGreen: { background: '#ECFDF5', borderColor: '#00C48C', color: '#008060' },
    tabBadge: { padding: '2px 8px', borderRadius: '50px', fontSize: '12px', fontWeight: '800' },
    empty: { textAlign: 'center', padding: '60px', color: '#6B7280' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyIconBox: { width: '64px', height: '64px', background: '#F3F4F6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' },
    groupSection: { marginBottom: '24px' },
    groupHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1A1040', borderRadius: '12px 12px 0 0' },
    groupAvatar: { width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    groupTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#fff' },
    groupMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
    taskSection: { background: '#fff', border: '1px solid #E5E0F5', borderTop: 'none', overflow: 'hidden', marginBottom: '2px' },
    taskHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#F8F6FF', borderBottom: '1px solid #E5E0F5' },
    taskIconBox: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    taskTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '3px' },
    taskCount: { fontSize: '12px', color: '#6B7280', fontWeight: '700', background: '#F3F4F6', padding: '3px 10px', borderRadius: '50px', whiteSpace: 'nowrap' },
    tableHead: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 110px', gap: '12px', padding: '8px 16px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' },
    hwRow: { display: 'grid', gridTemplateColumns: '200px 80px 1fr 80px 110px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' },
    studentCell: { display: 'flex', alignItems: 'center', gap: '8px' },
    avatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
    studentName: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    studentLogin: { fontSize: '11px', color: '#9CA3AF' },
    dateVal: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    dateTime: { fontSize: '11px', color: '#6B7280' },
    workCell: { overflow: 'hidden' },
    workLink: { color: '#5B2EE8', fontSize: '12px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' },
    workQcm: { fontSize: '12px', color: '#008060', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
    workText: { fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' },
    workEmpty: { fontSize: '12px', color: '#D1D5DB', fontStyle: 'italic' },
    commentPreview: { fontSize: '11px', color: '#6B7280', marginTop: '3px', fontStyle: 'italic' },
    noteBadge: { display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '13px', fontWeight: '800' },
    pill: { display: 'inline-flex', padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
    btnCorrect: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
    btnEdit: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', background: '#F3F4F6', border: '1px solid #E5E0F5', borderRadius: '8px', color: '#6B7280', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    corrStudentBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F6FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', flexWrap: 'wrap' },
    corrAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 },
    corrStudentName: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    corrStudentMeta: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    corrSection: { marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' },
    corrSectionTitle: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    corrLienBox: { display: 'flex', flexDirection: 'column', gap: '4px', background: '#F0F9FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrLink: { color: '#5B2EE8', fontWeight: '700', fontSize: '13px', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' },
    corrContenu: { background: '#F8F6FF', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
    corrContenuTitle: { fontSize: '11px', fontWeight: '800', color: '#5B2EE8', marginBottom: '6px', textTransform: 'uppercase' },
    notifInfo: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' },
    fi: { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit', boxSizing: 'border-box' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    btnO: { padding: '10px 20px', background: 'transparent', border: '1.5px solid #E5E0F5', borderRadius: '8px', color: '#1A1040', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
};