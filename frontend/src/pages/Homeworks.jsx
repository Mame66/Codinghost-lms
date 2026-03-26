import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function MyHomeworks() {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const meRes = await api.get('/auth/me');
            const studentsRes = await api.get('/students');
            const student = studentsRes.data.find(s => s.user?.login === meRes.data.login);
            if (student) {
                setStudentId(student.id);
                const hwRes = await api.get(`/homeworks/student/${student.id}`);
                setHomeworks(hwRes.data);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const statusColors = {
        RENDU: { bg: 'rgba(255,184,0,0.15)', color: '#8B6200', label: '⏳ En attente de correction' },
        CORRIGE: { bg: 'rgba(0,196,140,0.12)', color: '#008060', label: '✅ Corrigé' },
        EN_ATTENTE: { bg: 'rgba(91,46,232,0.12)', color: '#5B2EE8', label: '📝 En attente' },
    };

    const filtered = filter === 'all' ? homeworks
        : homeworks.filter(h => h.statut === filter);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Chargement...
        </div>
    );

    return (
        <div>
            <div style={s.ph}>
                <h1 style={s.h1}>✏️ Mes Devoirs</h1>
            </div>

            {/* Stats */}
            <div style={s.statsGrid}>
                <div style={s.statCard}>
                    <div style={s.statIcon}>📝</div>
                    <div style={s.statVal}>{homeworks.length}</div>
                    <div style={s.statLbl}>Total devoirs</div>
                </div>
                <div style={s.statCard}>
                    <div style={s.statIcon}>⏳</div>
                    <div style={s.statVal}>{homeworks.filter(h => h.statut === 'RENDU').length}</div>
                    <div style={s.statLbl}>En attente</div>
                </div>
                <div style={s.statCard}>
                    <div style={s.statIcon}>✅</div>
                    <div style={s.statVal}>{homeworks.filter(h => h.statut === 'CORRIGE').length}</div>
                    <div style={s.statLbl}>Corrigés</div>
                </div>
                <div style={s.statCard}>
                    <div style={s.statIcon}>⭐</div>
                    <div style={s.statVal}>
                        {homeworks.filter(h => h.note !== null).length > 0
                            ? (homeworks.filter(h => h.note !== null).reduce((a, b) => a + b.note, 0) /
                                homeworks.filter(h => h.note !== null).length).toFixed(1)
                            : '—'}
                    </div>
                    <div style={s.statLbl}>Moyenne</div>
                </div>
            </div>

            {/* Filter tabs */}
            <div style={s.ftabs}>
                {[
                    { key: 'all', label: 'Tous', count: homeworks.length },
                    { key: 'RENDU', label: 'En attente', count: homeworks.filter(h => h.statut === 'RENDU').length },
                    { key: 'CORRIGE', label: 'Corrigés', count: homeworks.filter(h => h.statut === 'CORRIGE').length },
                ].map(f => (
                    <button key={f.key} style={{ ...s.ft, ...(filter === f.key ? s.ftOn : {}) }}
                            onClick={() => setFilter(f.key)}>
                        {f.label} <span style={s.fc}>{f.count}</span>
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div style={s.emptyBox}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✏️</div>
                    <div style={s.emptyTitle}>Aucun devoir</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>
                        Vos devoirs soumis apparaîtront ici
                    </div>
                </div>
            ) : (
                <div style={s.hwList}>
                    {filtered.map(hw => (
                        <div key={hw.id} style={s.hwCard}>
                            <div style={s.hwTop}>
                                <div style={s.hwIcon}>
                                    {hw.statut === 'CORRIGE' ? '✅' : '⏳'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={s.hwTitle}>Tâche #{hw.taskId}</div>
                                    <div style={s.hwDate}>
                                        Soumis le {new Date(hw.createdAt).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <span style={{
                                    ...s.pill,
                                    background: statusColors[hw.statut]?.bg,
                                    color: statusColors[hw.statut]?.color,
                                }}>
                  {statusColors[hw.statut]?.label}
                </span>
                            </div>

                            {hw.contenu && (
                                <div style={s.hwContenu}>
                                    <div style={s.hwContenuTitle}>📝 Ma réponse :</div>
                                    <div style={s.hwContenuText}>{hw.contenu}</div>
                                </div>
                            )}

                            {hw.statut === 'CORRIGE' && (
                                <div style={s.hwResult}>
                                    <div style={s.hwNote}>
                                        <span style={s.hwNoteVal}>{hw.note}/20</span>
                                        <span style={{
                                            ...s.hwNoteLabel,
                                            color: hw.note >= 10 ? '#008060' : '#CC0033',
                                        }}>
                      {hw.note >= 16 ? '🌟 Excellent !'
                          : hw.note >= 12 ? '👍 Bien'
                              : hw.note >= 10 ? '✅ Passable'
                                  : '❌ Insuffisant'}
                    </span>
                                    </div>
                                    {hw.commentaire && (
                                        <div style={s.hwComment}>
                                            <div style={s.hwCommentTitle}>💬 Commentaire de l'enseignant :</div>
                                            <div style={s.hwCommentText}>{hw.commentaire}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const s = {
    ph: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    h1: { fontFamily: 'sans-serif', fontSize: '22px', fontWeight: '800', color: '#1A1040' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' },
    statCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '20px', textAlign: 'center' },
    statIcon: { fontSize: '28px', marginBottom: '8px' },
    statVal: { fontFamily: 'sans-serif', fontSize: '28px', fontWeight: '800', color: '#1A1040' },
    statLbl: { fontSize: '12px', color: '#6B7280', fontWeight: '600', marginTop: '2px' },
    ftabs: { display: 'flex', gap: '6px', marginBottom: '18px' },
    ft: { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#6B7280', border: 'none' },
    ftOn: { background: '#EDE8FF', color: '#5B2EE8' },
    fc: { display: 'inline-block', marginLeft: '5px', background: 'rgba(91,46,232,0.12)', color: '#5B2EE8', borderRadius: '50px', padding: '0 6px', fontSize: '10px' },
    emptyBox: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '48px', textAlign: 'center' },
    emptyTitle: { fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '800', color: '#1A1040', marginBottom: '8px' },
    hwList: { display: 'flex', flexDirection: 'column', gap: '14px' },
    hwCard: { background: '#fff', border: '1px solid #E5E0F5', borderRadius: '14px', padding: '20px' },
    hwTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    hwIcon: { width: '40px', height: '40px', background: '#F8F6FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
    hwTitle: { fontFamily: 'sans-serif', fontSize: '15px', fontWeight: '800', color: '#1A1040' },
    hwDate: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
    pill: { display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' },
    hwContenu: { background: '#F8F6FF', borderRadius: '8px', padding: '12px', marginBottom: '12px' },
    hwContenuTitle: { fontSize: '11px', fontWeight: '800', color: '#5B2EE8', marginBottom: '6px', textTransform: 'uppercase' },
    hwContenuText: { fontSize: '13px', color: '#1A1040', lineHeight: 1.6 },
    hwResult: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '16px' },
    hwNote: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
    hwNoteVal: { fontFamily: 'sans-serif', fontSize: '28px', fontWeight: '900', color: '#1A1040' },
    hwNoteLabel: { fontSize: '14px', fontWeight: '700' },
    hwComment: {},
    hwCommentTitle: { fontSize: '11px', fontWeight: '800', color: '#008060', marginBottom: '6px', textTransform: 'uppercase' },
    hwCommentText: { fontSize: '13px', color: '#1A1040', lineHeight: 1.6, fontStyle: 'italic' },
};