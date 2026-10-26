import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import Avatar from '../Avatar';
import GradeModal, { StatusPill, fmtDate } from './GradeModal';
import { errMsg } from '../../utils/files';

// Liste des élèves des groupes du cours, avec leur rendu pour cette leçon
export default function LessonSubmissionsPanel({ lesson, notify }) {
    const [groups, setGroups] = useState(null);
    const [grading, setGrading] = useState(null);

    const load = useCallback(async () => {
        try { const { data } = await api.get(`/content/lessons/${lesson.id}/submissions`); setGroups(data.groups); }
        catch (e) { setGroups([]); notify?.(errMsg(e), 'error'); }
    }, [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    if (groups === null) return <div style={{ fontSize: 13, color: '#9CA3AF', padding: 8 }}>Chargement des rendus…</div>;
    if (groups.length === 0) {
        return <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 2px' }}>Aucun groupe n'est assigné à ce cours : les rendus des élèves apparaîtront ici.</div>;
    }

    const all = groups.flatMap(g => g.students);
    const rendus = all.filter(s => s.submission).length;
    const aCorriger = all.filter(s => s.submission?.statut === 'RENDU').length;

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={chip}>{rendus}/{all.length} rendu{rendus > 1 ? 's' : ''}</span>
                {aCorriger > 0 && <span style={{ ...chip, background: '#FEF3C7', color: '#92400E' }}>{aCorriger} à corriger</span>}
            </div>
            {groups.map(g => (
                <div key={g.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.6px', margin: '6px 0' }}>{g.titre}</div>
                    {g.students.length === 0 && <div style={{ fontSize: 12, color: '#D1D5DB' }}>Aucun élève</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {g.students.map(s => (
                            <div key={s.studentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10, background: '#fff', border: '1px solid #F1F0F7' }}>
                                <Avatar user={s.user} size={28} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1040' }}>{s.user.prenom} {s.user.nom}</div>
                                    {s.submission && <div style={{ fontSize: 11, color: '#9CA3AF' }}>rendu le {fmtDate(s.submission.submittedAt)}</div>}
                                </div>
                                <StatusPill submission={s.submission} dueDate={lesson.homeworkDueDate} />
                                {s.submission && (
                                    <button type="button" style={btn} onClick={() => setGrading(s)}>
                                        {s.submission.statut === 'CORRIGE' ? 'Revoir' : 'Corriger'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {grading && (
                <GradeModal
                    submission={grading.submission}
                    studentName={`${grading.user.prenom} ${grading.user.nom}`}
                    lessonTitle={lesson.titre}
                    dueDate={lesson.homeworkDueDate}
                    notify={notify}
                    onClose={() => setGrading(null)}
                    onSaved={() => { setGrading(null); load(); }}
                />
            )}
        </div>
    );
}

const chip = { fontSize: 12, fontWeight: 800, color: '#6C47FF', background: '#F0EEFF', padding: '3px 10px', borderRadius: 50 };
const btn = { padding: '6px 12px', background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 8, color: '#6C47FF', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
