import { Link, Navigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../../contexts/AuthContext';

// Page d'accueil : choix de l'espace (Enfants / Adultes / Équipe)
export default function LoginLanding() {
    const { user, loading } = useAuth();
    if (!loading && user) return <Navigate to={homePathFor(user)} replace />;

    return (
        <div style={st.page}>
            <style>{`
                .ch-card { transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s; }
                .ch-card:hover { transform: translateY(-6px); }
                .ch-kids:hover  { box-shadow: 0 24px 48px -16px rgba(234,88,12,.45); }
                .ch-adult:hover { box-shadow: 0 24px 48px -16px rgba(11,27,63,.55); }
                .ch-cta { transition: gap .2s; }
                .ch-card:hover .ch-cta { gap: 14px; }
                @media (max-width: 760px) { .ch-grid { grid-template-columns: minmax(0,1fr) !important; } .ch-title { font-size: 30px !important; } }
            `}</style>

            <header style={st.header}>
                <div style={st.logo}>
                    <div style={st.logoMark}>{'</>'}</div>
                    <span style={st.logoText}>Coding<span style={{ color: '#7C52F0' }}>Host</span></span>
                </div>
                <span style={st.cities}>Thionville · Metz</span>
            </header>

            <main style={st.main}>
                <p style={st.kicker}>Centre de formation numérique</p>
                <h1 className="ch-title" style={st.title}>Bienvenue ! Choisissez votre espace.</h1>

                <div className="ch-grid" style={st.grid}>
                    {/* ── ENFANTS ── */}
                    <Link to="/login/enfants" className="ch-card ch-kids" style={{ ...st.card, background: '#FFF7ED', borderColor: '#FED7AA' }}>
                        <div style={st.kidsArt}>
                            {KID_BLOCKS.map((b, i) => (
                                <span key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.s, height: b.s, background: b.c, borderRadius: 6, transform: `rotate(${b.r}deg)`, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.15)' }} />
                            ))}
                            <span style={st.kidsEmoji}>🚀</span>
                        </div>
                        <div style={{ padding: '22px 26px 26px' }}>
                            <div style={{ ...st.cardTitle, fontFamily: "'Fredoka','Plus Jakarta Sans',sans-serif", color: '#9A3412' }}>Espace Enfants</div>
                            <div style={st.cardText}>Roblox, Minecraft, Scratch, Unity, Python débutant…</div>
                            <div className="ch-cta" style={{ ...st.cta, color: '#EA580C' }}>Je me connecte <span>→</span></div>
                        </div>
                    </Link>

                    {/* ── ADULTES ── */}
                    <Link to="/login/adultes" className="ch-card ch-adult" style={{ ...st.card, background: '#0B1B3F', borderColor: '#0B1B3F' }}>
                        <div style={st.adultArt}>
                            {[0, 1, 2, 3, 4].map(i => (
                                <span key={i} style={{ position: 'absolute', left: 0, right: 0, top: 26 + i * 26, height: 1, background: `rgba(147,197,253,${0.08 + i * 0.05})` }} />
                            ))}
                            <span style={st.adultMark}>Formations</span>
                        </div>
                        <div style={{ padding: '22px 26px 26px' }}>
                            <div style={{ ...st.cardTitle, fontFamily: "'Fraunces',Georgia,serif", color: '#fff', fontWeight: 600 }}>Espace Adultes</div>
                            <div style={{ ...st.cardText, color: 'rgba(219,234,254,.75)' }}>Python, bureautique, anglais, compétences numériques…</div>
                            <div className="ch-cta" style={{ ...st.cta, color: '#93C5FD' }}>Accéder à mon espace <span>→</span></div>
                        </div>
                    </Link>
                </div>

                <Link to="/login/equipe" style={st.teamLink}>
                    Vous êtes enseignant ou administrateur ? <strong style={{ color: '#5B2EE8' }}>Accès équipe →</strong>
                </Link>
            </main>
        </div>
    );
}

const KID_BLOCKS = [
    { x: 26, y: 28, s: 34, c: '#F97316', r: -8 }, { x: 70, y: 70, s: 26, c: '#22C55E', r: 6 },
    { x: 120, y: 24, s: 22, c: '#3B82F6', r: 12 }, { x: 250, y: 30, s: 30, c: '#EAB308', r: -12 },
    { x: 300, y: 82, s: 22, c: '#EC4899', r: 8 }, { x: 200, y: 96, s: 18, c: '#8B5CF6', r: -4 },
];

const st = {
    page: { minHeight: '100vh', overflowX: 'hidden', background: '#FBF8F3', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px clamp(16px,5vw,56px)' },
    logo: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoMark: { width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6C4CF5,#9B4DE1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 800, fontSize: 13 },
    logoText: { fontSize: 20, fontWeight: 800, color: '#1A1040', letterSpacing: '-0.3px' },
    cities: { fontSize: 12, fontWeight: 700, color: '#8A8299', letterSpacing: '0.4px' },
    main: { flex: 1, width: '100%', boxSizing: 'border-box', maxWidth: 920, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    kicker: { fontSize: 12, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#7C52F0', margin: '12px 0 10px' },
    title: { fontSize: 40, fontWeight: 800, color: '#1A1040', textAlign: 'center', margin: '0 0 36px', letterSpacing: '-1px', lineHeight: 1.1 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 24, width: '100%' },
    card: { display: 'block', minWidth: 0, textDecoration: 'none', borderRadius: 24, overflow: 'hidden', border: '1.5px solid', boxShadow: '0 10px 30px -18px rgba(26,16,64,.35)' },
    kidsArt: { position: 'relative', height: 150, background: 'linear-gradient(160deg,#FDBA74,#FDE68A)', overflow: 'hidden' },
    kidsEmoji: { position: 'absolute', right: 26, bottom: 14, fontSize: 52, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.18))' },
    adultArt: { position: 'relative', height: 150, background: 'radial-gradient(120% 120% at 100% 0%,#1E3A8A 0%,#0B1B3F 60%)', overflow: 'hidden' },
    adultMark: { position: 'absolute', right: 26, bottom: 18, fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic', fontSize: 30, color: 'rgba(191,219,254,.9)' },
    cardTitle: { fontSize: 26, fontWeight: 700, marginBottom: 6 },
    cardText: { fontSize: 14, color: '#7C5A3F', lineHeight: 1.55, minHeight: 44 },
    cta: { display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, fontWeight: 800, fontSize: 14 },
    teamLink: { marginTop: 36, fontSize: 13, color: '#6B6480', textDecoration: 'none', textAlign: 'center' },
};
