const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ✅ GET devoirs — Admin voit tout, Enseignant voit SEULEMENT ses groupes
router.get('/', protect, async (req, res) => {
    try {
        let homeworks = [];

        if (req.user.role === 'ADMIN') {
            homeworks = await prisma.homework.findMany({
                include: {
                    task: { select: { id: true, titre: true, type: true, chapterId: true } },
                    student: {
                        include: {
                            user: { select: { nom: true, prenom: true, login: true } },
                            enrollments: {
                                include: { group: { select: { id: true, titre: true } } }
                            }
                        }
                    },
                    files: true,
                },
                orderBy: { createdAt: 'desc' }
            });

        } else if (req.user.role === 'TEACHER') {
            // Trouver les groupes où cet enseignant est assigné
            const teacherGroups = await prisma.group.findMany({
                where: { teacherId: req.user.id },
                include: {
                    enrollments: { select: { studentId: true } }
                }
            });

            if (teacherGroups.length === 0) {
                return res.json([]);
            }

            const studentIds = teacherGroups.flatMap(g =>
                g.enrollments.map(e => e.studentId)
            );

            if (studentIds.length === 0) {
                return res.json([]);
            }

            homeworks = await prisma.homework.findMany({
                where: { studentId: { in: studentIds } },
                include: {
                    task: { select: { id: true, titre: true, type: true, chapterId: true } },
                    student: {
                        include: {
                            user: { select: { nom: true, prenom: true, login: true } },
                            enrollments: {
                                include: { group: { select: { id: true, titre: true } } }
                            }
                        }
                    },
                    files: true,
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        res.json(homeworks);
    } catch (err) {
        console.error('GET /homeworks error:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ✅ GET devoirs d'un étudiant spécifique
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            where: { studentId: parseInt(req.params.studentId) },
            include: {
                task: { select: { titre: true, type: true } },
                files: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ✅ POST soumettre un devoir — notification SEULEMENT au prof du groupe de l'étudiant
router.post('/', protect, async (req, res) => {
    const { taskId, studentId, contenu, lienRendu, qcmAnswers, qcmSoumis } = req.body;
    try {
        const existing = await prisma.homework.findFirst({
            where: {
                taskId: parseInt(taskId),
                studentId: parseInt(studentId),
            }
        });

        if (existing?.qcmSoumis) {
            return res.status(400).json({ message: 'QCM déjà soumis, impossible de refaire' });
        }

        // Calculer note QCM automatiquement depuis la base de données
        let noteQcm = null;
        if (qcmSoumis && qcmAnswers) {
            try {
                const questions = await prisma.qcmQuestion.findMany({
                    where: { taskId: parseInt(taskId) },
                    orderBy: { ordre: 'asc' }
                });

                const answers = typeof qcmAnswers === 'string'
                    ? JSON.parse(qcmAnswers) : qcmAnswers;

                let correct = 0;
                questions.forEach((q, i) => {
                    const userAns = parseInt(answers[i]);
                    if (!isNaN(userAns) && userAns === q.correct) correct++;
                });

                noteQcm = questions.length > 0
                    ? Math.round((correct / questions.length) * 20) : 0;
            } catch (e) {
                console.error('Erreur calcul QCM:', e);
            }
        }

        if (existing) {
            const updated = await prisma.homework.update({
                where: { id: existing.id },
                data: {
                    contenu: contenu || existing.contenu,
                    lienRendu: lienRendu !== undefined ? lienRendu : existing.lienRendu,
                    qcmAnswers: qcmAnswers || existing.qcmAnswers,
                    qcmSoumis: qcmSoumis || existing.qcmSoumis,
                    note: noteQcm !== null ? noteQcm : existing.note,
                    statut: 'RENDU',
                }
            });
            return res.json({ message: 'Devoir mis à jour', homework: updated });
        }

        const homework = await prisma.homework.create({
            data: {
                taskId: parseInt(taskId),
                studentId: parseInt(studentId),
                contenu,
                lienRendu,
                qcmAnswers,
                qcmSoumis: qcmSoumis || false,
                note: noteQcm,
                statut: 'RENDU',
            }
        });

        // ✅ Notification UNIQUEMENT au prof du groupe de l'étudiant
        try {
            // Trouver le groupe de l'étudiant
            const studentEnrollment = await prisma.enrollment.findFirst({
                where: { studentId: parseInt(studentId) },
                include: {
                    group: { include: { teacher: true } }
                }
            });

            const student = await prisma.student.findUnique({
                where: { id: parseInt(studentId) },
                include: { user: true }
            });

            const task = await prisma.task.findUnique({
                where: { id: parseInt(taskId) },
                select: { titre: true }
            });

            // Notifier seulement le prof du groupe de l'étudiant
            if (studentEnrollment?.group?.teacher && student && task) {
                await prisma.notification.create({
                    data: {
                        userId: studentEnrollment.group.teacher.id,
                        titre: '📥 Nouveau devoir reçu',
                        message: `${student.user.prenom} ${student.user.nom} a rendu : ${task.titre}`,
                        type: 'DEVOIR',
                    }
                });
            }
        } catch (e) {
            console.error('Erreur notification:', e);
        }

        res.status(201).json({ message: 'Devoir soumis', homework });
    } catch (err) {
        console.error('POST /homeworks error:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ✅ PUT corriger un devoir — notification à l'étudiant
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { note, commentaire } = req.body;
    try {
        // Vérifier que l'enseignant a le droit de corriger ce devoir
        if (req.user.role === 'TEACHER') {
            const homework = await prisma.homework.findUnique({
                where: { id: parseInt(req.params.id) },
                include: {
                    student: {
                        include: {
                            enrollments: { include: { group: true } }
                        }
                    }
                }
            });

            const studentGroupIds = homework?.student?.enrollments?.map(e => e.groupId) || [];
            const teacherGroups = await prisma.group.findMany({
                where: { teacherId: req.user.id },
                select: { id: true }
            });
            const teacherGroupIds = teacherGroups.map(g => g.id);

            const hasAccess = studentGroupIds.some(id => teacherGroupIds.includes(id));
            if (!hasAccess) {
                return res.status(403).json({ message: 'Accès refusé — ce devoir n\'appartient pas à votre groupe' });
            }
        }

        const homework = await prisma.homework.update({
            where: { id: parseInt(req.params.id) },
            data: {
                note: note !== undefined ? parseFloat(note) : null,
                commentaire,
                statut: 'CORRIGE',
            },
            include: {
                student: { include: { user: true } },
                task: true,
            }
        });

        // Notification à l'étudiant
        await prisma.notification.create({
            data: {
                userId: homework.student.userId,
                titre: '📝 Nouvelle note reçue',
                message: `Vous avez reçu ${note}/20 pour : ${homework.task.titre}`,
                type: 'NOTE',
            }
        });

        res.json(homework);
    } catch (err) {
        console.error('PUT /homeworks error:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ✅ DELETE devoir
router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        await prisma.homeworkFile.deleteMany({ where: { homeworkId: parseInt(req.params.id) } });
        await prisma.homework.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Devoir supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;