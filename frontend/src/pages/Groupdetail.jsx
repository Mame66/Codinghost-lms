import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { AUDIENCES, AudienceBadge } from '../utils/audience';

// Échappe le texte injecté dans la fenêtre d'impression
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
    const a = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };
    const icons = {
        back:     <svg {...a}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        users:    <svg {...a}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        user:     <svg {...a}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        teacher:  <svg {...a}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
        location: <svg {...a}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        book:     <svg {...a}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        lock:     <svg {...a}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
        unlock:   <svg {...a}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
        key:      <svg {...a}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
        plus:     <svg {...a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        check:    <svg {...a} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        copy:     <svg {...a}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        search:   <svg {...a}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
        print:    <svg {...a}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
        phone:    <svg {...a}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-.71a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
        monitor:  <svg {...a}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        slide:    <svg {...a}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        qcm:      <svg {...a}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        file:     <svg {...a}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
        chevdown: <svg {...a} strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
        chevup:   <svg {...a} strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
        calendar: <svg {...a}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        bar:      <svg {...a}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    };
    return icons[name] ? <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icons[name]}</span> : null;
};

const Chip = ({ color, bg, border, children }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color, background: bg, border: `1px solid ${border || 'transparent'}` }}>
    {children}
  </span>
);

const ATT = {
    PRESENT:      { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', lbl: 'P' },
    ABSENT:       { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', lbl: 'A' },
    EXCUSE:       { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', lbl: 'E' },
    NON_COMMENCE: { color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', lbl: '—' },
};


export default function GroupDetail({ groupId: groupIdProp, onBack: onBackProp }) {
    // ✅ FIX : l'id vient de l'URL (/groups/:id). Avant, groupId était toujours
    // undefined → la page restait bloquée sur « Chargement... ».
    const params   = useParams();
    const navigate = useNavigate();
    const groupId  = groupIdProp ?? params.id;
    const onBack   = onBackProp ?? (() => navigate('/groups'));

    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const canEdit = ['ADMIN', 'TEACHER'].includes(user?.role);

    const [group, setGroup]       = useState(null);
    const [courses, setCourses]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [tab, setTab]           = useState('students');
    const [expandedCourse, setExpandedCourse] = useState(null);

    // Students
    const [stuSearch, setStuSearch] = useState('');

    // Credentials modal
    const [showCreds, setShowCreds]   = useState(false);
    const [credSearch, setCredSearch] = useState('');
    const [copiedKey, setCopiedKey]   = useState(null);

    // Add student modal
    const [showAdd, setShowAdd]   = useState(false);
    const [addForm, setAddForm]   = useState({ prenom: '', nom: '', age: '', email: '', telephone: '', parentNom: '', parentTel: '', parentEmail: '' });
    const [adding, setAdding]     = useState(false);
    const [newCreds, setNewCreds] = useState(null);

    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        if (groupId) { load(); loadCourses(); }
        else setLoading(false);
    }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const load = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const r = await api.get(`/groups/${groupId}`);
            setGroup(r.data);
        } catch (e) {
            setGroup(null);
            setLoadError(e.response?.status === 404 ? 'Groupe introuvable' : (e.response?.data?.message || 'Impossible de charger le groupe'));
        } finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        try {
            const r = await api.get(`/groups/${groupId}/courses`);
            setCourses(r.data);
        } catch (e) { console.error(e); }
    };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleAddStudent = async () => {
        if (!addForm.prenom || !addForm.nom) return alert('Prénom et nom obligatoires');
        setAdding(true);
        try {
            const r = await api.post('/students', { ...addForm, groupId: parseInt(groupId) });
            setNewCreds(r.data.credentials);
            setAddForm({ prenom: '', nom: '', age: '', email: '', telephone: '', parentNom: '', parentTel: '', parentEmail: '' });
            setShowAdd(false);
            load();
        } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
        setAdding(false);
    };

    const toggleCourseLock = async (course) => {
        if (!isAdmin) return;
        try {
            await api.put(`/courses/${course.id}`, { lockedByAdmin: !course.lockedByAdmin });
            loadCourses();
        } catch { alert('Erreur'); }
    };

    // Print students list
    const handlePrint = () => {
        const enrollments = group?.enrollments || [];
        const loginUrl = `codinghost.fr/login/${AUDIENCES[group?.audience]?.slug || ''}`;
        const win = window.open('', '_blank');
        if (!win) { alert('Autorisez les fenêtres pop-up pour imprimer la liste.'); return; }
        win.document.write(`
      <html><head><title>${esc(group?.titre)} — Liste étudiants</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 32px; background: #fff; color: #111; }
        h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #1A1040; }
        .meta { font-size: 13px; color: #6B7280; margin-bottom: 32px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 18px 20px; display: flex; align-items: flex-start; gap: 16px; }
        .av { width: 52px; height: 52px; border-radius: 10px; background: #5B2EE8; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
        .name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .row { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 4px; color: #374151; }
        .label { font-weight: 600; color: #6B7280; min-width: 70px; }
        .val { font-family: monospace; font-size: 14px; font-weight: 700; color: #1A1040; }
        .url { color: #5B2EE8; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${esc(group?.titre)}</h1>
      <div class="meta">
        ${group?.teacher ? `👨‍🏫 ${esc(group.teacher.prenom)} ${esc(group.teacher.nom)} · ` : ''}
        ${group?.lieu ? `📍 ${esc(group.lieu)} · ` : ''}
        ${enrollments.length} étudiant(s)
      </div>
      <div class="grid">
        ${enrollments.map(e => `
          <div class="card">
            <div class="av">${esc((e.student?.user?.prenom?.[0]||'').toUpperCase())}</div>
            <div>
              <div class="name">${esc(e.student?.user?.prenom)} ${esc(e.student?.user?.nom)}</div>
              <div class="row"><span class="label">Login :</span> <span class="val">${esc(e.student?.user?.login)}</span></div>
              <div class="row"><span class="label">Mot de passe :</span> <span class="val">${esc(e.student?.user?.plainPassword || '—')}</span></div>
              <div class="row"><span class="label url">🖥</span> <span style="color:#5B2EE8">${loginUrl}</span></div>
              ${e.student?.parentTel ? `<div class="row"><span class="label">📞</span> ${esc(e.student.parentTel)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
        win.document.close();
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>;
    if (!group) return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{loadError || 'Groupe introuvable'}</div>
            <button style={g.btnSec} onClick={onBack}>← Retour aux groupes</button>
        </div>
    );
    const A = AUDIENCES[group.audience] || AUDIENCES.ENFANT;
    const isKidGroup = group.audience !== 'ADULTE';

    const enrollments = group.enrollments || [];
    const filtEnrollments = enrollments.filter(e => {
        const q = stuSearch.toLowerCase();
        return `${e.student?.user?.prenom} ${e.student?.user?.nom} ${e.student?.user?.login}`.toLowerCase().includes(q);
    });
    const credEnrollments = enrollments.filter(e =>
        `${e.student?.user?.prenom} ${e.student?.user?.nom}`.toLowerCase().includes(credSearch.toLowerCase())
    );

    const SC = {
        ACTIF:       { c: '#059669', bg: '#ECFDF5', br: '#A7F3D0', lbl: 'Actif' },
        INSCRIPTION: { c: '#D97706', bg: '#FFFBEB', br: '#FDE68A', lbl: 'Inscription en cours' },
        SUSPENDU:    { c: '#DC2626', bg: '#FEF2F2', br: '#FECACA', lbl: 'Suspendu' },
        TERMINE:     { c: '#6B7280', bg: '#F9FAFB', br: '#E5E7EB', lbl: 'Terminé' },
    };
    const sc = SC[group.statut] || SC.INSCRIPTION;

    return (
        <div>
            {/* Back */}
            <button style={g.backBtn} onClick={onBack}>
                <Icon name="back" size={14} color="#6B7280" /> Retour aux groupes
            </button>

            {/* ── Info header ── */}
            <div style={g.header}>
                <div style={g.headerLeft}>
                    <div style={{ ...g.hAv, background: A.gradient }}>{group.titre?.[0]}{group.titre?.[1]}</div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <h1 style={g.hTitle}>{group.titre}</h1>
                            <AudienceBadge audience={group.audience} />
                            <Chip color={sc.c} bg={sc.bg} border={sc.br}>{sc.lbl}</Chip>
                            <Chip color="#6B7280" bg="#F3F4F6">
                                {group.format === 'OFFLINE' ? 'Présentiel' : group.format === 'ONLINE' ? 'En ligne' : 'Hybride'}
                            </Chip>
                        </div>
                        <div style={g.hMeta}>
                            {group.teacher && <span style={g.mChip}><Avatar user={group.teacher} size={18} />{group.teacher.prenom} {group.teacher.nom}</span>}
                            {group.ville && <span style={g.mChip}><Icon name="location" size={12} color="#6B7280" />{group.ville}</span>}
                            {group.supervisor && <span style={g.mChip}><Icon name="user" size={12} color="#6B7280" />Superviseur : {group.supervisor.prenom} {group.supervisor.nom}</span>}
                            {group.lieu && <span style={g.mChip}><Icon name="location" size={12} color="#6B7280" />{group.lieu}</span>}
                            <span style={g.mChip}><Icon name="users" size={12} color="#6B7280" />{enrollments.length} étudiant(s)</span>
                            <span style={g.mChip}><Icon name="book" size={12} color="#6B7280" />{courses.length} cours</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs — style "underline" comme dans la photo ── */}
            <div style={g.tabBar}>
                {[
                    { key: 'students', lbl: 'Étudiants',          cnt: enrollments.length },
                    { key: 'courses',  lbl: 'Leçons et cours',    cnt: courses.length },
                ].map(t => (
                    <button key={t.key}
                            style={{ ...g.tab, ...(tab === t.key ? g.tabOn : {}) }}
                            onClick={() => setTab(t.key)}>
                        {t.lbl}
                        <span style={{ ...g.tabCnt, background: tab === t.key ? '#5B2EE8' : '#E5E7EB', color: tab === t.key ? '#fff' : '#6B7280' }}>
              {t.cnt}
            </span>
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════
          TAB — ÉTUDIANTS
      ════════════════════════════════════════ */}
            {tab === 'students' && (
                <div style={g.panel}>
                    {/* Toolbar like in the photo */}
                    <div style={g.toolbar}>
                        <div style={g.searchBox}>
                            <Icon name="search" size={14} color="#9CA3AF" />
                            <input style={g.searchIn} placeholder="Rechercher..." value={stuSearch} onChange={e => setStuSearch(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button style={g.btnSec} onClick={() => setShowCreds(true)}>
                                <Icon name="key" size={13} color="#5B2EE8" /> Identifiants
                            </button>
                            <button style={g.btnSec} onClick={handlePrint}>
                                <Icon name="print" size={13} color="#5B2EE8" /> Imprimer liste
                            </button>
                            {canEdit && (
                                <button style={g.btnSec} onClick={() => navigate(`/emails?group=${group.id}`)}>
                                    ✉ {group.audience === 'ADULTE' ? 'Email au groupe' : 'Email aux parents'}
                                </button>
                            )}
                            {canEdit && (
                                <button style={g.btnPri} onClick={() => setShowAdd(true)}>
                                    <Icon name="plus" size={13} color="#fff" /> Ajouter étudiant
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    {enrollments.length === 0 ? (
                        <div style={g.empty}>
                            <div style={g.emptyIco}><Icon name="users" size={28} color="#9CA3AF" /></div>
                            <div style={g.emptyT}>Aucun étudiant dans ce groupe</div>
                            {canEdit && (
                                <button style={g.btnPri} onClick={() => setShowAdd(true)}>
                                    <Icon name="plus" size={13} color="#fff" /> Ajouter le premier étudiant
                                </button>
                            )}
                        </div>
                    ) : (
                        <table style={g.table}>
                            <thead>
                            <tr>
                                {['Nom, Prénom', ...(isKidGroup ? ['Âge'] : []), 'Présences', 'Taux', ...(isKidGroup ? ['Parent', 'Téléphone'] : ['Email', 'Téléphone']), 'Inscrit le'].map(h => (
                                    <th key={h} style={g.th}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {filtEnrollments.map(e => {
                                const att  = e.attendance || [];
                                const pr   = att.filter(a => a.statut === 'PRESENT').length;
                                const taux = att.length > 0 ? Math.round((pr / att.length) * 100) : 100;
                                const tc   = taux >= 80 ? '#059669' : taux >= 60 ? '#D97706' : '#DC2626';
                                const tbg  = taux >= 80 ? '#ECFDF5' : taux >= 60 ? '#FFFBEB' : '#FEF2F2';
                                return (
                                    <tr key={e.id} style={g.tr}>
                                        <td style={g.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Avatar user={e.student?.user} size={32} />
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>
                                                        {e.student?.user?.prenom} {e.student?.user?.nom}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                                                        {e.student?.user?.login}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {isKidGroup && <td style={g.td}>{e.student?.age ? `${e.student.age} ans` : '—'}</td>}
                                        <td style={g.td}>
                                            {/* Attendance dots like in photo */}
                                            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', maxWidth: '160px' }}>
                                                {att.slice(-16).map((a, ai) => {
                                                    const ac = ATT[a.statut] || ATT.PRESENT;
                                                    return (
                                                        <div key={ai} title={new Date(a.date).toLocaleDateString('fr-FR')} style={{ width: '14px', height: '14px', borderRadius: '3px', background: ac.bg, border: `1px solid ${ac.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: '800', color: ac.color }}>
                                                            {ac.lbl}
                                                        </div>
                                                    );
                                                })}
                                                {att.length === 0 && <span style={{ fontSize: '11px', color: '#D1D5DB', fontStyle: 'italic' }}>Aucune</span>}
                                            </div>
                                        </td>
                                        <td style={g.td}>
                                            <span style={{ ...g.tauxBadge, background: tbg, color: tc }}>{taux}%</span>
                                            <div style={g.tauxBar}><div style={{ ...g.tauxFill, width: `${taux}%`, background: tc }} /></div>
                                            <div style={g.tauxSub}>{pr}/{att.length}</div>
                                        </td>
                                        <td style={g.td}>
                                            {isKidGroup ? (e.student?.parentNom || '—')
                                                : (e.student?.user?.email && !/@(eleve\.)?codinghost\.(fr|dz)$/.test(e.student.user.email) ? e.student.user.email : '—')}
                                        </td>
                                        <td style={g.td}>
                                            {(isKidGroup ? e.student?.parentTel : e.student?.user?.telephone) ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}>
                            <Icon name="phone" size={11} color="#9CA3AF" />{isKidGroup ? e.student.parentTel : e.student.user.telephone}
                          </span>
                                            ) : '—'}
                                        </td>
                                        <td style={g.tdMuted}>
                                            {new Date(e.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════
          TAB — LEÇONS & COURS
      ════════════════════════════════════════ */}
            {tab === 'courses' && (
                <div style={g.panel}>
                    {courses.length === 0 ? (
                        <div style={g.empty}>
                            <div style={g.emptyIco}><Icon name="book" size={28} color="#9CA3AF" /></div>
                            <div style={g.emptyT}>Aucun cours assigné à ce groupe</div>
                            <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px' }}>
                                Ouvrez « Cours {A.label.toLowerCase()} », modifiez un cours et cochez ce groupe.
                            </div>
                            <Link to={`/courses/${A.slug}`} style={{ ...g.btnSec, textDecoration: 'none' }}>Aller aux cours {A.label.toLowerCase()} →</Link>
                        </div>
                    ) : courses.map(course => {
                        const isExpanded = expandedCourse === course.id;
                        const modules = course.modules || [];
                        const nbLessons = modules.reduce((n, m) => n + (m.chapters || []).length, 0);
                        return (
                            <div key={course.id} style={g.courseBlock}>
                                <div style={g.courseTitleBar} onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                                    <div style={g.courseTitleLeft}>
                                        <div style={g.courseIco}><Icon name="book" size={16} color="#5B2EE8" /></div>
                                        <div>
                                            <div style={g.courseTitle}>{course.titre}</div>
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {course.niveau && <span style={g.miniChip}>{course.niveau}</span>}
                                                <span style={g.miniChip}>{modules.length} module(s)</span>
                                                <span style={g.miniChip}>{nbLessons} leçon(s)</span>
                                                {course.lockedByAdmin
                                                    ? <span style={{ ...g.miniChip, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}><Icon name="lock" size={9} color="#DC2626" /> Verrouillé admin</span>
                                                    : <span style={{ ...g.miniChip, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}><Icon name="unlock" size={9} color="#059669" /> Modifiable</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {isAdmin && (
                                            <button
                                                style={{ ...g.lockBtn, ...(course.lockedByAdmin ? g.lockBtnUnlock : g.lockBtnLock) }}
                                                onClick={ev => { ev.stopPropagation(); toggleCourseLock(course); }}
                                            >
                                                <Icon name={course.lockedByAdmin ? 'unlock' : 'lock'} size={13} color={course.lockedByAdmin ? '#059669' : '#DC2626'} />
                                                {course.lockedByAdmin ? 'Déverrouiller' : 'Verrouiller'}
                                            </button>
                                        )}
                                        <Icon name={isExpanded ? 'chevup' : 'chevdown'} size={16} color="#9CA3AF" />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={g.chapContainer}>
                                        <div style={g.lessonTableHead}>
                                            <span style={{ minWidth: '30px' }}>#</span>
                                            <span style={{ flex: 1 }}>Leçon</span>
                                            <span style={{ minWidth: '220px', textAlign: 'right' }}>Contenu</span>
                                        </div>
                                        {modules.map(mod => (
                                            <div key={mod.id}>
                                                <div style={g.chapGroupHeader}>
                                                    <span style={g.chapGroupName}>{mod.titre}</span>
                                                    <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700 }}>{(mod.chapters || []).length} leçon(s)</span>
                                                </div>
                                                {(mod.chapters || []).map((les, li) => (
                                                    <div key={les.id} style={{ ...g.lessonRow, background: li % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                                        <span style={g.lessonNum}>{li + 1}</span>
                                                        <div style={{ flex: 1, fontWeight: 600, fontSize: '13px', color: '#111827' }}>{les.titre}</div>
                                                        <div style={{ minWidth: '220px', display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                            {les.objectives && <span style={{ ...g.taskTag, background: '#EDE9FE', color: '#7C3AED' }}>Objectifs</span>}
                                                            {les.studentSlidesUrl && <span style={{ ...g.taskTag, background: '#EDE8FF', color: '#5B2EE8' }}>Slides</span>}
                                                            {les.imageUrl && <span style={{ ...g.taskTag, background: '#ECFDF5', color: '#059669' }}>Image</span>}
                                                            {les._count?.quizQuestions > 0 && <span style={{ ...g.taskTag, background: '#FFFBEB', color: '#B45309' }}>Quiz ({les._count.quizQuestions})</span>}
                                                            {les.challengeContent && <span style={{ ...g.taskTag, background: '#FEF2F2', color: '#DC2626' }}>Challenge</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(mod.chapters || []).length === 0 && (
                                                    <div style={{ padding: '12px 20px', fontSize: '12px', color: '#D1D5DB', fontStyle: 'italic' }}>Aucune leçon dans ce module</div>
                                                )}
                                            </div>
                                        ))}
                                        {modules.length === 0 && (
                                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>Aucun module</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ════════════════════════════════════════
          MODAL — IDENTIFIANTS
      ════════════════════════════════════════ */}
            {showCreds && (
                <div style={g.overlay} onClick={() => setShowCreds(false)}>
                    <div style={g.modal} onClick={e => e.stopPropagation()}>
                        <div style={g.mHead}>
                            <div style={g.mIco}><Icon name="key" size={20} color="#5B2EE8" /></div>
                            <div>
                                <h2 style={g.mTitle}>Identifiants de connexion</h2>
                                <p style={g.mSub}>{enrollments.length} étudiant(s) · {group.titre}</p>
                            </div>
                        </div>

                        <div style={g.searchBox}>
                            <Icon name="search" size={14} color="#9CA3AF" />
                            <input style={g.searchIn} placeholder="Filtrer..." value={credSearch} onChange={e => setCredSearch(e.target.value)} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', marginTop: '12px' }}>
                            {credEnrollments.map(e => (
                                <div key={e.id} style={g.credCard}>
                                    <Avatar user={e.student?.user} size={38} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827', marginBottom: '4px' }}>
                                            {e.student?.user?.prenom} {e.student?.user?.nom}
                                        </div>
                                        <div style={g.credLine}>
                                            <span style={g.credLbl}>Login :</span>
                                            <span style={g.credVal}>{e.student?.user?.login}</span>
                                            <button style={g.copyBtn} onClick={() => copyText(e.student?.user?.login, `l-${e.id}`)}>
                                                <Icon name={copiedKey === `l-${e.id}` ? 'check' : 'copy'} size={13} color={copiedKey === `l-${e.id}` ? '#059669' : '#9CA3AF'} />
                                            </button>
                                        </div>
                                        <div style={g.credLine}>
                                            <span style={g.credLbl}>Mdp :</span>
                                            <span style={{ ...g.credVal, color: e.student?.user?.plainPassword ? '#5B2EE8' : '#D1D5DB' }}>
                        {e.student?.user?.plainPassword || '(non disponible)'}
                      </span>
                                            {e.student?.user?.plainPassword && (
                                                <button style={g.copyBtn} onClick={() => copyText(e.student?.user?.plainPassword, `p-${e.id}`)}>
                                                    <Icon name={copiedKey === `p-${e.id}` ? 'check' : 'copy'} size={13} color={copiedKey === `p-${e.id}` ? '#059669' : '#9CA3AF'} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={g.mFoot}>
                            <button style={g.btnSec} onClick={() => {
                                const txt = credEnrollments.map(e =>
                                    `${e.student?.user?.prenom} ${e.student?.user?.nom} | Login: ${e.student?.user?.login} | Mdp: ${e.student?.user?.plainPassword||'?'}`
                                ).join('\n');
                                navigator.clipboard.writeText(txt);
                            }}>
                                <Icon name="copy" size={13} color="#5B2EE8" /> Tout copier
                            </button>
                            <button style={g.btnSec} onClick={handlePrint}>
                                <Icon name="print" size={13} color="#5B2EE8" /> Imprimer
                            </button>
                            <button style={g.btnPri} onClick={() => setShowCreds(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
          MODAL — AJOUTER ÉTUDIANT
      ════════════════════════════════════════ */}
            {showAdd && (
                <div style={g.overlay} onClick={() => setShowAdd(false)}>
                    <div style={g.modal} onClick={e => e.stopPropagation()}>
                        <div style={g.mHead}>
                            <div style={g.mIco}><Icon name="plus" size={20} color="#5B2EE8" /></div>
                            <div>
                                <h2 style={g.mTitle}>Ajouter un élève {A.labelOne.toLowerCase()}</h2>
                                <p style={g.mSub}>Sera assigné automatiquement au groupe <strong>{group.titre}</strong></p>
                            </div>
                        </div>

                        <div style={g.formSec}>
                            <div style={g.formSecTitle}><Icon name="user" size={12} color="#6B7280" /> Étudiant</div>
                            <div style={g.fGrid}>
                                {[
                                    { lbl: 'Prénom *', k: 'prenom', ph: 'Prénom' },
                                    { lbl: 'Nom *',    k: 'nom',    ph: 'Nom' },
                                    ...(isKidGroup
                                        ? [{ lbl: 'Âge', k: 'age', ph: 'ex: 10', t: 'number' }]
                                        : [{ lbl: 'Email', k: 'email', ph: 'email@exemple.com', t: 'email' }, { lbl: 'Téléphone', k: 'telephone', ph: '06 XX XX XX XX' }]),
                                ].map(f => (
                                    <div key={f.k} style={g.fg}>
                                        <label style={g.fl}>{f.lbl}</label>
                                        <input style={g.fi} type={f.t||'text'} placeholder={f.ph} value={addForm[f.k]} onChange={e => setAddForm({ ...addForm, [f.k]: e.target.value })} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isKidGroup && <div style={g.formSec}>
                            <div style={g.formSecTitle}><Icon name="phone" size={12} color="#6B7280" /> Parent / Tuteur</div>
                            <div style={g.fGrid}>
                                {[
                                    { lbl: 'Nom du parent', k: 'parentNom',   ph: 'Nom complet' },
                                    { lbl: 'Téléphone',     k: 'parentTel',   ph: '+33 X XX XX XX XX' },
                                    { lbl: 'Email',         k: 'parentEmail', ph: 'email@exemple.com', t: 'email' },
                                ].map(f => (
                                    <div key={f.k} style={g.fg}>
                                        <label style={g.fl}>{f.lbl}</label>
                                        <input style={g.fi} type={f.t||'text'} placeholder={f.ph} value={addForm[f.k]} onChange={e => setAddForm({ ...addForm, [f.k]: e.target.value })} />
                                    </div>
                                ))}
                            </div>
                        </div>}

                        <div style={g.mFoot}>
                            <button style={g.btnSec} onClick={() => setShowAdd(false)}>Annuler</button>
                            <button style={{ ...g.btnPri, opacity: adding ? 0.7 : 1 }} onClick={handleAddStudent} disabled={adding}>
                                <Icon name="plus" size={13} color="#fff" />{adding ? 'Création...' : "Créer l'étudiant"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
          MODAL — NOUVEAUX IDENTIFIANTS
      ════════════════════════════════════════ */}
            {newCreds && (
                <div style={g.overlay} onClick={() => setNewCreds(null)}>
                    <div style={{ ...g.modal, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '54px', height: '54px', background: '#ECFDF5', border: '2px solid #A7F3D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Icon name="check" size={26} color="#059669" />
                            </div>
                            <h2 style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>Étudiant créé !</h2>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Transmettez ces identifiants à l'étudiant</p>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                            {[{ lbl: 'Login', val: newCreds.login, k: 'nl' }, { lbl: 'Mot de passe', val: newCreds.password, k: 'np' }].map(r => (
                                <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                                    <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700', minWidth: '96px' }}>{r.lbl}</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', color: '#5B2EE8', flex: 1 }}>{r.val}</span>
                                    <button style={g.copyBtn} onClick={() => copyText(r.val, r.k)}>
                                        <Icon name={copiedKey === r.k ? 'check' : 'copy'} size={15} color={copiedKey === r.k ? '#059669' : '#9CA3AF'} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div style={g.mFoot}>
                            <button style={g.btnSec} onClick={() => navigator.clipboard.writeText(`Login: ${newCreds.login}\nMot de passe: ${newCreds.password}`)}>
                                <Icon name="copy" size={13} color="#5B2EE8" /> Copier tout
                            </button>
                            <button style={g.btnPri} onClick={() => setNewCreds(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const g = {
    backBtn:    { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' },
    header:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px 24px', marginBottom: '0px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    headerLeft: { display: 'flex', alignItems: 'flex-start', gap: '16px' },
    hAv:        { width: '52px', height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg,#5B2EE8,#8B5CF6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', flexShrink: 0 },
    hTitle:     { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 },
    hMeta:      { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' },
    mChip:      { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '3px 9px', borderRadius: '6px' },
    // Tabs — underline style
    tabBar:     { display: 'flex', borderBottom: '2px solid #E5E7EB', marginTop: '20px', marginBottom: '0' },
    tab:        { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 20px', border: 'none', background: 'transparent', fontWeight: '700', fontSize: '14px', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' },
    tabOn:      { color: '#5B2EE8', borderBottomColor: '#5B2EE8' },
    tabCnt:     { fontSize: '11px', fontWeight: '800', padding: '1px 7px', borderRadius: '50px' },
    panel:      { background: '#fff', border: '1px solid #E5E7EB', borderTop: 'none', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '0 0 14px 14px' },
    toolbar:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', gap: '12px', flexWrap: 'wrap' },
    searchBox:  { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '7px 12px', flex: 1, maxWidth: '280px' },
    searchIn:   { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#111827', width: '100%' },
    btnPri:     { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 15px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    btnSec:     { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '8px', color: '#374151', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
    empty:      { padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    emptyIco:   { width: '60px', height: '60px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyT:     { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '700', color: '#374151' },
    table:      { width: '100%', borderCollapse: 'collapse' },
    th:         { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6B7280', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' },
    tr:         { borderBottom: '1px solid #F3F4F6' },
    td:         { padding: '12px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#111827' },
    tdMuted:    { padding: '12px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#9CA3AF' },
    tauxBadge:  { display: 'inline-flex', padding: '2px 8px', borderRadius: '50px', fontSize: '12px', fontWeight: '800' },
    tauxBar:    { width: '52px', height: '3px', background: '#E5E7EB', borderRadius: '50px', overflow: 'hidden', margin: '3px 0' },
    tauxFill:   { height: '100%', borderRadius: '50px' },
    tauxSub:    { fontSize: '10px', color: '#9CA3AF', fontWeight: '600' },
    // Courses
    courseBlock:     { border: 'none', borderBottom: '1px solid #E5E7EB' },
    courseTitleBar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', background: '#fff', gap: '12px', flexWrap: 'wrap' },
    courseTitleLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
    courseIco:       { width: '36px', height: '36px', background: '#EDE8FF', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    courseTitle:     { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '700', color: '#111827' },
    miniChip:        { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', background: '#F3F4F6', color: '#6B7280' },
    lockBtn:         { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', flexShrink: 0 },
    lockBtnLock:     { background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' },
    lockBtnUnlock:   { background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' },
    chapContainer:   { background: '#FAFAFA', borderTop: '1px solid #E5E7EB' },
    lessonTableHead: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' },
    chapGroupHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'rgba(91,46,232,0.05)', borderBottom: '1px solid #E5E7EB', gap: '10px' },
    chapGroupName:   { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#5B2EE8', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statusBadge:     { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
    lessonRow:       { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '1px solid #F3F4F6' },
    lessonNum:       { minWidth: '30px', fontSize: '12px', color: '#9CA3AF', fontWeight: '700' },
    taskTag:         { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', marginTop: '3px' },
    statusPill:      { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
    // Modals
    overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:      { background: '#fff', borderRadius: '16px', padding: '28px', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
    mHead:      { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' },
    mIco:       { width: '44px', height: '44px', background: '#EDE8FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    mTitle:     { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 2px' },
    mSub:       { fontSize: '12px', color: '#9CA3AF', margin: 0 },
    mFoot:      { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' },
    credCard:   { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px' },
    credLine:   { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
    credLbl:    { fontSize: '10px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', minWidth: '30px' },
    credVal:    { fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#111827', flex: 1 },
    copyBtn:    { width: '26px', height: '26px', background: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 },
    formSec:    { marginBottom: '14px', padding: '14px 16px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px' },
    formSecTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
    fGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    fg:         { display: 'flex', flexDirection: 'column', gap: '4px' },
    fl:         { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi:         { padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', color: '#111827', outline: 'none', background: '#fff', fontFamily: 'inherit' },
};