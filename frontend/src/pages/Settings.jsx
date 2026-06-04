import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Ic, IconBadge } from '../components/Icons';

export default function Settings() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [activeTab, setActiveTab] = useState('account');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [profile, setProfile] = useState({ nom: '', prenom: '', email: '', login: '', role: '' });
    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const [passError, setPassError] = useState('');
    const [schoolForm, setSchoolForm] = useState({ name: 'CodingHost', email: 'contact@codinghost.fr', phone: '07 49 26 10 17', address: 'Présentiel : Thionville & Metz', founder: 'Annie Laurie Gatia-Chaboisseau', currency: 'EUR', country: 'France' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try { const res = await api.get('/settings/profile'); setProfile(res.data); }
        catch { if (user) setProfile({ nom: user.nom || '', prenom: user.prenom || '', email: user.email || '', login: user.login || '', role: user.role || '' }); }
    };

    const showSuccess = (msg) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3000); };

    const savePassword = async () => {
        setPassError('');
        if (!passForm.currentPassword || !passForm.newPassword) return setPassError('Remplissez tous les champs');
        if (passForm.newPassword !== passForm.confirmPassword) return setPassError('Les mots de passe ne correspondent pas');
        if (passForm.newPassword.length < 6) return setPassError('Mot de passe trop court (min 6 caractères)');
        setSaving(true);
        try {
            await api.put('/settings/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showSuccess('Mot de passe modifié avec succès !');
        } catch (err) { setPassError(err.response?.data?.message || 'Erreur modification'); }
        setSaving(false);
    };

    const saveSchool = async () => {
        setSaving(true);
        try { await api.put('/settings/school', schoolForm); showSuccess('Paramètres sauvegardés !'); }
        catch { alert('Erreur sauvegarde'); }
        setSaving(false);
    };

    const roleConfig = {
        ADMIN:        { label: 'Administrateur', icon: 'shield',  color: '#5B2EE8', bg: '#EDE8FF' },
        TEACHER:      { label: 'Enseignant',      icon: 'teacher', color: '#008060', bg: '#ECFDF5' },
        TEACHER_VIEW: { label: 'Enseignant (lecture)', icon: 'eye', color: '#0069C0', bg: '#EFF6FF' },
        STUDENT:      { label: 'Étudiant',        icon: 'student', color: '#8B6200', bg: 'rgba(255,184,0,0.12)' },
    };

    const tabs = [
        { key: 'account',  icon: 'user',     label: 'Mon compte' },
        { key: 'security', icon: 'lock',      label: 'Sécurité' },
        ...(isAdmin ? [{ key: 'school', icon: 'group', label: 'École' }] : []),
        { key: 'about',    icon: 'info',      label: 'À propos' },
    ];

    const rc = roleConfig[profile.role] || roleConfig.STUDENT;

    const PasswordInput = ({ label, field, placeholder }) => (
        <div style={s.fg}>
            <label style={s.fl}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input style={{ ...s.fi, paddingRight: '40px' }}
                       type={showPass[field] ? 'text' : 'password'}
                       placeholder={placeholder}
                       value={passForm[field]}
                       onChange={e => setPassForm({ ...passForm, [field]: e.target.value })} />
                <button type="button" style={s.eyeBtn} onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}>
                    <Ic name={showPass[field] ? 'eye_off' : 'eye'} size={15} color="#9CA3AF" />
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <div style={s.ph}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconBadge icon="settings" color="#5B2EE8" bg="#EDE8FF" size={36} iconSize={18} />
                    <h1 style={s.h1}>Paramètres</h1>
                </div>
            </div>

            {savedMsg && (
                <div style={s.successBanner}>
                    <Ic name="check_circle" size={16} color="#008060" /> {savedMsg}
                </div>
            )}

            <div style={s.layout}>
                {/* Sidebar */}
                <div style={s.sidebar}>
                    {tabs.map(tab => (
                        <div key={tab.key} style={{ ...s.tabItem, ...(activeTab === tab.key ? s.tabItemOn : {}) }}
                             onClick={() => setActiveTab(tab.key)}>
                            <Ic name={tab.icon} size={16} color={activeTab === tab.key ? '#5B2EE8' : '#9CA3AF'} />
                            <span>{tab.label}</span>
                        </div>
                    ))}
                </div>

                <div style={s.content}>
                    {/* ===== MON COMPTE ===== */}
                    {activeTab === 'account' && (
                        <div>
                            <div style={s.sectionTitle}><Ic name="user" size={16} color="#1A1040" /> Mon compte</div>
                            <div style={s.card}>
                                <div style={s.profileHeader}>
                                    <div style={s.profileAvatar}>{profile.prenom?.[0]}{profile.nom?.[0]}</div>
                                    <div>
                                        <div style={s.profileName}>{profile.prenom} {profile.nom}</div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', ...s.rolePill, background: rc.bg, color: rc.color }}>
                                            <Ic name={rc.icon} size={12} color={rc.color} /> {rc.label}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', marginTop: '6px', fontFamily: 'monospace' }}>
                                            <Ic name="key" size={12} color="#9CA3AF" /> {profile.login}
                                        </div>
                                    </div>
                                </div>
                                <hr style={s.divider} />
                                <div style={s.infoGrid}>
                                    {[
                                        { icon: 'user',   label: 'Prénom', val: profile.prenom },
                                        { icon: 'user',   label: 'Nom',    val: profile.nom },
                                        { icon: 'key',    label: 'Login',  val: profile.login },
                                        { icon: 'mail',   label: 'Email',  val: profile.email },
                                        { icon: 'shield', label: 'Rôle',   val: rc.label },
                                    ].map((item, i) => (
                                        <div key={i} style={s.infoItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                                <Ic name={item.icon} size={11} color="#9CA3AF" />
                                                <div style={s.infoLabel}>{item.label}</div>
                                            </div>
                                            <div style={s.infoVal}>{item.val || '—'}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', fontWeight: '600' }}>
                                    <Ic name="info" size={14} color="#8B6200" />
                                    Pour modifier votre nom ou prénom, contactez un administrateur.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== SÉCURITÉ ===== */}
                    {activeTab === 'security' && (
                        <div>
                            <div style={s.sectionTitle}><Ic name="lock" size={16} color="#1A1040" /> Changer le mot de passe</div>
                            <div style={s.card}>
                                <PasswordInput label="Mot de passe actuel *" field="currentPassword" placeholder="••••••••" />
                                <div style={s.formGrid}>
                                    <PasswordInput label="Nouveau mot de passe *" field="newPassword" placeholder="Min. 6 caractères" />
                                    <PasswordInput label="Confirmer *" field="confirmPassword" placeholder="••••••••" />
                                </div>

                                {passForm.newPassword && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{ flex: 1, height: '4px', borderRadius: '50px', transition: 'background 0.3s', background: passForm.newPassword.length >= i * 3 ? (i <= 1 ? '#FF3B5C' : i <= 2 ? '#FFB800' : i <= 3 ? '#5B2EE8' : '#00C48C') : '#E5E7EB' }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                            {passForm.newPassword.length < 4 ? 'Très faible' : passForm.newPassword.length < 7 ? 'Faible' : passForm.newPassword.length < 10 ? 'Moyen' : 'Fort'}
                                        </span>
                                    </div>
                                )}

                                {passForm.newPassword && passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword && (
                                    <div style={s.errorMsg}><Ic name="alert" size={14} color="#CC0033" /> Les mots de passe ne correspondent pas</div>
                                )}
                                {passError && <div style={s.errorMsg}><Ic name="alert" size={14} color="#CC0033" /> {passError}</div>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            onClick={savePassword} disabled={saving}>
                                        <Ic name="lock" size={14} color="#fff" />
                                        {saving ? 'Modification...' : 'Modifier le mot de passe'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== ÉCOLE ===== */}
                    {activeTab === 'school' && isAdmin && (
                        <div>
                            <div style={s.sectionTitle}><Ic name="group" size={16} color="#1A1040" /> Paramètres de l'école</div>
                            <div style={s.card}>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Nom de l\'école', key: 'name', icon: 'book' },
                                        { label: 'Fondatrice / Directrice', key: 'founder', icon: 'user' },
                                        { label: 'Email de contact', key: 'email', icon: 'mail', type: 'email' },
                                        { label: 'Téléphone', key: 'phone', icon: 'phone' },
                                        { label: 'Adresse / Lieux', key: 'address', icon: 'location' },
                                    ].map(f => (
                                        <div key={f.key} style={s.fg}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', ...s.fl }}>
                                                <Ic name={f.icon} size={11} color="#9CA3AF" /> {f.label}
                                            </label>
                                            <input style={s.fi} type={f.type || 'text'} value={schoolForm[f.key]} onChange={e => setSchoolForm({ ...schoolForm, [f.key]: e.target.value })} />
                                        </div>
                                    ))}
                                    <div style={s.fg}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', ...s.fl }}>
                                            <Ic name="globe" size={11} color="#9CA3AF" /> Pays
                                        </label>
                                        <select style={s.fi} value={schoolForm.country} onChange={e => setSchoolForm({ ...schoolForm, country: e.target.value })}>
                                            <option value="France">🇫🇷 France</option><option value="Algérie">🇩🇿 Algérie</option>
                                            <option value="Maroc">🇲🇦 Maroc</option><option value="Tunisie">🇹🇳 Tunisie</option>
                                            <option value="Belgique">🇧🇪 Belgique</option>
                                        </select>
                                    </div>
                                    <div style={s.fg}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', ...s.fl }}>
                                            <Ic name="coin" size={11} color="#9CA3AF" /> Devise
                                        </label>
                                        <select style={s.fi} value={schoolForm.currency} onChange={e => setSchoolForm({ ...schoolForm, currency: e.target.value })}>
                                            <option value="EUR">€ Euro</option><option value="DA">DA Dinar Algérien</option>
                                            <option value="MAD">MAD Dirham Marocain</option><option value="TND">TND Dinar Tunisien</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ background: '#F8F6FF', border: '1px solid #E5E0F5', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040', marginBottom: '10px' }}>
                                        <Ic name="eye" size={14} color="#5B2EE8" /> Aperçu
                                    </div>
                                    {[['École', schoolForm.name], ['Email', schoolForm.email], ['Tél', schoolForm.phone], ['Lieux', schoolForm.address], ['Devise', schoolForm.currency]].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '4px' }}>
                                            <span style={{ color: '#6B7280', fontWeight: '600', minWidth: '60px' }}>{k} :</span>
                                            <span style={{ color: '#1A1040', fontWeight: '700' }}>{v}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={saveSchool} disabled={saving}>
                                        <Ic name="save" size={14} color="#fff" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== À PROPOS ===== */}
                    {activeTab === 'about' && (
                        <div>
                            <div style={s.sectionTitle}><Ic name="info" size={16} color="#1A1040" /> À propos</div>
                            <div style={s.card}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                    <div style={{ width: '52px', height: '52px', background: '#5B2EE8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ic name="code" size={26} color="#fff" />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' }}>CodingHost LMS</div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' }}>Version 1.0.0</div>
                                    </div>
                                </div>

                                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.7, marginBottom: '16px' }}>
                                    Plateforme de gestion d'apprentissage pour CodingHost, école de programmation pour enfants et adultes. Présentiel à Thionville & Metz, France.
                                </p>

                                <div style={{ background: '#F8F6FF', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' }}>
                                        <Ic name="phone" size={14} color="#5B2EE8" /> Contact
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {[
                                            { icon: 'mail',     label: 'Email',      val: 'contact@codinghost.fr' },
                                            { icon: 'phone',    label: 'Téléphone',  val: '07 49 26 10 17' },
                                            { icon: 'location', label: 'Lieux',      val: 'Thionville & Metz' },
                                            { icon: 'user',     label: 'Fondatrice', val: 'Annie Laurie Gatia-Chaboisseau' },
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', background: '#EDE8FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Ic name={item.icon} size={15} color="#5B2EE8" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>{item.val}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr style={s.divider} />

                                <div style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Ic name="code" size={15} color="#5B2EE8" /> Stack technique
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { icon: 'code',   name: 'React.js',          desc: 'Frontend', color: '#5B2EE8', bg: '#EDE8FF' },
                                        { icon: 'code',   name: 'Node.js + Express', desc: 'Backend API', color: '#008060', bg: '#ECFDF5' },
                                        { icon: 'save',   name: 'PostgreSQL',         desc: 'Base de données', color: '#0069C0', bg: '#EFF6FF' },
                                        { icon: 'link',   name: 'Prisma ORM v5',      desc: 'ORM', color: '#CC3300', bg: '#FFF0EB' },
                                        { icon: 'shield', name: 'JWT',               desc: 'Authentification', color: '#8B6200', bg: 'rgba(255,184,0,0.12)' },
                                    ].map((tech, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#F8F6FF', borderRadius: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: tech.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Ic name={tech.icon} size={16} color={tech.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A1040' }}>{tech.name}</div>
                                                <div style={{ fontSize: '11px', color: '#6B7280' }}>{tech.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040', margin: 0 },
    successBanner: { display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#008060', marginBottom: '16px' },
    layout: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' },
    sidebar: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    tabItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderLeft: '3px solid transparent', fontSize: '13px', fontWeight: '600', color: '#6B7280', borderBottom: '1px solid #F3F4F6', transition: 'all 0.15s' },
    tabItemOn: { background: '#F5F2FF', borderLeftColor: '#5B2EE8', color: '#5B2EE8', fontWeight: '700' },
    content: {},
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '16px' },
    card: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '24px' },
    profileHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
    profileAvatar: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 },
    profileName: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040', marginBottom: '6px' },
    rolePill: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: '800' },
    divider: { border: 'none', borderTop: '1px solid #E5E0F5', margin: '20px 0' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
    infoItem: { background: '#F8F6FF', borderRadius: '10px', padding: '12px' },
    infoLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
    infoVal: { fontSize: '14px', fontWeight: '700', color: '#1A1040', marginTop: '2px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' },
    errorMsg: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#CC0033', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '14px' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
};