import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
    const a = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' };
    const icons = {
        plus:    <svg {...a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        mail:    <svg {...a}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
        check:   <svg {...a} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        euro:    <svg {...a}><path d="M4 10h12"/><path d="M4 14h12"/><path d="M19.5 9.5c-1-1.7-2.9-2.8-5-2.8a6 6 0 0 0 0 12c2.1 0 4-1.1 5-2.8"/></svg>,
        alert:   <svg {...a}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        clock:   <svg {...a}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        file:    <svg {...a}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
        send:    <svg {...a}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
        search:  <svg {...a}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
        refresh: <svg {...a}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
        eye:     <svg {...a}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        trash:   <svg {...a}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
        dl:      <svg {...a}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
        map:     <svg {...a}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    };
    return icons[name] ? <span style={{display:'inline-flex',alignItems:'center',flexShrink:0}}>{icons[name]}</span> : null;
};

const fmt      = (n) => `${Number(n||0).toFixed(2).replace('.', ',')} €`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const daysLate = (d) => Math.max(0, Math.floor((new Date()-new Date(d))/(1000*60*60*24)));

const STATUS = {
    DRAFT:     { label:'Brouillon', color:'#6B7280', bg:'#F3F4F6', border:'#E5E7EB' },
    ACTIVE:    { label:'Actif',     color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
    COMPLETED: { label:'Soldé',     color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
    CANCELLED: { label:'Annulé',    color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};
const INST = {
    PENDING: { label:'En attente', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
    PAID:    { label:'Payé',       color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
    LATE:    { label:'En retard',  color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
};
const MODE   = { ONCE:'1 fois', THREE_TIMES:'3 fois', MONTHLY:'Mensuel' };
const VILLES = ['Toutes', 'Thionville', 'Metz'];

// ── Formulaire HORS composant (fix bug curseur) ────────────
const ContractForm = ({ form, onChange, students, groups, villeFilter }) => {
    const filteredGroups = villeFilter && villeFilter !== 'Toutes'
        ? groups.filter(g => g.ville === villeFilter || !g.ville)
        : groups;

    return (
        <div>
            <div style={fs.sec}>
                <div style={fs.stitle}>👤 Élève &amp; Parent</div>
                <div style={fs.g2}>
                    <div style={fs.fg}><label style={fs.lb}>Élève *</label>
                        <select style={fs.fi} value={form.studentId} onChange={e => onChange('studentId', e.target.value)}>
                            <option value="">— Choisir —</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.user?.prenom} {s.user?.nom}</option>)}
                        </select></div>
                    <div style={fs.fg}><label style={fs.lb}>Groupe *</label>
                        <select style={fs.fi} value={form.groupId} onChange={e => onChange('groupId', e.target.value)}>
                            <option value="">— Choisir —</option>
                            {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.titre} {g.ville?`(${g.ville})`:''}</option>)}
                        </select></div>
                    <div style={fs.fg}><label style={fs.lb}>Nom parent *</label>
                        <input style={fs.fi} placeholder="Mr/Mme Dupont" value={form.parentName} onChange={e => onChange('parentName', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Email parent</label>
                        <input style={fs.fi} type="email" placeholder="parent@email.com" value={form.parentEmail} onChange={e => onChange('parentEmail', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Ville *</label>
                        <select style={fs.fi} value={form.ville} onChange={e => onChange('ville', e.target.value)}>
                            <option value="Thionville">Thionville</option>
                            <option value="Metz">Metz</option>
                        </select></div>
                </div>
            </div>

            <div style={fs.sec}>
                <div style={fs.stitle}>📋 Cours</div>
                <div style={fs.g2}>
                    <div style={fs.fg}><label style={fs.lb}>Nom du cours *</label>
                        <input style={fs.fi} placeholder="ex: Game Design" value={form.courseName} onChange={e => onChange('courseName', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Année scolaire</label>
                        <input style={fs.fi} value={form.schoolYear} onChange={e => onChange('schoolYear', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Jour &amp; horaire</label>
                        <input style={fs.fi} placeholder="Mercredi de 15h à 16h30" value={form.courseDay} onChange={e => onChange('courseDay', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Date de début</label>
                        <input style={fs.fi} placeholder="10 Décembre 2025" value={form.courseStartDate} onChange={e => onChange('courseStartDate', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Nb de cours</label>
                        <input style={fs.fi} type="number" value={form.nbCours} onChange={e => onChange('nbCours', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Prix total (€) *</label>
                        <input style={fs.fi} type="number" step="0.01" placeholder="ex: 640" value={form.totalAmount} onChange={e => onChange('totalAmount', e.target.value)} /></div>
                </div>
            </div>

            <div style={fs.sec}>
                <div style={fs.stitle}>💰 Acompte &amp; Paiement</div>
                <div style={fs.g2}>
                    <div style={fs.fg}><label style={fs.lb}>Acompte (€)</label>
                        <input style={fs.fi} type="number" value={form.depositAmount} onChange={e => onChange('depositAmount', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Mode règlement acompte</label>
                        <select style={fs.fi} value={form.depositMethod} onChange={e => onChange('depositMethod', e.target.value)}>
                            <option value="">— Non encore payé —</option>
                            <option value="SumUp">Carte SumUp</option>
                            <option value="virement">Virement</option>
                            <option value="espèces">Espèces</option>
                            <option value="chèque">Chèque</option>
                        </select></div>
                    <div style={fs.fg}><label style={fs.lb}>Date paiement acompte</label>
                        <input style={fs.fi} type="date" value={form.depositPaidAt} onChange={e => onChange('depositPaidAt', e.target.value)} /></div>
                    <div style={fs.fg}><label style={fs.lb}>Mode paiement solde</label>
                        <select style={fs.fi} value={form.paymentMode} onChange={e => onChange('paymentMode', e.target.value)}>
                            <option value="ONCE">En 1 fois</option>
                            <option value="THREE_TIMES">En 3 fois</option>
                            <option value="MONTHLY">Mensuel (90€/mois)</option>
                        </select></div>
                    <div style={fs.fg}><label style={fs.lb}>Date signature</label>
                        <input style={fs.fi} type="date" value={form.signedAt} onChange={e => onChange('signedAt', e.target.value)} /></div>
                </div>
                {form.totalAmount && form.depositAmount && (
                    <div style={fs.preview}>
                        Reste à payer : <strong>{fmt(parseFloat(form.totalAmount||0)-parseFloat(form.depositAmount||0))}</strong>
                        {form.paymentMode==='THREE_TIMES' && <span style={{marginLeft:'12px',color:'#6B7280'}}>→ 3 × {fmt((parseFloat(form.totalAmount||0)-parseFloat(form.depositAmount||0))/3)}</span>}
                        {form.paymentMode==='MONTHLY'     && <span style={{marginLeft:'12px',color:'#6B7280'}}>→ mensualités 90 €</span>}
                    </div>
                )}
            </div>

            <div style={fs.sec}>
                <div style={fs.stitle}>📝 Notes</div>
                <textarea style={{...fs.fi, minHeight:'70px', resize:'vertical'}} placeholder="Notes internes..." value={form.notes} onChange={e => onChange('notes', e.target.value)} />
            </div>
        </div>
    );
};

// ── Composant principal ────────────────────────────────────
export default function Billing() {
    const { user }  = useAuth();
    const isAdmin   = user?.role === 'ADMIN';

    const [tab, setTab]               = useState('dashboard');
    const [villeFilter, setVilleFilter] = useState('Toutes');
    const [contracts, setContracts]   = useState([]);
    const [stats, setStats]           = useState(null);
    const [students, setStudents]     = useState([]);
    const [groups, setGroups]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showAdd, setShowAdd]       = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [showPay, setShowPay]       = useState(null);
    const [saving, setSaving]         = useState(false);
    const [emailSending, setEmailSending] = useState(null);
    const [toast, setToast]           = useState(null);
    const [dlLoading, setDlLoading]   = useState(null); // ← état de chargement PDF

    const emptyForm = {
        studentId:'', groupId:'', parentName:'', parentEmail:'', ville:'Thionville',
        courseName:'', schoolYear:'2025-2026', courseDay:'', courseStartDate:'',
        nbCours:32, totalAmount:'', depositAmount:100, depositMethod:'',
        depositPaidAt:'', paymentMode:'ONCE', signedAt:'', notes:'',
    };
    const [form, setForm]       = useState(emptyForm);
    const [payForm, setPayForm] = useState({ paidAmount:'', method:'virement', reference:'', paidAt:new Date().toISOString().split('T')[0] });

    useEffect(() => { fetchAll(); }, [villeFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = villeFilter !== 'Toutes' ? `?ville=${villeFilter}` : '';
            const [cRes, sRes, gRes] = await Promise.all([
                api.get(`/billing/contracts${params}`),
                api.get('/students'),
                api.get('/groups'),
            ]);
            setContracts(cRes.data);
            setStudents(sRes.data);
            setGroups(gRes.data);
            try {
                const stRes = await api.get(`/billing/stats${params}`);
                setStats(stRes.data);
            } catch {}
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const showToast = (msg, type='success') => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3500);
    };

    const handleFormChange = (field, value) => setForm(f => ({...f, [field]:value}));

    const createContract = async () => {
        if (!form.studentId||!form.groupId||!form.totalAmount||!form.parentName||!form.courseName)
            return alert('Champs obligatoires : élève, groupe, nom parent, cours, prix total');
        setSaving(true);
        try {
            await api.post('/billing/contracts', {
                ...form,
                nbCours:       parseInt(form.nbCours),
                totalAmount:   parseFloat(form.totalAmount),
                depositAmount: parseFloat(form.depositAmount),
            });
            setShowAdd(false);
            setForm(emptyForm);
            fetchAll();
            showToast('Contrat créé avec succès !');
        } catch (err) { alert(err.response?.data?.message||'Erreur'); }
        setSaving(false);
    };

    const markPaid = async () => {
        setSaving(true);
        try {
            await api.put(`/billing/installments/${showPay.id}/pay`, payForm);
            setShowPay(null);
            setPayForm({ paidAmount:'', method:'virement', reference:'', paidAt:new Date().toISOString().split('T')[0] });
            if (showDetail) {
                const r = await api.get(`/billing/contracts/${showDetail.id}`);
                setShowDetail(r.data);
            }
            fetchAll();
            showToast('Paiement enregistré !');
        } catch { alert('Erreur'); }
        setSaving(false);
    };

    const checkLate = async () => {
        try { const r = await api.post('/billing/installments/check-late'); showToast(r.data.message); fetchAll(); }
        catch { showToast('Erreur','error'); }
    };

    const sendEmail = async (type, id) => {
        setEmailSending(`${type}-${id}`);
        try {
            const urls = {
                invoice:  `/billing/contracts/${id}/send-invoice`,
                contract: `/billing/contracts/${id}/send-contract`,
                receipt:  `/billing/installments/${id}/send-receipt`,
                reminder: `/billing/installments/${id}/send-reminder`,
            };
            await api.post(urls[type]);
            showToast('Email envoyé avec PDF en pièce jointe !');
        } catch (err) { showToast(err.response?.data?.message||'Erreur email','error'); }
        setEmailSending(null);
    };

    // ✅ FIX — Téléchargement PDF via axios (token JWT envoyé automatiquement)
    const downloadPdf = async (type, id, number) => {
        const key = `${type}-${id}`;
        setDlLoading(key);
        try {
            const endpoint = type === 'invoice' ? 'invoice-pdf' : 'contract-pdf';
            const res = await api.get(
                `/billing/contracts/${id}/${endpoint}`,
                { responseType: 'blob' }
            );
            const blob    = new Blob([res.data], { type: 'application/pdf' });
            const url     = URL.createObjectURL(blob);
            const link    = document.createElement('a');
            link.href     = url;
            link.download = type === 'invoice'
                ? `Facture-${number || id}.pdf`
                : `Contrat-${number || id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('PDF téléchargé !');
        } catch (err) {
            console.error('downloadPdf error:', err);
            showToast('Erreur téléchargement PDF', 'error');
        }
        setDlLoading(null);
    };

    const sendAllReminders = async () => {
        if (!window.confirm(`Envoyer des rappels aux ${stats?.lateCount||0} élèves en retard ?`)) return;
        setEmailSending('all');
        try { const r = await api.post('/billing/reminders/send-all'); showToast(`${r.data.sent} rappel(s) envoyé(s) !`); fetchAll(); }
        catch { showToast('Erreur','error'); }
        setEmailSending(null);
    };

    const openDetail = async (c) => {
        const r = await api.get(`/billing/contracts/${c.id}`);
        setShowDetail(r.data);
    };

    const deleteC = async (id) => {
        if (!window.confirm('Supprimer ce contrat ?')) return;
        try { await api.delete(`/billing/contracts/${id}`); fetchAll(); showToast('Supprimé'); }
        catch { showToast('Erreur','error'); }
    };

    const filtered = contracts.filter(c => {
        const q  = search.toLowerCase();
        const ms = !q || `${c.student?.user?.prenom} ${c.student?.user?.nom} ${c.number} ${c.parentName} ${c.courseName}`.toLowerCase().includes(q);
        const mf = !filterStatus || c.status === filterStatus;
        return ms && mf;
    });

    const VilleBadge = ({ ville }) => (
        <span style={{
            padding:'2px 8px', borderRadius:'50px', fontSize:'10px', fontWeight:'800',
            background: ville==='Metz' ? '#EFF6FF' : '#F0FDF4',
            color:      ville==='Metz' ? '#1D4ED8' : '#166534',
            border:    `1px solid ${ville==='Metz' ? '#BFDBFE' : '#BBF7D0'}`,
        }}>
            {ville||'—'}
        </span>
    );

    return (
        <div style={{position:'relative'}}>

            {/* Toast */}
            {toast && (
                <div style={{position:'fixed',top:'70px',right:'20px',zIndex:999,padding:'12px 20px',borderRadius:'10px',
                    background:toast.type==='error'?'#FEF2F2':'#ECFDF5',
                    border:`1px solid ${toast.type==='error'?'#FECACA':'#A7F3D0'}`,
                    color:toast.type==='error'?'#DC2626':'#059669',
                    fontWeight:'700',fontSize:'13px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
                    display:'flex',alignItems:'center',gap:'8px'}}>
                    {toast.type==='error'?'❌':'✅'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={s.ph}>
                <div>
                    <h1 style={s.h1}>💼 Facturation &amp; Contrats</h1>
                    <div style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>Gestion financière CodingHost</div>
                </div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    {/* Filtre ville */}
                    <div style={{display:'flex',background:'#F3F4F6',borderRadius:'8px',padding:'3px',gap:'2px'}}>
                        {VILLES.map(v => (
                            <button key={v} style={{
                                padding:'6px 14px', border:'none', borderRadius:'6px',
                                fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
                                background: villeFilter===v ? (v==='Metz'?'#1D4ED8':v==='Thionville'?'#059669':'#5B2EE8') : 'transparent',
                                color:      villeFilter===v ? '#fff' : '#6B7280',
                            }} onClick={() => setVilleFilter(v)}>{v}</button>
                        ))}
                    </div>
                    <button style={s.btnSec} onClick={checkLate}><Icon name="refresh" size={13} color="#5B2EE8"/> Vérifier retards</button>
                    <button style={s.btnPri} onClick={() => setShowAdd(true)}><Icon name="plus" size={13} color="#fff"/> Nouveau contrat</button>
                </div>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
                {[
                    {key:'dashboard', label:'Tableau de bord'},
                    {key:'contracts', label:`Contrats (${contracts.length})`},
                    {key:'late',      label:'Retards', badge:stats?.lateCount},
                    {key:'sumup',     label:'⚡ SumUp'},
                ].map(t => (
                    <button key={t.key} style={{...s.tab,...(tab===t.key?s.tabOn:{})}} onClick={() => setTab(t.key)}>
                        {t.label}
                        {t.badge>0 && <span style={{background:'#DC2626',color:'#fff',borderRadius:'50px',fontSize:'10px',fontWeight:'800',padding:'1px 6px',marginLeft:'5px'}}>{t.badge}</span>}
                    </button>
                ))}
            </div>

            {/* ════ DASHBOARD ════ */}
            {tab==='dashboard' && (
                <div>
                    {villeFilter !== 'Toutes' && (
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',padding:'10px 16px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'10px',fontSize:'13px',color:'#1D4ED8',fontWeight:'600'}}>
                            <Icon name="map" size={14} color="#1D4ED8"/> Affichage filtré : <strong>{villeFilter}</strong>
                            <button style={{marginLeft:'auto',fontSize:'11px',color:'#6B7280',background:'none',border:'none',cursor:'pointer'}} onClick={() => setVilleFilter('Toutes')}>× Voir tout</button>
                        </div>
                    )}

                    <div style={s.statsGrid}>
                        {[
                            {icon:'euro',  val:fmt(stats?.totalRevenue),     lbl:'Total encaissé',   c:'#059669', bg:'#ECFDF5'},
                            {icon:'clock', val:fmt(stats?.pendingAmount),     lbl:'En attente',       c:'#D97706', bg:'#FFFBEB'},
                            {icon:'alert', val:fmt(stats?.lateAmount),        lbl:'En retard',        c:'#DC2626', bg:'#FEF2F2'},
                            {icon:'file',  val:stats?.activeContracts||0,     lbl:'Contrats actifs',  c:'#5B2EE8', bg:'#EDE8FF'},
                            {icon:'check', val:stats?.completedContracts||0,  lbl:'Contrats soldés',  c:'#059669', bg:'#ECFDF5'},
                            {icon:'euro',  val:stats?.totalContracts||0,      lbl:'Total contrats',   c:'#374151', bg:'#F3F4F6'},
                        ].map((st,i) => (
                            <div key={i} style={s.statCard}>
                                <div style={{...s.statIco, background:st.bg}}><Icon name={st.icon} size={18} color={st.c}/></div>
                                <div><div style={{...s.statVal,color:st.c}}>{st.val}</div><div style={s.statLbl}>{st.lbl}</div></div>
                            </div>
                        ))}
                    </div>

                    {/* Vue comptable par groupe */}
                    <div style={s.panel}>
                        <div style={s.panelH}><span style={{fontWeight:'700',color:'#1A1040',fontSize:'14px'}}>📊 Vue comptable par groupe</span></div>
                        <div style={{overflowX:'auto'}}>
                            <table style={s.tbl}>
                                <thead><tr>{['Groupe','Ville','Élèves','Total contrats','Encaissé','En attente','En retard'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {groups.filter(g => villeFilter==='Toutes'||g.ville===villeFilter||!g.ville).map(g => {
                                    const gc = contracts.filter(c => c.groupId===g.id);
                                    if (!gc.length) return null;
                                    const totalC   = gc.reduce((a,c)=>a+c.totalAmount,0);
                                    const encaisse = gc.reduce((a,c)=>{const dep=c.depositPaidAt?c.depositAmount:0;const inst=(c.installments||[]).filter(i=>i.status==='PAID').reduce((s,i)=>s+(i.paidAmount||i.amount),0);return a+dep+inst;},0);
                                    const attente  = gc.reduce((a,c)=>a+(c.installments||[]).filter(i=>i.status==='PENDING').reduce((s,i)=>s+i.amount,0),0);
                                    const retard   = gc.reduce((a,c)=>a+(c.installments||[]).filter(i=>i.status==='LATE').reduce((s,i)=>s+i.amount,0),0);
                                    return (
                                        <tr key={g.id} style={s.tr}>
                                            <td style={s.td}><strong>{g.titre}</strong></td>
                                            <td style={s.td}><VilleBadge ville={g.ville}/></td>
                                            <td style={s.tdM}>{gc.length}</td>
                                            <td style={s.td}><strong>{fmt(totalC)}</strong></td>
                                            <td style={s.td}><span style={{color:'#059669',fontWeight:'700'}}>{fmt(encaisse)}</span></td>
                                            <td style={s.td}><span style={{color:'#D97706',fontWeight:'700'}}>{fmt(attente)}</span></td>
                                            <td style={s.td}><span style={{color:retard>0?'#DC2626':'#9CA3AF',fontWeight:'700'}}>{fmt(retard)}</span></td>
                                        </tr>
                                    );
                                }).filter(Boolean)}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Retards */}
                    {(stats?.lateStudents||[]).length>0 && (
                        <div style={s.panel}>
                            <div style={s.panelH}>
                                <span style={{fontWeight:'700',color:'#DC2626',fontSize:'14px'}}>⚠️ Paiements en retard ({stats.lateCount})</span>
                                <button style={{...s.btnPri,background:'#DC2626',padding:'7px 14px',fontSize:'12px'}} onClick={sendAllReminders} disabled={emailSending==='all'}>
                                    <Icon name="mail" size={13} color="#fff"/> {emailSending==='all'?'Envoi...':'Envoyer tous les rappels'}
                                </button>
                            </div>
                            <table style={s.tbl}>
                                <thead><tr>{['Élève','Ville','Montant','Échéance','Retard','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {stats.lateStudents.map(ls => (
                                    <tr key={ls.installmentId} style={s.tr}>
                                        <td style={s.td}><strong>{ls.student}</strong></td>
                                        <td style={s.td}><VilleBadge ville={ls.ville}/></td>
                                        <td style={s.td}><span style={{fontWeight:'800',color:'#DC2626'}}>{fmt(ls.amount)}</span></td>
                                        <td style={s.tdM}>{fmtDate(ls.dueDate)}</td>
                                        <td style={s.td}><span style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA',padding:'2px 8px',borderRadius:'5px',fontSize:'11px',fontWeight:'800'}}>{ls.daysLate}j{ls.daysLate>10?' ⚠️ +5%':''}</span></td>
                                        <td style={s.td}>
                                            <div style={{display:'flex',gap:'5px'}}>
                                                <button style={{...s.aBtn,background:'#FEF2F2'}} onClick={() => sendEmail('reminder',ls.installmentId)} disabled={!!emailSending}><Icon name="mail" size={13} color="#DC2626"/></button>
                                                <button style={{...s.aBtn,background:'#ECFDF5'}} onClick={() => {setShowPay({id:ls.installmentId,amount:ls.amount});setPayForm(p=>({...p,paidAmount:ls.amount}));}}><Icon name="check" size={13} color="#059669"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ════ CONTRATS ════ */}
            {tab==='contracts' && (
                <div style={s.panel}>
                    <div style={s.panelH}>
                        <div style={s.searchBox}><Icon name="search" size={13} color="#9CA3AF"/>
                            <input style={s.searchIn} placeholder="Nom, prénom, n° contrat, cours..." value={search} onChange={e=>setSearch(e.target.value)}/>
                        </div>
                        <select style={s.sel} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    {loading ? <div style={s.empty}>Chargement...</div>
                        : filtered.length===0 ? <div style={s.empty}>Aucun contrat</div>
                            : (
                                <div style={{overflowX:'auto'}}>
                                    <table style={s.tbl}>
                                        <thead><tr>{['N°','Élève','Parent','Cours','Ville','Groupe','Total','Acompte','Reste','Mode','Statut','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                        <tbody>
                                        {filtered.map(c => {
                                            const sc   = STATUS[c.status]||STATUS.DRAFT;
                                            const paid = (c.installments||[]).filter(i=>i.status==='PAID').reduce((a,i)=>a+(i.paidAmount||i.amount),0)+(c.depositPaidAt?c.depositAmount:0);
                                            const rest = Math.max(0, c.totalAmount-paid);
                                            return (
                                                <tr key={c.id} style={s.tr}>
                                                    <td style={{...s.tdM,fontFamily:'monospace',fontSize:'11px'}}>{c.number}</td>
                                                    <td style={s.td}><strong>{c.student?.user?.nom?.toUpperCase()} {c.student?.user?.prenom}</strong></td>
                                                    <td style={s.tdM}>{c.parentName||'—'}</td>
                                                    <td style={s.td}>{c.courseName}</td>
                                                    <td style={s.td}><VilleBadge ville={c.ville}/></td>
                                                    <td style={s.tdM}>{c.group?.titre}</td>
                                                    <td style={s.td}><strong>{fmt(c.totalAmount)}</strong></td>
                                                    <td style={s.td}>{c.depositPaidAt?<span style={{color:'#059669',fontWeight:'700'}}>✅ {fmt(c.depositAmount)}</span>:<span style={{color:'#D97706'}}>⏳ {fmt(c.depositAmount)}</span>}</td>
                                                    <td style={s.td}><span style={{color:rest>0?'#D97706':'#059669',fontWeight:'700'}}>{fmt(rest)}</span></td>
                                                    <td style={s.tdM}>{MODE[c.paymentMode]||'—'}</td>
                                                    <td style={s.td}><span style={{padding:'3px 8px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.label}</span></td>
                                                    <td style={s.td}>
                                                        <div style={{display:'flex',gap:'4px'}}>
                                                            <button style={s.aBtn} title="Voir" onClick={()=>openDetail(c)}><Icon name="eye" size={13} color="#5B2EE8"/></button>
                                                            {/* ✅ FIX — boutons PDF via axios */}
                                                            <button style={{...s.aBtn,background:dlLoading===`invoice-${c.id}`?'#D1FAE5':'#ECFDF5',opacity:dlLoading===`invoice-${c.id}`?0.7:1}} title="Facture PDF"
                                                                    onClick={()=>downloadPdf('invoice',c.id,c.number)} disabled={!!dlLoading}>
                                                                <Icon name="dl" size={13} color={dlLoading===`invoice-${c.id}`?'#888':'#059669'}/>
                                                            </button>
                                                            <button style={{...s.aBtn,background:dlLoading===`contract-${c.id}`?'#DBEAFE':'#EFF6FF',opacity:dlLoading===`contract-${c.id}`?0.7:1}} title="Contrat PDF"
                                                                    onClick={()=>downloadPdf('contract',c.id,c.number)} disabled={!!dlLoading}>
                                                                <Icon name="dl" size={13} color={dlLoading===`contract-${c.id}`?'#888':'#1D4ED8'}/>
                                                            </button>
                                                            {c.parentEmail && <button style={{...s.aBtn,background:'#EDE8FF'}} title="Envoyer facture" onClick={()=>sendEmail('invoice',c.id)} disabled={!!emailSending}><Icon name="mail" size={13} color="#5B2EE8"/></button>}
                                                            {isAdmin && <button style={{...s.aBtn,background:'#FEF2F2'}} onClick={()=>deleteC(c.id)}><Icon name="trash" size={13} color="#DC2626"/></button>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                </div>
            )}

            {/* ════ RETARDS ════ */}
            {tab==='late' && (
                <div style={s.panel}>
                    <div style={s.panelH}>
                        <span style={{fontWeight:'700',color:'#DC2626',fontSize:'14px'}}>⚠️ {stats?.lateCount||0} paiement(s) en retard</span>
                        <button style={{...s.btnPri,background:'#DC2626'}} onClick={sendAllReminders} disabled={emailSending==='all'}>
                            <Icon name="send" size={13} color="#fff"/> {emailSending==='all'?'Envoi...':'Envoyer tous les rappels'}
                        </button>
                    </div>
                    {(stats?.lateStudents||[]).length===0
                        ? <div style={s.empty}><div style={{fontSize:'40px',marginBottom:'12px'}}>🎉</div>Aucun retard !</div>
                        : (
                            <table style={s.tbl}>
                                <thead><tr>{['Élève','Ville','Montant dû','Échéance','Retard','Email','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {(stats.lateStudents||[]).map(ls => (
                                    <tr key={ls.installmentId} style={{...s.tr,background:ls.daysLate>10?'#FFF5F5':'#FFFBEB'}}>
                                        <td style={s.td}><strong>{ls.student}</strong></td>
                                        <td style={s.td}><VilleBadge ville={ls.ville}/></td>
                                        <td style={s.td}><span style={{fontWeight:'800',color:'#DC2626',fontSize:'14px'}}>{fmt(ls.amount)}</span></td>
                                        <td style={s.tdM}>{fmtDate(ls.dueDate)}</td>
                                        <td style={s.td}><span style={{background:ls.daysLate>10?'#FEF2F2':'#FFFBEB',color:ls.daysLate>10?'#DC2626':'#D97706',border:`1px solid ${ls.daysLate>10?'#FECACA':'#FDE68A'}`,padding:'3px 10px',borderRadius:'50px',fontSize:'12px',fontWeight:'800'}}>{ls.daysLate}j{ls.daysLate>10?' ⚠️ +5%':''}</span></td>
                                        <td style={s.tdM}>{ls.email||<span style={{color:'#D1D5DB',fontStyle:'italic'}}>—</span>}</td>
                                        <td style={s.td}>
                                            <div style={{display:'flex',gap:'6px'}}>
                                                {ls.email && <button style={{...s.aBtn,background:'#FEF2F2'}} onClick={()=>sendEmail('reminder',ls.installmentId)} disabled={!!emailSending}><Icon name="mail" size={13} color="#DC2626"/></button>}
                                                <button style={{...s.aBtn,background:'#ECFDF5'}} onClick={()=>{setShowPay({id:ls.installmentId,amount:ls.amount});setPayForm(p=>({...p,paidAmount:ls.amount}));}}><Icon name="check" size={13} color="#059669"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                </div>
            )}

            {/* ════ SUMUP ════ */}
            {tab==='sumup' && (
                <div>
                    <div style={{...s.panel,padding:'24px'}}>
                        <h2 style={{fontFamily:'sans-serif',fontSize:'17px',fontWeight:'800',color:'#1A1040',marginBottom:'16px'}}>⚡ Paiement automatique SumUp</h2>
                        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'10px',padding:'16px',marginBottom:'16px',fontSize:'13px',color:'#1D4ED8'}}>
                            <div style={{fontWeight:'700',marginBottom:'8px'}}>Comment ça marche ?</div>
                            <p>Quand un parent paie via le lien SumUp, SumUp envoie automatiquement une notification au serveur. L'application retrouve l'échéance correspondante et la marque comme <strong>Payée</strong>. Le parent reçoit un email de confirmation avec la facture PDF.</p>
                        </div>
                        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Configuration Webhook SumUp</div>
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                {[
                                    {step:'1', text:'Connectez-vous à SumUp → Paramètres → Webhooks'},
                                    {step:'2', text:"Ajoutez l'URL webhook : https://votre-domaine.com/api/billing/webhook/sumup"},
                                    {step:'3', text:'Sélectionnez l\'événement : checkout.completed'},
                                    {step:'4', text:'Sauvegardez — les paiements seront automatiques !'},
                                ].map(item => (
                                    <div key={item.step} style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                                        <div style={{width:'24px',height:'24px',background:'#5B2EE8',color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',flexShrink:0}}>{item.step}</div>
                                        <div style={{fontSize:'13px',color:'#374151',lineHeight:1.6}}>{item.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>En développement local</div>
                            <p style={{fontSize:'13px',color:'#6B7280',marginBottom:'8px'}}>Utilisez <strong>ngrok</strong> pour exposer votre serveur :</p>
                            <div style={{background:'#1A1040',borderRadius:'8px',padding:'12px',fontFamily:'monospace',fontSize:'13px',color:'#A78BFF'}}>npx ngrok http 5000</div>
                        </div>
                        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'10px',padding:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:'700',color:'#8B6200',marginBottom:'8px'}}>⚠️ Communication de paiement</div>
                            <p style={{fontSize:'13px',color:'#7C6500',lineHeight:1.6}}>
                                Demandez aux parents d'indiquer dans la communication : <strong>Prénom Nom / Nom du cours</strong><br/>
                                Exemple : <em>Alexy Raffaeli / Game Design</em>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL DÉTAIL ════ */}
            {showDetail && (
                <div style={s.overlay} onClick={()=>setShowDetail(null)}>
                    <div style={{...s.modal,width:'740px'}} onClick={e=>e.stopPropagation()}>
                        <div style={s.mHead}>
                            <div style={s.mIco}><Icon name="file" size={20} color="#5B2EE8"/></div>
                            <div style={{flex:1}}>
                                <h2 style={s.mTitle}>{showDetail.number} <VilleBadge ville={showDetail.ville}/></h2>
                                <p style={s.mSub}>{showDetail.student?.user?.nom?.toUpperCase()} {showDetail.student?.user?.prenom} · {showDetail.group?.titre}</p>
                            </div>
                            <span style={{padding:'4px 12px',borderRadius:'6px',fontSize:'12px',fontWeight:'700',background:STATUS[showDetail.status]?.bg,color:STATUS[showDetail.status]?.color,border:`1px solid ${STATUS[showDetail.status]?.border}`}}>
                                {STATUS[showDetail.status]?.label}
                            </span>
                        </div>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'16px'}}>
                            {[
                                {l:'Parent',     v:showDetail.parentName||'—'},
                                {l:'Email',      v:showDetail.parentEmail||'—'},
                                {l:'Cours',      v:showDetail.courseName},
                                {l:'Prix total', v:fmt(showDetail.totalAmount)},
                                {l:'Acompte',    v:showDetail.depositPaidAt?`✅ ${fmt(showDetail.depositAmount)} (${fmtDate(showDetail.depositPaidAt)})`:`⏳ ${fmt(showDetail.depositAmount)}`},
                                {l:'Mode solde', v:MODE[showDetail.paymentMode]||'—'},
                                {l:'Horaire',    v:showDetail.courseDay||'—'},
                                {l:'Début',      v:showDetail.courseStartDate||'—'},
                                {l:'Année',      v:showDetail.schoolYear},
                            ].map((item,i) => (
                                <div key={i} style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'8px 12px'}}>
                                    <div style={{fontSize:'10px',fontWeight:'700',color:'#9CA3AF',textTransform:'uppercase',marginBottom:'3px'}}>{item.l}</div>
                                    <div style={{fontSize:'13px',fontWeight:'600',color:'#111827'}}>{item.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Échéancier */}
                        <div style={{marginBottom:'16px'}}>
                            <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Échéancier</div>
                            <table style={s.tbl}>
                                <thead><tr>{['#','Montant','Échéance','Payé le','Mode','Statut','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                {(showDetail.installments||[]).map(inst => {
                                    const ic = INST[inst.status]||INST.PENDING;
                                    return (
                                        <tr key={inst.id} style={s.tr}>
                                            <td style={s.tdM}>{inst.number}</td>
                                            <td style={s.td}><strong>{fmt(inst.amount)}</strong></td>
                                            <td style={s.tdM}>{fmtDate(inst.dueDate)}</td>
                                            <td style={s.tdM}>{inst.paidAt?fmtDate(inst.paidAt):'—'}</td>
                                            <td style={s.tdM}>{inst.method||'—'}</td>
                                            <td style={s.td}><span style={{padding:'2px 8px',borderRadius:'5px',fontSize:'11px',fontWeight:'700',background:ic.bg,color:ic.color,border:`1px solid ${ic.border}`}}>{ic.label}{inst.status==='LATE'?` (${daysLate(inst.dueDate)}j)`:''}</span></td>
                                            <td style={s.td}>
                                                <div style={{display:'flex',gap:'4px'}}>
                                                    {inst.status!=='PAID' && <button style={{...s.aBtn,background:'#ECFDF5'}} onClick={()=>{setShowPay(inst);setPayForm(p=>({...p,paidAmount:inst.amount}));}}><Icon name="check" size={13} color="#059669"/></button>}
                                                    {inst.status==='PAID' && showDetail.parentEmail && <button style={{...s.aBtn,background:'#EDE8FF'}} onClick={()=>sendEmail('receipt',inst.id)} disabled={!!emailSending}><Icon name="mail" size={13} color="#5B2EE8"/></button>}
                                                    {inst.status==='LATE' && showDetail.parentEmail && <button style={{...s.aBtn,background:'#FEF2F2'}} onClick={()=>sendEmail('reminder',inst.id)} disabled={!!emailSending}><Icon name="send" size={13} color="#DC2626"/></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions PDF + Email */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'14px',borderTop:'1px solid #E5E7EB',flexWrap:'wrap',gap:'8px'}}>
                            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                                {/* ✅ FIX — boutons PDF dans le modal détail via axios */}
                                <button style={{...s.btnSec, opacity:dlLoading===`invoice-${showDetail.id}`?0.6:1}}
                                        onClick={()=>downloadPdf('invoice',showDetail.id,showDetail.number)}
                                        disabled={!!dlLoading}>
                                    <Icon name="dl" size={13} color="#5B2EE8"/>
                                    {dlLoading===`invoice-${showDetail.id}` ? 'Génération...' : 'Facture PDF'}
                                </button>
                                <button style={{...s.btnSec,color:'#1D4ED8',borderColor:'#BFDBFE',background:'#EFF6FF', opacity:dlLoading===`contract-${showDetail.id}`?0.6:1}}
                                        onClick={()=>downloadPdf('contract',showDetail.id,showDetail.number)}
                                        disabled={!!dlLoading}>
                                    <Icon name="dl" size={13} color="#1D4ED8"/>
                                    {dlLoading===`contract-${showDetail.id}` ? 'Génération...' : 'Contrat PDF'}
                                </button>
                                {showDetail.parentEmail && <>
                                    <button style={{...s.btnSec,color:'#059669',borderColor:'#A7F3D0',background:'#ECFDF5'}} onClick={()=>sendEmail('invoice',showDetail.id)} disabled={!!emailSending}><Icon name="mail" size={13} color="#059669"/> Envoyer facture</button>
                                    <button style={{...s.btnSec,color:'#1D4ED8',borderColor:'#BFDBFE',background:'#EFF6FF'}} onClick={()=>sendEmail('contract',showDetail.id)} disabled={!!emailSending}><Icon name="mail" size={13} color="#1D4ED8"/> Envoyer contrat</button>
                                </>}
                            </div>
                            <button style={s.btnPri} onClick={()=>setShowDetail(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL PAIEMENT ════ */}
            {showPay && (
                <div style={s.overlay} onClick={()=>setShowPay(null)}>
                    <div style={{...s.modal,maxWidth:'420px'}} onClick={e=>e.stopPropagation()}>
                        <div style={s.mHead}>
                            <div style={{...s.mIco,background:'#ECFDF5'}}><Icon name="check" size={20} color="#059669"/></div>
                            <div><h2 style={s.mTitle}>Enregistrer le paiement</h2><p style={s.mSub}>Montant dû : {fmt(showPay.amount)}</p></div>
                        </div>
                        <div style={fs.g2}>
                            <div style={fs.fg}><label style={fs.lb}>Montant reçu (€)</label>
                                <input style={fs.fi} type="number" step="0.01" value={payForm.paidAmount} onChange={e=>setPayForm(p=>({...p,paidAmount:e.target.value}))}/></div>
                            <div style={fs.fg}><label style={fs.lb}>Mode de paiement</label>
                                <select style={fs.fi} value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>
                                    <option value="virement">Virement</option>
                                    <option value="SumUp">Carte SumUp</option>
                                    <option value="espèces">Espèces</option>
                                    <option value="chèque">Chèque</option>
                                </select></div>
                            <div style={fs.fg}><label style={fs.lb}>Référence</label>
                                <input style={fs.fi} placeholder="Référence..." value={payForm.reference} onChange={e=>setPayForm(p=>({...p,reference:e.target.value}))}/></div>
                            <div style={fs.fg}><label style={fs.lb}>Date de paiement</label>
                                <input style={fs.fi} type="date" value={payForm.paidAt} onChange={e=>setPayForm(p=>({...p,paidAt:e.target.value}))}/></div>
                        </div>
                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={()=>setShowPay(null)}>Annuler</button>
                            <button style={{...s.btnPri,background:'#059669',opacity:saving?0.7:1}} onClick={markPaid} disabled={saving}>
                                <Icon name="check" size={13} color="#fff"/> {saving?'Enregistrement...':'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ MODAL NOUVEAU CONTRAT ════ */}
            {showAdd && (
                <div style={s.overlay} onClick={()=>setShowAdd(false)}>
                    <div style={{...s.modal,width:'680px'}} onClick={e=>e.stopPropagation()}>
                        <div style={s.mHead}>
                            <div style={s.mIco}><Icon name="file" size={20} color="#5B2EE8"/></div>
                            <div><h2 style={s.mTitle}>Nouveau contrat d'inscription</h2><p style={s.mSub}>Numéro CTR-TH/MZ-AAAA-NNN généré automatiquement</p></div>
                        </div>
                        <ContractForm form={form} onChange={handleFormChange} students={students} groups={groups} villeFilter={villeFilter}/>
                        <div style={s.mFoot}>
                            <button style={s.btnSec} onClick={()=>setShowAdd(false)}>Annuler</button>
                            <button style={{...s.btnPri,opacity:saving?0.7:1}} onClick={createContract} disabled={saving}>
                                <Icon name="plus" size={13} color="#fff"/> {saving?'Création...':'Créer le contrat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    ph:       {display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'},
    h1:       {fontFamily:'sans-serif',fontSize:'22px',fontWeight:'800',color:'#1A1040',margin:0},
    btnPri:   {display:'inline-flex',alignItems:'center',gap:'6px',padding:'9px 18px',background:'#5B2EE8',border:'none',borderRadius:'9px',color:'#fff',fontWeight:'700',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',flexShrink:0},
    btnSec:   {display:'inline-flex',alignItems:'center',gap:'6px',padding:'9px 16px',background:'#EDE8FF',border:'1px solid #C4B5FD',borderRadius:'9px',color:'#5B2EE8',fontWeight:'700',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',flexShrink:0},
    tabs:     {display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:'20px',overflowX:'auto'},
    tab:      {padding:'10px 20px',border:'none',background:'transparent',fontWeight:'600',fontSize:'13px',color:'#6B7280',cursor:'pointer',fontFamily:'inherit',borderBottom:'2px solid transparent',marginBottom:'-2px',whiteSpace:'nowrap'},
    tabOn:    {color:'#5B2EE8',borderBottom:'2px solid #5B2EE8'},
    statsGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'20px'},
    statCard: {display:'flex',alignItems:'center',gap:'12px',padding:'16px',background:'#fff',border:'1px solid #E5E7EB',borderRadius:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'},
    statIco:  {width:'40px',height:'40px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
    statVal:  {fontFamily:'sans-serif',fontSize:'18px',fontWeight:'800',lineHeight:1},
    statLbl:  {fontSize:'11px',color:'#9CA3AF',fontWeight:'600',marginTop:'3px'},
    panel:    {background:'#fff',border:'1px solid #E5E7EB',borderRadius:'14px',overflow:'hidden',marginBottom:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'},
    panelH:   {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid #E5E7EB',background:'#F9FAFB',gap:'12px',flexWrap:'wrap'},
    searchBox:{display:'flex',alignItems:'center',gap:'8px',background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:'8px',padding:'7px 12px',flex:1,maxWidth:'360px'},
    searchIn: {border:'none',background:'transparent',outline:'none',fontSize:'13px',color:'#111827',width:'100%',fontFamily:'inherit'},
    sel:      {padding:'8px 12px',border:'1.5px solid #E5E7EB',borderRadius:'8px',fontSize:'13px',color:'#374151',outline:'none',background:'#fff',fontFamily:'inherit'},
    empty:    {padding:'50px',textAlign:'center',color:'#9CA3AF',fontSize:'13px'},
    tbl:      {width:'100%',borderCollapse:'collapse'},
    th:       {padding:'9px 12px',textAlign:'left',fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.6px',color:'#6B7280',background:'#F9FAFB',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap'},
    tr:       {borderBottom:'1px solid #F3F4F6'},
    td:       {padding:'10px 12px',fontSize:'13px',color:'#111827',verticalAlign:'middle'},
    tdM:      {padding:'10px 12px',fontSize:'12px',color:'#9CA3AF',verticalAlign:'middle'},
    aBtn:     {width:'28px',height:'28px',borderRadius:'7px',border:'none',background:'#EDE8FF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0},
    overlay:  {position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},
    modal:    {background:'#fff',borderRadius:'16px',padding:'28px',width:'580px',maxWidth:'100%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'},
    mHead:    {display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'},
    mIco:     {width:'44px',height:'44px',background:'#EDE8FF',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
    mTitle:   {fontFamily:'sans-serif',fontSize:'18px',fontWeight:'800',color:'#111827',margin:'0 0 2px'},
    mSub:     {fontSize:'12px',color:'#9CA3AF',margin:0},
    mFoot:    {display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #E5E7EB'},
};
const fs = {
    sec:    {marginBottom:'14px',padding:'14px 16px',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px'},
    stitle: {fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'12px'},
    g2:     {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'},
    fg:     {display:'flex',flexDirection:'column',gap:'4px'},
    lb:     {fontSize:'11px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.5px'},
    fi:     {padding:'9px 12px',border:'1.5px solid #E5E7EB',borderRadius:'8px',fontSize:'13px',color:'#111827',outline:'none',background:'#fff',fontFamily:'inherit'},
    preview:{marginTop:'10px',padding:'10px 14px',background:'#EDE8FF',borderRadius:'8px',fontSize:'13px',color:'#5B2EE8',fontWeight:'600'},
};