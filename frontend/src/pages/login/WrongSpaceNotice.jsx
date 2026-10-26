import { AUDIENCES } from '../../utils/audience';

// Bandeau « mauvais espace » commun aux pages de connexion
export default function WrongSpaceNotice({ wrongSpace, onGo, tone = 'light' }) {
    if (!wrongSpace) return null;
    const a = AUDIENCES[wrongSpace.espace];
    const dark = tone === 'dark';
    return (
        <div style={{
            borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.5,
            background: dark ? 'rgba(251,191,36,.12)' : '#FFFBEB',
            border: `1px solid ${dark ? 'rgba(251,191,36,.35)' : '#FDE68A'}`,
            color: dark ? '#FCD34D' : '#92400E',
        }}>
            <div style={{ fontWeight: 700 }}>{wrongSpace.message}</div>
            {a && (
                <button type="button" onClick={onGo} style={{
                    marginTop: 8, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: a.color, color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                }}>
                    Aller à l'espace {a.label} →
                </button>
            )}
        </div>
    );
}
