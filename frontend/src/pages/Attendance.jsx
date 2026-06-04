import { useState, useEffect } from 'react';
import api from '../api/axios';

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
    const icons = {
        users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
        x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        minus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        save: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        teacher: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
        location: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        monitor: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-.71a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
        mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
        chevron: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
        bar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    };
    return icons[name] ? <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icons[name]}</span> : null;
};

const STATUTS = {
    PRESENT:      { label: 'Présent',       shortLabel: 'P', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dotColor: '#059669', iconName: 'check',  next: 'ABSENT' },
    ABSENT:       { label: 'Absent',        shortLabel: 'A', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dotColor: '#DC2626', iconName: 'x',      next: 'EXCUSE' },
    EXCUSE:       { label: 'Excusé',        shortLabel: 'E', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dotColor: '#D97706', iconName: 'alert',  next: 'NON_COMMENCE' },
    NON_COMMENCE: { label: 'Non commencé', shortLabel: '—', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', dotColor: '#D1D5DB', iconName: 'minus',  next: 'PRESENT' },
};

export default function Attendance() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [presences, setPresences] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => { fetchGroups(); }, []);

    const fetchGroups = async () => {
        try { const res = await api.get('/groups'); setGroups(res.data); }
        catch (err) { console.error(err); }
    };

    const fetchAttendance = async (groupId, d) => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/group/${groupId}`);
            setEnrollments(res.data);
            initPresences(res.data, d || date);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const initPresences = (data, d) => {
        const map = {};
        data.forEach(e => {
            const att = e.attendance.find(a => new Date(a.date).toISOString().split('T')[0] === d);
            map[e.id] = att?.statut || 'PRESENT';
        });
        setPresences(map);
    };

    const selectGroup = (g) => { setSelectedGroup(g); fetchAttendance(g.id); setSaved(false); };
    const updateDate = (d) => { setDate(d); setSaved(false); if (enrollments.length) initPresences(enrollments, d); };
    const togglePresence = (id) => {
        const next = STATUTS[presences[id]]?.next || 'PRESENT';
        setPresences({ ...presences, [id]: next });
        setSaved(false);
    };
    const setAll = (s) => {
        const m = {}; enrollments.forEach(e => { m[e.id] = s; }); setPresences(m); setSaved(false);
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            await api.post('/attendance/session', {
                groupId: selectedGroup.id, date,
                presences: Object.entries(presences).map(([enrollmentId, statut]) => ({
                    enrollmentId: parseInt(enrollmentId), statut,
                })),
            });
            setSaved(true);
            fetchAttendance(selectedGroup.id, date);
        } catch { alert('Erreur sauvegarde'); }
        setSaving(false);
    };

    const allDates = [...new Set(enrollments.flatMap(e => e.attendance.map(a => new Date(a.date).toISOString().split('T')[0])))].sort();

    const getAligned = (enrollment) => allDates.map(d => {
        const att = enrollment.attendance.find(a => new Date(a.date).toISOString().split('T')[0] === d);
        const enrolled = new Date(enrollment.createdAt).toISOString().split('T')[0];
        if (d < enrolled) return { statut: 'NON_COMMENCE', date: d, before: true };
        return { statut: att?.statut || null, date: d };
    });

    const counts = {
        PRESENT: Object.values(presences).filter(v => v === 'PRESENT').length,
        ABSENT: Object.values(presences).filter(v => v === 'ABSENT').length,
        EXCUSE: Object.values(presences).filter(v => v === 'EXCUSE').length,
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.pageTitle}>Gestion des présences</h1>
                    <p style={s.pageSubtitle}>Suivi des présences par groupe et par séance</p>
                </div>
            </div>

            <div style={s.layout}>
                {/* ── SIDEBAR GROUPES ── */}
                <div style={s.sidebar}>
                    <div style={s.sideHeader}>
                        <Icon name="users" size={14} color="#6B7280" />
                        <span>Groupes</span>
                        <span style={s.sideBadge}>{groups.length}</span>
                    </div>
                    {groups.length === 0 ? (
                        <div style={s.sideEmpty}>Aucun groupe disponible</div>
                    ) : groups.map(g => (
                        <div key={g.id} style={{ ...s.groupCard, ...(selectedGroup?.id === g.id ? s.groupCardOn : {}) }}
                             onClick={() => selectGroup(g)}>
                            <div style={s.groupCardInner}>
                                <div style={{ ...s.groupDot, background: selectedGroup?.id === g.id ? '#5B2EE8' : '#E5E7EB' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={s.groupCardTitle}>{g.titre}</div>
                                    {g.teacher && (
                                        <div style={s.groupCardMeta}>
                                            <Icon name="teacher" size={10} color="#9CA3AF" />
                                            {g.teacher.prenom} {g.teacher.nom}
                                        </div>
                                    )}
                                </div>
                                <div style={s.groupCardCount}>
                                    <Icon name="users" size={10} color="#9CA3AF" />
                                    {g._count?.enrollments || 0}
                                </div>
                            </div>
                            {selectedGroup?.id === g.id && (
                                <div style={s.groupCardActive} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── MAIN ── */}
                <div style={s.mainWrap}>
                    {!selectedGroup ? (
                        <div style={s.emptyWrap}>
                            <div style={s.emptyIcon}><Icon name="calendar" size={36} color="#9CA3AF" /></div>
                            <div style={s.emptyTitle}>Sélectionnez un groupe</div>
                            <div style={s.emptyText}>Choisissez un groupe dans la liste pour gérer les présences</div>
                        </div>
                    ) : (
                        <>
                            {/* Group info bar */}
                            <div style={s.groupBar}>
                                <div style={s.groupBarLeft}>
                                    <div style={s.groupBarName}>{selectedGroup.titre}</div>
                                    <div style={s.groupBarMeta}>
                                        {selectedGroup.teacher && (
                                            <span style={s.metaChip}>
                        <Icon name="teacher" size={11} color="#6B7280" />
                                                {selectedGroup.teacher.prenom} {selectedGroup.teacher.nom}
                      </span>
                                        )}
                                        {selectedGroup.lieu && (
                                            <span style={s.metaChip}>
                        <Icon name="location" size={11} color="#6B7280" />
                                                {selectedGroup.lieu}
                      </span>
                                        )}
                                        {selectedGroup.format && (
                                            <span style={s.metaChip}>
                        <Icon name="monitor" size={11} color="#6B7280" />
                                                {selectedGroup.format === 'OFFLINE' ? 'Présentiel' : 'En ligne'}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div style={s.datePicker}>
                                    <label style={s.datePickerLabel}>
                                        <Icon name="calendar" size={12} color="#6B7280" />
                                        Date de la séance
                                    </label>
                                    <input type="date" style={s.dateInput} value={date} onChange={e => updateDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Stats row */}
                            <div style={s.statsRow}>
                                {[
                                    { key: 'PRESENT', icon: 'check', label: 'Présents', val: counts.PRESENT },
                                    { key: 'ABSENT', icon: 'x', label: 'Absents', val: counts.ABSENT },
                                    { key: 'EXCUSE', icon: 'alert', label: 'Excusés', val: counts.EXCUSE },
                                ].map(({ key, icon, label, val }) => {
                                    const st = STATUTS[key];
                                    return (
                                        <div key={key} style={{ ...s.statCard, borderColor: st.border, background: st.bg }}>
                                            <div style={{ ...s.statIconWrap, background: st.color + '18' }}>
                                                <Icon name={icon} size={16} color={st.color} />
                                            </div>
                                            <div>
                                                <div style={{ ...s.statNum, color: st.color }}>{val}</div>
                                                <div style={s.statLabel}>{label}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={s.statCard}>
                                    <div style={{ ...s.statIconWrap, background: '#EDE8FF' }}>
                                        <Icon name="users" size={16} color="#5B2EE8" />
                                    </div>
                                    <div>
                                        <div style={{ ...s.statNum, color: '#5B2EE8' }}>{enrollments.length}</div>
                                        <div style={s.statLabel}>Total</div>
                                    </div>
                                </div>

                                {/* Quick actions */}
                                <div style={s.quickActions}>
                                    <button style={{ ...s.quickBtn, ...s.quickBtnPresent }} onClick={() => setAll('PRESENT')}>
                                        <Icon name="check" size={13} color="#059669" /> Tous présents
                                    </button>
                                    <button style={{ ...s.quickBtn, ...s.quickBtnAbsent }} onClick={() => setAll('ABSENT')}>
                                        <Icon name="x" size={13} color="#DC2626" /> Tous absents
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div style={s.loadingWrap}>
                                    <Icon name="clock" size={28} color="#9CA3AF" />
                                    <span style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>Chargement...</span>
                                </div>
                            ) : enrollments.length === 0 ? (
                                <div style={s.emptyWrap}>
                                    <div style={s.emptyIcon}><Icon name="users" size={32} color="#9CA3AF" /></div>
                                    <div style={s.emptyTitle}>Aucun étudiant dans ce groupe</div>
                                </div>
                            ) : (
                                <div style={s.table}>
                                    {/* Table header */}
                                    <div style={s.tableHead}>
                                        <div style={s.thCell}>Étudiant</div>
                                        <div style={{ ...s.thCell, textAlign: 'center' }}>
                                            Séance · {fmtShort(date)}
                                        </div>
                                        <div style={s.thCell}>
                                            Historique
                                            <span style={s.histCount}>{allDates.length} séance{allDates.length > 1 ? 's' : ''}</span>
                                        </div>
                                        <div style={{ ...s.thCell, textAlign: 'center' }}>Taux</div>
                                    </div>

                                    {/* Rows */}
                                    {enrollments.map(enrollment => {
                                        const sc = STATUTS[presences[enrollment.id]] || STATUTS.PRESENT;
                                        const aligned = getAligned(enrollment);
                                        const real = enrollment.attendance.filter(a => {
                                            const enrolled = new Date(enrollment.createdAt).toISOString().split('T')[0];
                                            return new Date(a.date).toISOString().split('T')[0] >= enrolled;
                                        });
                                        const present = real.filter(a => a.statut === 'PRESENT').length;
                                        const taux = real.length > 0 ? Math.round((present / real.length) * 100) : 100;
                                        const tauxColor = taux >= 80 ? '#059669' : taux >= 60 ? '#D97706' : '#DC2626';
                                        const tauxBg = taux >= 80 ? '#ECFDF5' : taux >= 60 ? '#FFFBEB' : '#FEF2F2';

                                        return (
                                            <div key={enrollment.id} style={s.tableRow}>
                                                {/* Student */}
                                                <div style={s.studentCell} onClick={() => setShowDetail(enrollment)}>
                                                    <div style={s.avatar}>
                                                        {enrollment.student?.user?.prenom?.[0]}{enrollment.student?.user?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={s.studentName}>
                                                            {enrollment.student?.user?.prenom} {enrollment.student?.user?.nom}
                                                        </div>
                                                        <div style={s.studentMeta}>
                                                            {enrollment.student?.age ? `${enrollment.student.age} ans · ` : ''}
                                                            {enrollment.student?.user?.login}
                                                        </div>
                                                    </div>
                                                    <Icon name="chevron" size={14} color="#D1D5DB" />
                                                </div>

                                                {/* Presence toggle */}
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <button style={{
                                                        ...s.presenceBtn,
                                                        background: sc.bg,
                                                        color: sc.color,
                                                        border: `1.5px solid ${sc.border}`,
                                                    }} onClick={() => togglePresence(enrollment.id)}>
                                                        <div style={{ ...s.presenceDot, background: sc.color }} />
                                                        <Icon name={sc.iconName} size={13} color={sc.color} />
                                                        <span>{sc.label}</span>
                                                    </button>
                                                </div>

                                                {/* History */}
                                                <div style={s.histRow}>
                                                    {aligned.map((item, i) => {
                                                        const hc = item.statut ? (STATUTS[item.statut] || STATUTS.PRESENT) : null;
                                                        const isToday = item.date === date;
                                                        return (
                                                            <div key={i} style={{
                                                                ...s.histCell,
                                                                background: hc ? hc.bg : '#F9FAFB',
                                                                border: `1px solid ${hc ? hc.border : '#E5E7EB'}`,
                                                                outline: isToday ? '2px solid #5B2EE8' : 'none',
                                                                outlineOffset: '1px',
                                                                cursor: 'pointer',
                                                            }}
                                                                 onMouseEnter={() => setTooltip({ id: `${enrollment.id}-${i}`, date: item.date, statut: item.statut, before: item.before })}
                                                                 onMouseLeave={() => setTooltip(null)}>
                                                                {hc ? <Icon name={hc.iconName} size={8} color={hc.color} /> : null}
                                                                {tooltip?.id === `${enrollment.id}-${i}` && (
                                                                    <div style={s.tooltip}>
                                                                        <div style={s.tooltipDate}>{fmtShort(item.date)}</div>
                                                                        <div style={s.tooltipStatus}>
                                                                            {item.before ? 'Avant inscription' : hc?.label || 'Pas de données'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {aligned.length === 0 && (
                                                        <span style={{ fontSize: '12px', color: '#D1D5DB', fontStyle: 'italic' }}>—</span>
                                                    )}
                                                </div>

                                                {/* Taux */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{ ...s.tauxBadge, background: tauxBg, color: tauxColor }}>
                                                        {taux}%
                                                    </div>
                                                    <div style={s.tauxSub}>{present}/{real.length}</div>
                                                    {/* Mini progress bar */}
                                                    <div style={s.tauxBar}>
                                                        <div style={{ ...s.tauxFill, width: `${taux}%`, background: tauxColor }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Légende + Save */}
                            {enrollments.length > 0 && (
                                <div style={s.bottomBar}>
                                    <div style={s.legend}>
                                        {Object.entries(STATUTS).map(([key, val]) => (
                                            <div key={key} style={s.legendItem}>
                                                <div style={{ ...s.legendDot, background: val.dotColor }} />
                                                <span style={s.legendLabel}>{val.shortLabel} = {val.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={s.saveArea}>
                                        {saved && (
                                            <span style={s.savedBadge}>
                        <Icon name="check" size={13} color="#059669" />
                        Sauvegardé
                      </span>
                                        )}
                                        <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
                                                onClick={saveAttendance} disabled={saving}>
                                            <Icon name="save" size={15} color="#fff" />
                                            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── MODAL DÉTAIL ÉTUDIANT ── */}
            {showDetail && (
                <div style={s.modalOverlay} onClick={() => setShowDetail(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
                        <div style={s.modalHeader}>
                            <div style={s.modalAvatar}>
                                {showDetail.student?.user?.prenom?.[0]}{showDetail.student?.user?.nom?.[0]}
                            </div>
                            <div>
                                <div style={s.modalName}>
                                    {showDetail.student?.user?.prenom} {showDetail.student?.user?.nom}
                                </div>
                                <div style={s.modalLogin}>{showDetail.student?.user?.login}</div>
                            </div>
                        </div>

                        {/* Info grid */}
                        <div style={s.infoGrid}>
                            {[
                                { icon: 'user', label: 'Âge', val: showDetail.student?.age ? `${showDetail.student.age} ans` : '—' },
                                { icon: 'calendar', label: 'Inscrit le', val: fmtShort(showDetail.createdAt) },
                                { icon: 'user', label: 'Parent', val: showDetail.student?.parentNom || '—' },
                                { icon: 'phone', label: 'Téléphone', val: showDetail.student?.parentTel || '—' },
                                { icon: 'mail', label: 'Email', val: showDetail.student?.parentEmail || '—' },
                                {
                                    icon: 'bar', label: 'Taux présence',
                                    val: (() => {
                                        const d = new Date(showDetail.createdAt).toISOString().split('T')[0];
                                        const real = showDetail.attendance.filter(a => new Date(a.date).toISOString().split('T')[0] >= d);
                                        const p = real.filter(a => a.statut === 'PRESENT').length;
                                        return real.length > 0 ? `${Math.round((p / real.length) * 100)}%  (${p}/${real.length} séances)` : '—';
                                    })()
                                },
                            ].map((item, i) => (
                                <div key={i} style={s.infoCard}>
                                    <div style={s.infoCardLabel}>
                                        <Icon name={item.icon} size={11} color="#9CA3AF" />
                                        {item.label}
                                    </div>
                                    <div style={s.infoCardVal}>{item.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Historique */}
                        <div style={s.histSectionTitle}>
                            <Icon name="calendar" size={14} color="#374151" />
                            Historique des présences
                        </div>
                        {showDetail.attendance.length === 0 ? (
                            <p style={{ color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic' }}>Aucun historique disponible</p>
                        ) : (
                            <div style={s.histListWrap}>
                                {showDetail.attendance
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map((att, i) => {
                                        const sc = STATUTS[att.statut] || STATUTS.PRESENT;
                                        return (
                                            <div key={i} style={s.histLine}>
                                                <div style={{ ...s.histLineDot, background: sc.bg, border: `1.5px solid ${sc.border}` }}>
                                                    <Icon name={sc.iconName} size={10} color={sc.color} />
                                                </div>
                                                <span style={s.histLineDate}>{fmtDate(att.date)}</span>
                                                <span style={{ ...s.histLineBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {sc.label}
                        </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        <div style={s.modalFooter}>
                            <button style={s.closeBtn} onClick={() => setShowDetail(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    page: { minHeight: '100vh' },
    pageHeader: { marginBottom: '24px' },
    pageTitle: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 },
    pageSubtitle: { fontSize: '13px', color: '#6B7280', marginTop: '4px' },

    layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' },

    // Sidebar
    sidebar: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    sideHeader: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px' },
    sideBadge: { marginLeft: 'auto', background: '#E5E7EB', color: '#6B7280', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '50px' },
    sideEmpty: { padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' },
    groupCard: { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', position: 'relative', transition: 'background 0.1s' },
    groupCardOn: { background: '#F5F3FF' },
    groupCardInner: { display: 'flex', alignItems: 'center', gap: '10px' },
    groupDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s' },
    groupCardTitle: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '600', color: '#111827' },
    groupCardMeta: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9CA3AF', marginTop: '2px' },
    groupCardCount: { display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#9CA3AF', background: '#F3F4F6', padding: '2px 7px', borderRadius: '50px' },
    groupCardActive: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#5B2EE8', borderRadius: '0 2px 2px 0' },

    // Main
    mainWrap: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    emptyWrap: { padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    emptyIcon: { width: '72px', height: '72px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700', color: '#374151', marginBottom: '6px' },
    emptyText: { fontSize: '13px', color: '#9CA3AF', maxWidth: '280px', lineHeight: 1.5 },

    // Group bar
    groupBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexWrap: 'wrap', gap: '12px' },
    groupBarLeft: {},
    groupBarName: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
    groupBarMeta: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    metaChip: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280', background: '#fff', border: '1px solid #E5E7EB', padding: '3px 9px', borderRadius: '6px', fontWeight: '500' },
    datePicker: { display: 'flex', flexDirection: 'column', gap: '4px' },
    datePickerLabel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    dateInput: { padding: '7px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', color: '#111827', outline: 'none', background: '#fff', fontFamily: 'inherit', fontWeight: '600' },

    // Stats
    statsRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' },
    statCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', background: '#fff' },
    statIconWrap: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    statNum: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '11px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    quickActions: { display: 'flex', gap: '8px', marginLeft: 'auto' },
    quickBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid' },
    quickBtnPresent: { background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' },
    quickBtnAbsent: { background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },

    // Table
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: '#9CA3AF' },
    table: {},
    tableHead: { display: 'grid', gridTemplateColumns: '220px 160px 1fr 100px', gap: '0', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' },
    thCell: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px' },
    histCount: { marginLeft: '6px', background: '#E5E7EB', color: '#6B7280', fontSize: '10px', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' },
    tableRow: { display: 'grid', gridTemplateColumns: '220px 160px 1fr 100px', gap: '0', borderBottom: '1px solid #F3F4F6', alignItems: 'center', transition: 'background 0.1s' },

    // Student cell
    studentCell: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#8B5CF6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
    studentName: { fontSize: '13px', fontWeight: '600', color: '#111827' },
    studentMeta: { fontSize: '11px', color: '#9CA3AF', marginTop: '1px' },

    // Presence button
    presenceBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' },
    presenceDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },

    // History
    histRow: { display: 'flex', gap: '3px', padding: '12px 16px', flexWrap: 'wrap', alignItems: 'center' },
    histCell: { width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', transition: 'transform 0.1s' },
    tooltip: { position: 'absolute', bottom: '26px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '6px 10px', borderRadius: '7px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', minWidth: '100px', textAlign: 'center', pointerEvents: 'none' },
    tooltipDate: { fontSize: '11px', fontWeight: '700', marginBottom: '2px' },
    tooltipStatus: { fontSize: '10px', color: 'rgba(255,255,255,0.7)' },

    // Taux
    tauxBadge: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', padding: '3px 10px', borderRadius: '50px' },
    tauxSub: { fontSize: '10px', color: '#9CA3AF', fontWeight: '600' },
    tauxBar: { width: '48px', height: '3px', background: '#E5E7EB', borderRadius: '50px', overflow: 'hidden' },
    tauxFill: { height: '100%', borderRadius: '50px', transition: 'width 0.3s' },

    // Bottom bar
    bottomBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', flexWrap: 'wrap', gap: '12px' },
    legend: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
    legendDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
    legendLabel: { fontSize: '11px', color: '#6B7280', fontWeight: '600' },
    saveArea: { display: 'flex', alignItems: 'center', gap: '12px' },
    savedBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#059669', fontWeight: '700', background: '#ECFDF5', padding: '5px 12px', borderRadius: '8px', border: '1px solid #A7F3D0' },
    saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: '#5B2EE8', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(91,46,232,0.3)' },

    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBox: { background: '#fff', borderRadius: '16px', padding: '28px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
    modalHeader: { display: 'flex', alignItems: 'center', gap: '14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
    modalAvatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#8B5CF6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 },
    modalName: { fontFamily: 'sans-serif', fontSize: '17px', fontWeight: '700', color: '#111827' },
    modalLogin: { fontSize: '12px', color: '#9CA3AF', marginTop: '3px', fontFamily: 'monospace' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' },
    infoCard: { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px' },
    infoCardLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' },
    infoCardVal: { fontSize: '13px', fontWeight: '600', color: '#111827' },
    histSectionTitle: { display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' },
    histListWrap: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' },
    histLine: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: '#F9FAFB' },
    histLineDot: { width: '24px', height: '24px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    histLineDate: { fontSize: '13px', color: '#374151', fontWeight: '500', flex: 1 },
    histLineBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' },
    closeBtn: { padding: '8px 20px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' },
};