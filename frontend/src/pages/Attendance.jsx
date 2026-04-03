import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Attendance() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [presences, setPresences] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showStudentDetail, setShowStudentDetail] = useState(null);
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => { fetchGroups(); }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAttendance = async (groupId, currentDate) => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/group/${groupId}`);
            setEnrollments(res.data);
            initPresences(res.data, currentDate || date);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const initPresences = (enrollmentData, d) => {
        const initialPresences = {};
        enrollmentData.forEach(enrollment => {
            const att = enrollment.attendance.find(a => {
                return new Date(a.date).toISOString().split('T')[0] === d;
            });
            initialPresences[enrollment.id] = att?.statut || 'PRESENT';
        });
        setPresences(initialPresences);
    };

    const selectGroup = (group) => {
        setSelectedGroup(group);
        fetchAttendance(group.id);
        setSaved(false);
    };

    const updateDate = (newDate) => {
        setDate(newDate);
        setSaved(false);
        if (enrollments.length > 0) initPresences(enrollments, newDate);
    };

    const togglePresence = (enrollmentId) => {
        const current = presences[enrollmentId];
        const next = current === 'PRESENT' ? 'ABSENT'
            : current === 'ABSENT' ? 'EXCUSE'
                : current === 'EXCUSE' ? 'NON_COMMENCE'
                    : 'PRESENT';
        setPresences({ ...presences, [enrollmentId]: next });
        setSaved(false);
    };

    const setAll = (statut) => {
        const newPresences = {};
        enrollments.forEach(e => { newPresences[e.id] = statut; });
        setPresences(newPresences);
        setSaved(false);
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            const presencesList = Object.entries(presences).map(([enrollmentId, statut]) => ({
                enrollmentId: parseInt(enrollmentId),
                statut,
            }));
            await api.post('/attendance/session', {
                groupId: selectedGroup.id,
                date,
                presences: presencesList,
            });
            setSaved(true);
            fetchAttendance(selectedGroup.id, date);
        } catch (err) { alert('Erreur sauvegarde'); }
        setSaving(false);
    };

    const statColors = {
        PRESENT: { bg: '#ECFDF5', color: '#008060', border: '#00C48C', label: 'P', full: 'Présent', dot: '#00C48C' },
        ABSENT: { bg: '#FFF0F0', color: '#CC0033', border: '#FF3B5C', label: 'A', full: 'Absent', dot: '#FF3B5C' },
        EXCUSE: { bg: '#FFFBEB', color: '#8B6200', border: '#FFB800', label: 'E', full: 'Excusé', dot: '#FFB800' },
        NON_COMMENCE: { bg: '#F8F6FF', color: '#9CA3AF', border: '#D1D5DB', label: '—', full: 'Non commencé', dot: '#D1D5DB' },
    };

    // Calculer toutes les dates de séances uniques du groupe
    const getAllSessionDates = () => {
        const datesSet = new Set();
        enrollments.forEach(enrollment => {
            enrollment.attendance.forEach(a => {
                datesSet.add(new Date(a.date).toISOString().split('T')[0]);
            });
        });
        return Array.from(datesSet).sort();
    };

    const totalP = Object.values(presences).filter(v => v === 'PRESENT').length;
    const totalA = Object.values(presences).filter(v => v === 'ABSENT').length;
    const totalE = Object.values(presences).filter(v => v === 'EXCUSE').length;

    const allDates = getAllSessionDates();

    // Pour chaque étudiant, calculer ses présences alignées sur toutes les dates
    const getAlignedAttendance = (enrollment) => {
        return allDates.map(d => {
            const att = enrollment.attendance.find(a =>
                new Date(a.date).toISOString().split('T')[0] === d
            );

            // Si l'étudiant a rejoint après cette date
            const enrolledDate = new Date(enrollment.createdAt).toISOString().split('T')[0];
            if (d < enrolledDate) {
                return { statut: 'NON_COMMENCE', date: d, notStarted: true };
            }

            return att ? { statut: att.statut, date: d } : { statut: null, date: d };
        });
    };

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>📋 Présences</h1>
            </div>

            <div style={s.layout}>
                {/* Groups sidebar */}
                <div style={s.sidebar}>
                    <div style={s.sideTitle}>Groupes</div>
                    {groups.length === 0 ? (
                        <div style={s.sideEmpty}>Aucun groupe</div>
                    ) : groups.map(g => (
                        <div key={g.id}
                             style={{ ...s.groupItem, ...(selectedGroup?.id === g.id ? s.groupItemOn : {}) }}
                             onClick={() => selectGroup(g)}>
                            <div style={s.groupItemName}>{g.titre}</div>
                            <div style={s.groupItemMeta}>
                                {g.teacher ? `👩‍🏫 ${g.teacher.prenom} ${g.teacher.nom}` : ''}
                                {g._count?.enrollments ? ` · 👥 ${g._count.enrollments}` : ''}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main */}
                <div style={s.main}>
                    {!selectedGroup ? (
                        <div style={s.emptyState}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                            <div style={s.emptyTitle}>Sélectionnez un groupe</div>
                            <div style={{ color: '#6B7280', fontSize: '13px' }}>
                                Choisissez un groupe pour marquer les présences
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Group header */}
                            <div style={s.attHeader}>
                                <div>
                                    <div style={s.attGroupName}>{selectedGroup.titre}</div>
                                    <div style={s.attGroupMeta}>
                                        {selectedGroup.teacher
                                            ? `👩‍🏫 ${selectedGroup.teacher.prenom} ${selectedGroup.teacher.nom}`
                                            : ''}
                                        {selectedGroup.lieu ? ` · 📍 ${selectedGroup.lieu}` : ''}
                                        {selectedGroup.format ? ` · ${selectedGroup.format === 'OFFLINE' ? '🏫 Présentiel' : '💻 En ligne'}` : ''}
                                    </div>
                                </div>
                                <div style={s.dateRow}>
                                    <label style={s.dateLabel}>📅 Date de la séance</label>
                                    <input type="date" style={s.dateInput}
                                           value={date} onChange={e => updateDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Stats + quick actions */}
                            <div style={s.statsBar}>
                                <div style={{ ...s.statPill, background: '#ECFDF5', color: '#008060' }}>
                                    ✅ Présents : <strong>{totalP}</strong>
                                </div>
                                <div style={{ ...s.statPill, background: '#FFF0F0', color: '#CC0033' }}>
                                    ❌ Absents : <strong>{totalA}</strong>
                                </div>
                                <div style={{ ...s.statPill, background: '#FFFBEB', color: '#8B6200' }}>
                                    ⚠️ Excusés : <strong>{totalE}</strong>
                                </div>
                                <div style={s.quickBtns}>
                                    <button style={s.qBtn} onClick={() => setAll('PRESENT')}>Tous présents</button>
                                    <button style={s.qBtn} onClick={() => setAll('ABSENT')}>Tous absents</button>
                                </div>
                            </div>

                            {/* Legend */}
                            <div style={s.legend}>
                                {Object.entries(statColors).map(([key, val]) => (
                                    <div key={key} style={s.legendItem}>
                                        <div style={{ ...s.legendDot, background: val.dot }} />
                                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                      {val.label} = {val.full}
                    </span>
                                    </div>
                                ))}
                                <div style={s.legendItem}>
                                    <div style={{ ...s.legendDot, background: '#F3F4F6', border: '1px dashed #D1D5DB' }} />
                                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                    □ = Pas encore de données
                  </span>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Chargement...</div>
                            ) : enrollments.length === 0 ? (
                                <div style={s.emptyState}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                                    <div style={s.emptyTitle}>Aucun étudiant</div>
                                </div>
                            ) : (
                                <div style={s.attTable}>
                                    <div style={s.attTableHeader}>
                                        <div>Étudiant</div>
                                        <div style={{ textAlign: 'center' }}>Séance du {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                                        <div>
                                            Historique ({allDates.length} séance{allDates.length > 1 ? 's' : ''})
                                        </div>
                                        <div style={{ textAlign: 'center' }}>Taux</div>
                                    </div>

                                    {enrollments.map(enrollment => {
                                        const sc = statColors[presences[enrollment.id]] || statColors.PRESENT;
                                        const aligned = getAlignedAttendance(enrollment);
                                        const realSeances = enrollment.attendance.filter(a => {
                                            const enrolledDate = new Date(enrollment.createdAt).toISOString().split('T')[0];
                                            return new Date(a.date).toISOString().split('T')[0] >= enrolledDate;
                                        });
                                        const totalPresent = realSeances.filter(a => a.statut === 'PRESENT').length;
                                        const taux = realSeances.length > 0
                                            ? Math.round((totalPresent / realSeances.length) * 100)
                                            : 100;

                                        return (
                                            <div key={enrollment.id} style={s.attRow}>
                                                {/* Student */}
                                                <div style={s.studentCell}
                                                     onClick={() => setShowStudentDetail(enrollment)}
                                                     title="Cliquer pour voir les détails">
                                                    <div style={s.studentAvatar}>
                                                        {enrollment.student?.user?.prenom?.[0]}{enrollment.student?.user?.nom?.[0]}
                                                    </div>
                                                    <div>
                                                        <div style={s.studentName}>
                                                            {enrollment.student?.user?.prenom} {enrollment.student?.user?.nom}
                                                        </div>
                                                        <div style={s.studentSub}>
                                                            {enrollment.student?.age ? `${enrollment.student.age} ans` : ''}
                                                            {enrollment.student?.age && enrollment.student?.user?.login ? ' · ' : ''}
                                                            {enrollment.student?.user?.login}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Toggle presence */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <button style={{
                                                        ...s.presenceBtn,
                                                        background: sc.bg,
                                                        color: sc.color,
                                                        border: `2px solid ${sc.border}`,
                                                    }} onClick={() => togglePresence(enrollment.id)}>
                                                        {sc.label} — {sc.full}
                                                    </button>
                                                </div>

                                                {/* History with tooltip */}
                                                <div style={s.historyRow}>
                                                    {aligned.map((item, i) => {
                                                        const hc = item.statut ? (statColors[item.statut] || statColors.PRESENT) : null;
                                                        return (
                                                            <div key={i}
                                                                 style={{
                                                                     ...s.histDot,
                                                                     background: hc ? hc.bg : '#F8F6FF',
                                                                     color: hc ? hc.color : '#D1D5DB',
                                                                     border: hc ? `1px solid ${hc.border}` : '1px dashed #D1D5DB',
                                                                     position: 'relative',
                                                                     cursor: 'pointer',
                                                                 }}
                                                                 onMouseEnter={() => setTooltip({ index: `${enrollment.id}-${i}`, date: item.date, statut: item.statut, notStarted: item.notStarted })}
                                                                 onMouseLeave={() => setTooltip(null)}
                                                            >
                                                                {hc ? hc.label : ''}

                                                                {/* Tooltip */}
                                                                {tooltip?.index === `${enrollment.id}-${i}` && (
                                                                    <div style={s.tooltip}>
                                                                        <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '2px' }}>
                                                                            {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                        </div>
                                                                        <div style={{ fontSize: '11px' }}>
                                                                            {item.notStarted ? '— Non commencé (avant inscription)'
                                                                                : item.statut ? hc?.full
                                                                                    : 'Pas de données'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {aligned.length === 0 && (
                                                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                              Aucun historique
                            </span>
                                                    )}
                                                </div>

                                                {/* Taux */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        ...s.tauxBadge,
                                                        background: taux >= 75 ? 'rgba(0,196,140,0.12)' : taux >= 50 ? 'rgba(255,184,0,0.15)' : 'rgba(255,59,92,0.12)',
                                                        color: taux >= 75 ? '#008060' : taux >= 50 ? '#8B6200' : '#CC0033',
                                                    }}>
                                                        {taux}%
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                                        {totalPresent}/{realSeances.length}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Save button */}
                            {enrollments.length > 0 && (
                                <div style={s.saveRow}>
                                    {saved && <span style={s.savedMsg}>✅ Présences sauvegardées !</span>}
                                    <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }}
                                            onClick={saveAttendance} disabled={saving}>
                                        {saving ? 'Sauvegarde...' : '💾 Enregistrer les présences'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal détail étudiant */}
            {showStudentDetail && (
                <div style={s.modalBg} onClick={() => setShowStudentDetail(null)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={s.modalTitle}>👤 Détail de l'étudiant</h2>

                        <div style={s.studentDetailHeader}>
                            <div style={s.studentDetailAvatar}>
                                {showStudentDetail.student?.user?.prenom?.[0]}
                                {showStudentDetail.student?.user?.nom?.[0]}
                            </div>
                            <div>
                                <div style={s.studentDetailName}>
                                    {showStudentDetail.student?.user?.prenom} {showStudentDetail.student?.user?.nom}
                                </div>
                                <div style={s.studentDetailMeta}>
                                    🔑 {showStudentDetail.student?.user?.login}
                                </div>
                            </div>
                        </div>

                        <div style={s.studentInfoGrid}>
                            {[
                                { label: '🎂 Âge', val: showStudentDetail.student?.age ? `${showStudentDetail.student.age} ans` : '—' },
                                { label: '📅 Inscrit le', val: new Date(showStudentDetail.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                                { label: '👨‍👩‍👧 Parent', val: showStudentDetail.student?.parentNom || '—' },
                                { label: '📞 Téléphone', val: showStudentDetail.student?.parentTel || '—' },
                                { label: '📧 Email parent', val: showStudentDetail.student?.parentEmail || '—' },
                                {
                                    label: '📊 Taux présence',
                                    val: (() => {
                                        const real = showStudentDetail.attendance.filter(a => {
                                            const d = new Date(showStudentDetail.createdAt).toISOString().split('T')[0];
                                            return new Date(a.date).toISOString().split('T')[0] >= d;
                                        });
                                        const p = real.filter(a => a.statut === 'PRESENT').length;
                                        return real.length > 0 ? `${Math.round((p / real.length) * 100)}% (${p}/${real.length})` : '—';
                                    })()
                                },
                            ].map((item, i) => (
                                <div key={i} style={s.infoItem}>
                                    <div style={s.infoLabel}>{item.label}</div>
                                    <div style={s.infoVal}>{item.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Historique complet */}
                        <div style={s.histSection}>
                            <div style={s.histTitle}>📅 Historique complet</div>
                            {showStudentDetail.attendance.length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                                    Aucun historique
                                </div>
                            ) : (
                                <div style={s.histList}>
                                    {showStudentDetail.attendance
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((att, i) => {
                                            const sc = statColors[att.statut] || statColors.PRESENT;
                                            return (
                                                <div key={i} style={s.histListItem}>
                                                    <div style={{ ...s.histListDot, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                        {sc.label}
                                                    </div>
                                                    <span style={{ fontSize: '13px', color: '#1A1040', fontWeight: '600' }}>
                            {new Date(att.date).toLocaleDateString('fr-FR', {
                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                            })}
                          </span>
                                                    <span style={{ ...s.pill, background: sc.bg, color: sc.color, marginLeft: 'auto' }}>
                            {sc.full}
                          </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <div style={s.modalFoot}>
                            <button style={s.btnP} onClick={() => setShowStudentDetail(null)}>Fermer</button>
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
    layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' },
    sidebar: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    sideTitle: { fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px', padding: '14px 16px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF' },
    sideEmpty: { padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' },
    groupItem: { padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
    groupItemOn: { background: '#F5F2FF', borderLeftColor: '#5B2EE8' },
    groupItemName: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    groupItemMeta: { fontSize: '11px', color: '#6B7280', marginTop: '2px' },
    main: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    emptyState: { padding: '60px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    attHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #E5E0F5', background: '#F8F6FF', flexWrap: 'wrap', gap: '12px' },
    attGroupName: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040' },
    attGroupMeta: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    dateRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
    dateLabel: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
    dateInput: { padding: '8px 12px', border: '1.5px solid #E5E0F5', borderRadius: '8px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#fff', fontFamily: 'inherit' },
    statsBar: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid #E5E0F5', flexWrap: 'wrap' },
    statPill: { padding: '5px 12px', borderRadius: '50px', fontSize: '13px', fontWeight: '600' },
    quickBtns: { display: 'flex', gap: '6px', marginLeft: 'auto' },
    qBtn: { padding: '5px 12px', background: '#F3F4F6', border: '1px solid #E5E0F5', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#6B7280', fontFamily: 'inherit' },
    legend: { display: 'flex', gap: '12px', padding: '8px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
    legendDot: { width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0 },
    attTable: { padding: '0' },
    attTableHeader: { display: 'grid', gridTemplateColumns: '200px 160px 1fr 100px', gap: '12px', padding: '10px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
    attRow: { display: 'grid', gridTemplateColumns: '200px 160px 1fr 100px', gap: '12px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' },
    studentCell: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
    studentAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
    studentName: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    studentSub: { fontSize: '11px', color: '#9CA3AF' },
    presenceBtn: { padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' },
    historyRow: { display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' },
    histDot: { width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', flexShrink: 0 },
    tooltip: { position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: '#1A1040', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
    tauxBadge: { display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '13px', fontWeight: '800' },
    saveRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #E5E0F5', background: '#F8F6FF' },
    savedMsg: { fontSize: '13px', color: '#008060', fontWeight: '700' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '20px' },
    modalFoot: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px' },
    studentDetailHeader: { display: 'flex', alignItems: 'center', gap: '14px', background: '#F8F6FF', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
    studentDetailAvatar: { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', flexShrink: 0 },
    studentDetailName: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040' },
    studentDetailMeta: { fontSize: '13px', color: '#6B7280', marginTop: '2px' },
    studentInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
    infoItem: { background: '#F8F6FF', borderRadius: '10px', padding: '12px' },
    infoLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' },
    infoVal: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    histSection: { borderTop: '1px solid #E5E0F5', paddingTop: '16px' },
    histTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    histList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' },
    histListItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F3F4F6' },
    histListDot: { width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', flexShrink: 0 },
    pill: { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '800' },
};