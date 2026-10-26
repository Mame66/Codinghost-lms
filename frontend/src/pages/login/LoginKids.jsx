import { Link, Navigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../../contexts/AuthContext';
import useSpaceLogin from './useSpaceLogin';
import WrongSpaceNotice from './WrongSpaceNotice';
import EyeIcon from './EyeIcon';

// ════════════════════════════════════════════════════════════
// Connexion — ESPACE ENFANTS (ludique, gros boutons, couleurs vives)
// ════════════════════════════════════════════════════════════
export default function LoginKids() {
    const { user, loading: authLoading } = useAuth();
    const f = useSpaceLogin('ENFANT');
    if (!authLoading && user) return <Navigate to={homePathFor(user)} replace />;

    return (
        <div style={st.page}>
            <style>{`
                @keyframes chFloat { 0%,100% { transform: translateY(0) rotate(var(--r)); } 50% { transform: translateY(-14px) rotate(var(--r)); } }
                .kid-block { animation: chFloat 6s ease-in-out infinite; }
                .kid-input:focus { border-color: #F97316 !important; box-shadow: 0 0 0 4px rgba(249,115,22,.18); }
                .kid-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #C2410C !important; }
                @media (prefers-reduced-motion: reduce) { .kid-block { animation: none; } }
            `}</style>

            {BLOCKS.map((b, i) => (
                <span key={i} className="kid-block" style={{
                    position: 'absolute', left: b.x, top: b.y, width: b.s, height: b.s, background: b.c,
                    borderRadius: b.s / 5, '--r': `${b.r}deg`, animationDelay: `${i * 0.7}s`,
                    boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.14)', opacity: 0.9, pointerEvents: 'none',
                }} />
            ))}

            <div style={st.card}>
                <Link to="/login" style={st.back}>← Changer d'espace</Link>

                <div><span style={st.badge}>🎮 Espace Enfants</span></div>
                <h1 style={st.title}>Salut ! Prêt à coder ? 🚀</h1>
                <p style={st.sub}>Connecte-toi pour retrouver tes cours et tes défis.</p>

                <WrongSpaceNotice wrongSpace={f.wrongSpace} onGo={f.goToRightSpace} />
                {f.error && <div style={st.error}>😕 {f.error}</div>}

                <form onSubmit={f.submit}>
                    <label style={st.label} htmlFor="kid-login">Ton identifiant</label>
                    <input id="kid-login" className="kid-input" style={st.input} autoComplete="username"
                           placeholder="prenom.nom" value={f.loginVal} onChange={e => f.setLoginVal(e.target.value)} required />

                    <label style={st.label} htmlFor="kid-pass">Ton mot de passe</label>
                    <div style={{ position: 'relative' }}>
                        <input id="kid-pass" className="kid-input" style={{ ...st.input, paddingRight: 52 }}
                               type={f.showPass ? 'text' : 'password'} autoComplete="current-password"
                               placeholder="••••••" value={f.password} onChange={e => f.setPassword(e.target.value)} required />
                        <button type="button" style={st.eye} onClick={() => f.setShowPass(!f.showPass)}
                                aria-label={f.showPass ? 'Cacher le mot de passe' : 'Voir le mot de passe'}>
                            <EyeIcon open={f.showPass} color="#9A3412" size={20} />
                        </button>
                    </div>

                    <button className="kid-btn" type="submit" disabled={f.loading} style={{ ...st.btn, opacity: f.loading ? 0.75 : 1 }}>
                        {f.loading ? 'Connexion…' : "C'est parti !"}
                    </button>
                </form>

                <p style={st.help}>Mot de passe oublié ? Demande à ton prof 😉</p>
            </div>
        </div>
    );
}

const BLOCKS = [
    { x: '6%',  y: '12%', s: 70, c: '#F97316', r: -10 },
    { x: '14%', y: '68%', s: 54, c: '#22C55E', r: 8 },
    { x: '82%', y: '14%', s: 60, c: '#3B82F6', r: 12 },
    { x: '86%', y: '64%', s: 74, c: '#EAB308', r: -6 },
    { x: '70%', y: '84%', s: 40, c: '#EC4899', r: 14 },
    { x: '28%', y: '86%', s: 34, c: '#8B5CF6', r: -14 },
];

const FONT = "'Fredoka','Plus Jakarta Sans',sans-serif";
const st = {
    page: { minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'linear-gradient(170deg,#7DD3FC 0%,#A5B4FC 55%,#F0ABFC 100%)', fontFamily: FONT },
    card: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, boxSizing: 'border-box', background: '#fff', borderRadius: 32, padding: '30px 30px 26px', boxShadow: '0 10px 0 rgba(30,27,75,.12), 0 30px 60px -20px rgba(30,27,75,.35)' },
    back: { fontSize: 13, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 },
    badge: { display: 'inline-block', marginTop: 14, padding: '6px 12px', borderRadius: 50, background: '#FFF4EC', color: '#C2410C', fontWeight: 700, fontSize: 13 },
    title: { fontSize: 30, fontWeight: 700, color: '#1E1B4B', margin: '12px 0 4px', lineHeight: 1.15 },
    sub: { fontSize: 15, color: '#6B6480', margin: '0 0 20px', fontFamily: "'Plus Jakarta Sans',sans-serif" },
    error: { background: '#FEF2F2', border: '2px solid #FECACA', color: '#B91C1C', borderRadius: 14, padding: '10px 14px', fontSize: 14, fontWeight: 600, marginBottom: 14 },
    label: { display: 'block', fontSize: 15, fontWeight: 600, color: '#1E1B4B', margin: '12px 0 6px' },
    input: { width: '100%', boxSizing: 'border-box', padding: '14px 16px', fontSize: 17, borderRadius: 16, border: '3px solid #E9E3FF', outline: 'none', fontFamily: FONT, color: '#1E1B4B', background: '#FBFAFF', transition: 'border-color .15s, box-shadow .15s' },
    eye: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' },
    btn: { width: '100%', marginTop: 22, padding: '16px', fontSize: 20, fontWeight: 700, fontFamily: FONT, color: '#fff', background: 'linear-gradient(180deg,#FB923C,#F97316)', border: 'none', borderRadius: 18, cursor: 'pointer', boxShadow: '0 6px 0 #C2410C', transition: 'transform .08s, box-shadow .08s' },
    help: { textAlign: 'center', fontSize: 14, color: '#6B6480', margin: '18px 0 0' },
};
