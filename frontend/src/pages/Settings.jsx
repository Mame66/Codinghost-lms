import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function Settings() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [activeTab, setActiveTab] = useState('account');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    // Account info
    const [profile, setProfile] = useState({
        nom: '', prenom: '', email: '', login: '', role: ''
    });

    // Password form
    const [passForm, setPassForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [passError, setPassError] = useState('');

    // School settings (admin only)
    const [schoolForm, setSchoolForm] = useState({
        name: 'CodingHost',
        email: 'contact@codinghost.fr',
        phone: '07 49 26 10 17',
        address: 'Présentiel : Thionville & Metz',
        founder: 'Annie Laurie Gatia-Chaboisseau',
        currency: 'EUR',
        country: 'France',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/settings/profile');
            setProfile(res.data);
        } catch (err) {
            // Fallback to user from context
            if (user) {
                setProfile({
                    nom: user.nom || '',
                    prenom: user.prenom || '',
                    email: user.email || '',
                    login: user.login || '',
                    role: user.role || '',
                });
            }
        }
    };

    const showSuccess = (msg) => {
        setSavedMsg(msg);
        setTimeout(() => setSavedMsg(''), 3000);
    };

    const savePassword = async () => {
        setPassError('');
        if (!passForm.currentPassword || !passForm.newPassword) {
            return setPassError('Remplissez tous les champs');
        }
        if (passForm.newPassword !== passForm.confirmPassword) {
            return setPassError('Les mots de passe ne correspondent pas');
        }
        if (passForm.newPassword.length < 6) {
            return setPassError('Mot de passe trop court (min 6 caractères)');
        }
        setSaving(true);
        try {
            await api.put('/settings/password', {
                currentPassword: passForm.currentPassword,
                newPassword: passForm.newPassword,
            });
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showSuccess('✅ Mot de passe modifié avec succès !');
        } catch (err) {
            setPassError(err.response?.data?.message || 'Erreur modification mot de passe');
        }
        setSaving(false);
    };

    const saveSchool = async () => {
        setSaving(true);
        try {
            await api.put('/settings/school', schoolForm);
            showSuccess('✅ Paramètres de l\'école sauvegardés !');
        } catch (err) {
            alert('Erreur sauvegarde');
        }
        setSaving(false);
    };

    const tabs = [
        { key: 'account', icon: '👤', label: 'Mon compte' },
        { key: 'security', icon: '🔒', label: 'Sécurité' },
        ...(isAdmin ? [{ key: 'school', icon: '🏫', label: 'École' }] : []),
        { key: 'about', icon: 'ℹ️', label: 'À propos' },
    ];

    const roleLabels = {
        ADMIN: '🛡️ Administrateur',
        TEACHER: '👩‍🏫 Enseignant',
        TEACHER_VIEW: '👁️ Enseignant (lecture)',
        STUDENT: '🎒 Étudiant',
    };

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>⚙️ Paramètres</h1>
            </div>

            {/* Success message */}
            {savedMsg && (
                <div style={s.successBanner}>{savedMsg}</div>
            )}

            <div style={s.layout}>
                {/* Sidebar */}
                <div style={s.sidebar}>
                    {tabs.map(tab => (
                        <div key={tab.key}
                             style={{ ...s.tabItem, ...(activeTab === tab.key ? s.tabItemOn : {}) }}
                             onClick={() => setActiveTab(tab.key)}>
                            <span style={s.tabIcon}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={s.content}>

                    {/* ===== MON COMPTE ===== */}
                    {activeTab === 'account' && (
                        <div>
                            <div style={s.sectionTitle}>👤 Mon compte</div>
                            <div style={s.card}>
                                <div style={s.profileHeader}>
                                    <div style={s.profileAvatar}>
                                        {profile.prenom?.[0]}{profile.nom?.[0]}
                                    </div>
                                    <div>
                                        <div style={s.profileName}>{profile.prenom} {profile.nom}</div>
                                        <div style={s.profileRole}>{roleLabels[profile.role] || profile.role}</div>
                                        <div style={s.profileLogin}>🔑 {profile.login}</div>
                                    </div>
                                </div>

                                <hr style={s.divider} />

                                <div style={s.infoGrid}>
                                    {[
                                        { label: 'Prénom', val: profile.prenom },
                                        { label: 'Nom', val: profile.nom },
                                        { label: 'Login', val: profile.login },
                                        { label: 'Email', val: profile.email },
                                        { label: 'Rôle', val: roleLabels[profile.role] },
                                    ].map((item, i) => (
                                        <div key={i} style={s.infoItem}>
                                            <div style={s.infoLabel}>{item.label}</div>
                                            <div style={s.infoVal}>{item.val || '—'}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={s.infoNote}>
                                    ℹ️ Pour modifier votre nom ou prénom, contactez un administrateur.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== SÉCURITÉ ===== */}
                    {activeTab === 'security' && (
                        <div>
                            <div style={s.sectionTitle}>🔒 Changer le mot de passe</div>
                            <div style={s.card}>
                                <div style={s.fg}>
                                    <label style={s.fl}>Mot de passe actuel *</label>
                                    <input style={s.fi} type="password" placeholder="••••••••"
                                           value={passForm.currentPassword}
                                           onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} />
                                </div>
                                <div style={s.formGrid}>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Nouveau mot de passe *</label>
                                        <input style={s.fi} type="password" placeholder="Min. 6 caractères"
                                               value={passForm.newPassword}
                                               onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Confirmer le mot de passe *</label>
                                        <input style={s.fi} type="password" placeholder="••••••••"
                                               value={passForm.confirmPassword}
                                               onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
                                    </div>
                                </div>

                                {/* Strength indicator */}
                                {passForm.newPassword && (
                                    <div style={s.strengthRow}>
                                        <div style={s.strengthBar}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{
                                                    ...s.strengthSegment,
                                                    background: passForm.newPassword.length >= i * 3
                                                        ? i <= 1 ? '#FF3B5C' : i <= 2 ? '#FFB800' : i <= 3 ? '#5B2EE8' : '#00C48C'
                                                        : '#E5E7EB'
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {passForm.newPassword.length < 4 ? 'Très faible'
                          : passForm.newPassword.length < 7 ? 'Faible'
                              : passForm.newPassword.length < 10 ? 'Moyen'
                                  : 'Fort'}
                    </span>
                                    </div>
                                )}

                                {passForm.newPassword && passForm.confirmPassword &&
                                    passForm.newPassword !== passForm.confirmPassword && (
                                        <div style={s.errorMsg}>⚠️ Les mots de passe ne correspondent pas</div>
                                    )}

                                {passError && <div style={s.errorMsg}>⚠️ {passError}</div>}

                                <div style={s.saveRow}>
                                    {savedMsg && activeTab === 'security' && (
                                        <span style={s.savedMsg}>{savedMsg}</span>
                                    )}
                                    <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }}
                                            onClick={savePassword} disabled={saving}>
                                        {saving ? 'Modification...' : '🔒 Modifier le mot de passe'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== ÉCOLE (Admin only) ===== */}
                    {activeTab === 'school' && isAdmin && (
                        <div>
                            <div style={s.sectionTitle}>🏫 Paramètres de l'école</div>
                            <div style={s.card}>
                                <div style={s.formGrid}>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Nom de l'école</label>
                                        <input style={s.fi} value={schoolForm.name}
                                               onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Fondatrice / Directrice</label>
                                        <input style={s.fi} value={schoolForm.founder}
                                               onChange={e => setSchoolForm({ ...schoolForm, founder: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Email de contact</label>
                                        <input style={s.fi} type="email" value={schoolForm.email}
                                               onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Téléphone</label>
                                        <input style={s.fi} value={schoolForm.phone}
                                               onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Adresse / Lieux</label>
                                        <input style={s.fi} value={schoolForm.address}
                                               onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Pays</label>
                                        <select style={s.fi} value={schoolForm.country}
                                                onChange={e => setSchoolForm({ ...schoolForm, country: e.target.value })}>
                                            <option value="France">🇫🇷 France</option>
                                            <option value="Algérie">🇩🇿 Algérie</option>
                                            <option value="Maroc">🇲🇦 Maroc</option>
                                            <option value="Tunisie">🇹🇳 Tunisie</option>
                                            <option value="Belgique">🇧🇪 Belgique</option>
                                        </select>
                                    </div>
                                    <div style={s.fg}>
                                        <label style={s.fl}>Devise</label>
                                        <select style={s.fi} value={schoolForm.currency}
                                                onChange={e => setSchoolForm({ ...schoolForm, currency: e.target.value })}>
                                            <option value="EUR">€ Euro</option>
                                            <option value="DA">DA Dinar Algérien</option>
                                            <option value="MAD">MAD Dirham Marocain</option>
                                            <option value="TND">TND Dinar Tunisien</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div style={s.previewCard}>
                                    <div style={s.previewTitle}>👁️ Aperçu</div>
                                    <div style={s.previewGrid}>
                                        <div style={s.previewItem}>
                                            <span style={s.previewLabel}>École :</span>
                                            <span style={s.previewVal}>{schoolForm.name}</span>
                                        </div>
                                        <div style={s.previewItem}>
                                            <span style={s.previewLabel}>Contact :</span>
                                            <span style={s.previewVal}>{schoolForm.email}</span>
                                        </div>
                                        <div style={s.previewItem}>
                                            <span style={s.previewLabel}>Tél :</span>
                                            <span style={s.previewVal}>{schoolForm.phone}</span>
                                        </div>
                                        <div style={s.previewItem}>
                                            <span style={s.previewLabel}>Lieux :</span>
                                            <span style={s.previewVal}>{schoolForm.address}</span>
                                        </div>
                                        <div style={s.previewItem}>
                                            <span style={s.previewLabel}>Devise :</span>
                                            <span style={s.previewVal}>{schoolForm.currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={s.saveRow}>
                                    <button style={{ ...s.btnP, opacity: saving ? 0.7 : 1 }}
                                            onClick={saveSchool} disabled={saving}>
                                        {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== À PROPOS ===== */}
                    {activeTab === 'about' && (
                        <div>
                            <div style={s.sectionTitle}>ℹ️ À propos</div>
                            <div style={s.card}>
                                <div style={s.aboutLogo}>
                                    <div style={s.aboutLogoIcon}>💻</div>
                                    <div>
                                        <div style={s.aboutLogoName}>CodingHost LMS</div>
                                        <div style={s.aboutVersion}>Version 1.0.0</div>
                                    </div>
                                </div>

                                <p style={s.aboutDesc}>
                                    Plateforme de gestion d'apprentissage en ligne pour CodingHost,
                                    école de programmation pour enfants et adultes.
                                    Présentiel à Thionville & Metz, France.
                                </p>

                                <div style={s.contactCard}>
                                    <div style={s.contactTitle}>📞 Contact</div>
                                    <div style={s.contactGrid}>
                                        {[
                                            { icon: '📧', label: 'Email', val: 'contact@codinghost.fr' },
                                            { icon: '📞', label: 'Téléphone', val: '07 49 26 10 17' },
                                            { icon: '📍', label: 'Lieux', val: 'Thionville & Metz' },
                                            { icon: '👩‍💼', label: 'Fondatrice', val: 'Annie Laurie Gatia-Chaboisseau' },
                                        ].map((item, i) => (
                                            <div key={i} style={s.contactItem}>
                                                <span style={s.contactIcon}>{item.icon}</span>
                                                <div>
                                                    <div style={s.contactLabel}>{item.label}</div>
                                                    <div style={s.contactVal}>{item.val}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr style={s.divider} />

                                <div style={s.techTitle}>⚡ Stack technique</div>
                                <div style={s.techList}>
                                    {[
                                        { icon: '⚛️', name: 'React.js', desc: 'Frontend' },
                                        { icon: '🟢', name: 'Node.js + Express', desc: 'Backend API' },
                                        { icon: '🐘', name: 'PostgreSQL', desc: 'Base de données' },
                                        { icon: '🔷', name: 'Prisma ORM v5', desc: 'ORM' },
                                        { icon: '🔑', name: 'JWT', desc: 'Authentification' },
                                    ].map((tech, i) => (
                                        <div key={i} style={s.techItem}>
                                            <span style={{ fontSize: '20px' }}>{tech.icon}</span>
                                            <div>
                                                <div style={s.techName}>{tech.name}</div>
                                                <div style={s.techDesc}>{tech.desc}</div>
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
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    successBanner: { background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#008060', marginBottom: '16px' },
    layout: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' },
    sidebar: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', overflow: 'hidden' },
    tabItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderLeft: '3px solid transparent', fontSize: '13px', fontWeight: '600', color: '#6B7280', borderBottom: '1px solid #F3F4F6', transition: 'all 0.15s' },
    tabItemOn: { background: '#F5F2FF', borderLeftColor: '#5B2EE8', color: '#5B2EE8', fontWeight: '700' },
    tabIcon: { fontSize: '16px' },
    content: {},
    sectionTitle: { fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '800', color: '#1A1040', marginBottom: '16px' },
    card: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '24px' },
    profileHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
    profileAvatar: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#5B2EE8,#A78BFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 },
    profileName: { fontFamily: 'sans-serif', fontSize: '20px', fontWeight: '800', color: '#1A1040' },
    profileRole: { fontSize: '13px', color: '#5B2EE8', fontWeight: '700', marginTop: '2px' },
    profileLogin: { fontSize: '12px', color: '#6B7280', marginTop: '4px', fontFamily: 'monospace' },
    divider: { border: 'none', borderTop: '1px solid #E5E0F5', margin: '20px 0' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
    infoItem: { background: '#F8F6FF', borderRadius: '10px', padding: '12px' },
    infoLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' },
    infoVal: { fontSize: '14px', fontWeight: '700', color: '#1A1040' },
    infoNote: { background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#8B6200', fontWeight: '600' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fg: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' },
    fl: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    fi: { padding: '10px 12px', border: '1.5px solid #E5E0F5', borderRadius: '9px', fontSize: '13px', color: '#1A1040', outline: 'none', background: '#F8F6FF', fontFamily: 'inherit' },
    strengthRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
    strengthBar: { display: 'flex', gap: '4px', flex: 1 },
    strengthSegment: { flex: 1, height: '4px', borderRadius: '50px', transition: 'background 0.3s' },
    errorMsg: { background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#CC0033', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '14px' },
    saveRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
    savedMsg: { fontSize: '13px', color: '#008060', fontWeight: '700' },
    btnP: { padding: '10px 24px', background: '#5B2EE8', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
    previewCard: { background: '#F8F6FF', border: '1px solid #E5E0F5', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
    previewTitle: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040', marginBottom: '10px' },
    previewGrid: { display: 'flex', flexDirection: 'column', gap: '6px' },
    previewItem: { display: 'flex', gap: '8px', fontSize: '13px' },
    previewLabel: { color: '#6B7280', fontWeight: '600', minWidth: '60px' },
    previewVal: { color: '#1A1040', fontWeight: '700' },
    aboutLogo: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
    aboutLogoIcon: { width: '52px', height: '52px', background: '#5B2EE8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' },
    aboutLogoName: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    aboutVersion: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    aboutDesc: { fontSize: '14px', color: '#6B7280', lineHeight: 1.7, marginBottom: '16px' },
    contactCard: { background: '#F8F6FF', borderRadius: '12px', padding: '16px', marginBottom: '4px' },
    contactTitle: { fontFamily: 'sans-serif', fontSize: '13px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    contactGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    contactItem: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
    contactIcon: { fontSize: '18px', flexShrink: 0 },
    contactLabel: { fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '2px' },
    contactVal: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    techTitle: { fontFamily: 'sans-serif', fontSize: '14px', fontWeight: '800', color: '#1A1040', marginBottom: '12px' },
    techList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    techItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#F8F6FF', borderRadius: '10px' },
    techName: { fontSize: '13px', fontWeight: '700', color: '#1A1040' },
    techDesc: { fontSize: '11px', color: '#6B7280' },
};