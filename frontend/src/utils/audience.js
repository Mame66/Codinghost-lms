// ════════════════════════════════════════════════════════════
// Publics : Enfants / Adultes — couleurs et libellés partagés
// ════════════════════════════════════════════════════════════
export const AUDIENCES = {
    ENFANT: {
        key: 'ENFANT',
        slug: 'enfants',
        label: 'Enfants',
        labelOne: 'Enfant',
        color: '#EA580C',
        bg: '#FFF4EC',
        border: '#FED7AA',
        gradient: 'linear-gradient(135deg,#F97316,#FACC15)',
        icon: '🎮',
        examples: 'Roblox · Minecraft · Scratch · Unity · Python débutant',
    },
    ADULTE: {
        key: 'ADULTE',
        slug: 'adultes',
        label: 'Adultes',
        labelOne: 'Adulte',
        color: '#1D4ED8',
        bg: '#EFF4FF',
        border: '#BFD3FE',
        gradient: 'linear-gradient(135deg,#1E3A8A,#2563EB)',
        icon: '💼',
        examples: 'Python · Bureautique · Anglais · Numérique',
    },
};

export const audienceFromSlug = (slug) =>
    Object.values(AUDIENCES).find(a => a.slug === slug)?.key || 'ENFANT';

export const AudienceBadge = ({ audience, size = 'md' }) => {
    const a = AUDIENCES[audience];
    if (!a) return <span style={{ fontSize: '11px', color: '#9CA3AF' }}>—</span>;
    const small = size === 'sm';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: small ? '2px 8px' : '3px 10px', borderRadius: '50px',
            fontSize: small ? '10px' : '11px', fontWeight: 800, whiteSpace: 'nowrap',
            background: a.bg, color: a.color, border: `1px solid ${a.border}`,
        }}>
            {a.labelOne}
        </span>
    );
};

// Mémorise le dernier espace de connexion utilisé (pour la déconnexion)
export const LAST_SPACE_KEY = 'ch_last_space';
export const loginPathFor = (espace) =>
    espace === 'ENFANT' ? '/login/enfants' : espace === 'ADULTE' ? '/login/adultes' : espace === 'EQUIPE' ? '/login/equipe' : '/login';

export const rememberSpace = (espace) => { try { localStorage.setItem(LAST_SPACE_KEY, espace); } catch {} };
export const lastSpace = () => { try { return localStorage.getItem(LAST_SPACE_KEY); } catch { return null; } };
