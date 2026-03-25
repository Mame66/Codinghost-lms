import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [loginVal, setLoginVal] = useState('');
    const [password, setPassword] = useState('');
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
            // Rediriger selon le rôle
            if (user.role === 'STUDENT') {
                navigate('/course');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Login ou mot de passe incorrect');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                {/* Logo */}
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>💻</div>
                    <div style={styles.logoName}>
                        Coding<span style={{ color: '#A78BFF' }}>Host</span>
                    </div>
                </div>

                <p style={styles.subtitle}>Connectez-vous à votre espace</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.field}>
                        <label style={styles.label}>Login</label>
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="votre.login"
                            value={loginVal}
                            onChange={e => setLoginVal(e.target.value)}
                            required
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Mot de passe</label>
                        <input
                            style={styles.input}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Connexion...' : 'Se connecter →'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F0A1E 0%, #1e0f3c 50%, #0a1628 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '48px',
        width: '420px',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '24px',
    },
    logoIcon: {
        width: '44px',
        height: '44px',
        background: '#5B2EE8',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
    },
    logoName: {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        fontWeight: '800',
        color: '#fff',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginBottom: '28px',
        fontSize: '14px',
    },
    error: {
        background: 'rgba(255,59,92,0.15)',
        border: '1px solid rgba(255,59,92,0.3)',
        color: '#FF3B5C',
        padding: '10px 14px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '13px',
    },
    field: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        fontWeight: '700',
        marginBottom: '6px',
    },
    input: {
        width: '100%',
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    btn: {
        width: '100%',
        padding: '13px',
        background: '#5B2EE8',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontWeight: '700',
        fontSize: '15px',
        cursor: 'pointer',
        marginTop: '8px',
    },
};
