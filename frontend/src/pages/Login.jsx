import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [loginVal, setLoginVal] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(loginVal, password);
            navigate(user.role === 'STUDENT' ? '/course' : '/dashboard');
        } catch {
            setError('Login ou mot de passe incorrect');
        }
        setLoading(false);
    };

    return (
        <div style={st.page}>
            {/* Déco arrière-plan */}
            <div style={st.blob1} />
            <div style={st.blob2} />

            <div style={st.box}>
                {/* Logo */}
                <div style={st.logoRow}>
                    <div style={st.logoIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                        </svg>
                    </div>
                    <span style={st.logoName}>Coding<span style={{ color: '#A78BFF' }}>Host</span></span>
                </div>

                <p style={st.sub}>Connectez-vous à votre espace</p>

                {error && (
                    <div style={st.error}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Login */}
                    <div style={st.fg}>
                        <label style={st.fl}>Identifiant</label>
                        <div style={st.inputWrap}>
                            <div style={st.inputIcon}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <input style={st.input} type="text" placeholder="votre.login"
                                   value={loginVal} onChange={e => setLoginVal(e.target.value)} required />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={st.fg}>
                        <label style={st.fl}>Mot de passe</label>
                        <div style={st.inputWrap}>
                            <div style={st.inputIcon}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                            <input style={st.input}
                                   type={showPass ? 'text' : 'password'}
                                   placeholder="••••••••"
                                   value={password}
                                   onChange={e => setPassword(e.target.value)}
                                   required />
                            <button type="button" style={st.eyeBtn} onClick={() => setShowPass(!showPass)}>
                                {showPass ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button style={{ ...st.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                        {loading ? (
                            <span>Connexion en cours...</span>
                        ) : (
                            <>
                                <span>Se connecter</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div style={st.footer}>
                    <div style={st.footerBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Connexion sécurisée
                    </div>
                </div>
            </div>
        </div>
    );
}

const st = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F0A1E 0%, #1e0f3c 60%, #0a1628 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    blob1: {
        position: 'absolute', top: '-10%', right: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,46,232,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute', bottom: '-10%', left: '-10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,105,192,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    box: {
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '44px 40px',
        width: '400px',
        maxWidth: '95vw',
        position: 'relative',
        zIndex: 1,
    },
    logoRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        justifyContent: 'center', marginBottom: '20px',
    },
    logoIcon: {
        width: '44px', height: '44px', background: '#5B2EE8',
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoName: {
        fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '800', color: '#fff',
    },
    sub: {
        color: 'rgba(255,255,255,0.35)', textAlign: 'center',
        marginBottom: '28px', fontSize: '14px', marginTop: 0,
    },
    error: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.25)',
        color: '#FF6B8A', padding: '10px 14px', borderRadius: '10px',
        marginBottom: '16px', fontSize: '13px', fontWeight: '600',
    },
    fg: { marginBottom: '16px' },
    fl: {
        display: 'block', color: 'rgba(255,255,255,0.45)',
        fontSize: '12px', fontWeight: '700', marginBottom: '7px',
        textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    inputWrap: { position: 'relative' },
    inputIcon: {
        position: 'absolute', left: '13px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
    },
    input: {
        width: '100%', padding: '12px 14px 12px 40px',
        background: 'rgba(255,255,255,0.05)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', color: '#fff', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
    },
    eyeBtn: {
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', background: 'none',
        border: 'none', cursor: 'pointer', padding: '4px',
        display: 'flex', alignItems: 'center',
    },
    btn: {
        width: '100%', padding: '13px',
        background: 'linear-gradient(135deg, #5B2EE8, #7C52F0)',
        border: 'none', borderRadius: '10px', color: '#fff',
        fontWeight: '700', fontSize: '15px', cursor: 'pointer',
        marginTop: '8px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px', fontFamily: 'inherit',
        boxShadow: '0 4px 20px rgba(91,46,232,0.4)',
        transition: 'opacity 0.15s',
    },
    footer: { marginTop: '20px', display: 'flex', justifyContent: 'center' },
    footerBadge: {
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: '600',
    },
};