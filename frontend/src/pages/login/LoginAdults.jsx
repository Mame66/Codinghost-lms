import { Link, Navigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../../contexts/AuthContext';
import useSpaceLogin from './useSpaceLogin';
import WrongSpaceNotice from './WrongSpaceNotice';
import EyeIcon from './EyeIcon';

// ════════════════════════════════════════════════════════════
// Connexion — ESPACE ADULTES (sobre, professionnel)
// ════════════════════════════════════════════════════════════
const FORMATIONS = ['Python & programmation', 'Bureautique (Word, Excel, PowerPoint)', 'Anglais', 'Compétences numériques'];

export default function LoginAdults() {
    const { user, loading: authLoading } = useAuth();
    const f = useSpaceLogin('ADULTE');
    if (!authLoading && user) return <Navigate to={homePathFor(user)} replace />;

    return (
        <div className="ad-wrap" style={st.page}>
            <style>{`
                .ad-input:focus { border-color: #1D4ED8 !important; box-shadow: 0 0 0 3px rgba(29,78,216,.12); }
                .ad-btn:hover { background: #12306E !important; }
                @media (max-width: 860px) { .ad-wrap { grid-template-columns: minmax(0,1fr) !important; } .ad-aside { min-height: auto !important; padding: 32px 24px !important; } .ad-list { display: none !important; } }
            `}</style>

            <aside className="ad-aside" style={st.aside}>
                <div style={st.brand}>CodingHost <span style={{ opacity: .55, fontWeight: 500 }}>· Formations adultes</span></div>
                <div>
                    <h1 style={st.headline}>Développez vos compétences numériques, à votre rythme.</h1>
                    <ul className="ad-list" style={st.list}>
                        {FORMATIONS.map(x => (
                            <li key={x} style={st.li}><span style={st.dot} />{x}</li>
                        ))}
                    </ul>
                </div>
                <div style={st.asideFoot}>Thionville · Metz · En ligne</div>
            </aside>

            <main style={st.main}>
                <div style={st.formBox}>
                    <Link to="/login" style={st.back}>← Choisir un autre espace</Link>
                    <p style={st.kicker}>Espace Adultes</p>
                    <h2 style={st.title}>Connexion</h2>
                    <p style={st.sub}>Accédez à vos formations, supports et quiz.</p>

                    <WrongSpaceNotice wrongSpace={f.wrongSpace} onGo={f.goToRightSpace} />
                    {f.error && <div style={st.error}>{f.error}</div>}

                    <form onSubmit={f.submit}>
                        <label style={st.label} htmlFor="ad-login">Identifiant</label>
                        <input id="ad-login" className="ad-input" style={st.input} autoComplete="username"
                               placeholder="prenom.nom" value={f.loginVal} onChange={e => f.setLoginVal(e.target.value)} required />

                        <label style={st.label} htmlFor="ad-pass">Mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <input id="ad-pass" className="ad-input" style={{ ...st.input, paddingRight: 44 }}
                                   type={f.showPass ? 'text' : 'password'} autoComplete="current-password"
                                   value={f.password} onChange={e => f.setPassword(e.target.value)} required />
                            <button type="button" style={st.eye} onClick={() => f.setShowPass(!f.showPass)}
                                    aria-label={f.showPass ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}>
                                <EyeIcon open={f.showPass} color="#64748B" />
                            </button>
                        </div>

                        <button className="ad-btn" type="submit" disabled={f.loading} style={{ ...st.btn, opacity: f.loading ? 0.7 : 1 }}>
                            {f.loading ? 'Connexion…' : 'Se connecter'}
                        </button>
                    </form>

                    <p style={st.help}>Identifiants perdus ? Contactez l'école : contact@codinghost.fr</p>
                </div>
            </main>
        </div>
    );
}

const SANS = "'Plus Jakarta Sans',sans-serif";
const st = {
    page: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr', fontFamily: SANS, background: '#fff' },
    aside: { minHeight: '100vh', boxSizing: 'border-box', padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#E2E8F0', background: 'radial-gradient(120% 90% at 0% 100%,#1E3A8A 0%,#0B1B3F 55%,#081430 100%)' },
    brand: { fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px', color: '#fff' },
    headline: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 500, fontSize: 'clamp(28px,3.2vw,42px)', lineHeight: 1.15, color: '#fff', margin: '0 0 28px', maxWidth: 480, letterSpacing: '-0.5px' },
    list: { listStyle: 'none', padding: 0, margin: 0, maxWidth: 420 },
    li: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: '1px solid rgba(148,163,184,.18)', fontSize: 15, color: 'rgba(226,232,240,.9)' },
    dot: { width: 6, height: 6, borderRadius: 2, background: '#60A5FA', flexShrink: 0 },
    asideFoot: { fontSize: 12, color: 'rgba(148,163,184,.8)', letterSpacing: '0.6px' },
    main: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
    formBox: { width: '100%', maxWidth: 380 },
    back: { fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 600 },
    kicker: { fontSize: 11, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#1D4ED8', margin: '28px 0 6px' },
    title: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 600, fontSize: 34, color: '#0B1B3F', margin: '0 0 6px', letterSpacing: '-0.5px' },
    sub: { fontSize: 14, color: '#64748B', margin: '0 0 24px' },
    error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', margin: '14px 0 6px', letterSpacing: '0.2px' },
    input: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none', fontFamily: SANS, color: '#0F172A', background: '#fff', transition: 'border-color .15s, box-shadow .15s' },
    eye: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' },
    btn: { width: '100%', marginTop: 24, padding: '13px', fontSize: 15, fontWeight: 700, color: '#fff', background: '#0B1B3F', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: SANS, transition: 'background .15s' },
    help: { fontSize: 12, color: '#94A3B8', marginTop: 18 },
};
