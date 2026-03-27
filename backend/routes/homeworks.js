const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les devoirs (enseignant) ⚠️ AVANT /:id
router.get('/', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            include: {
                task: { select: { titre: true, type: true } },
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                },
                files: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET devoirs d'un étudiant ⚠️ AVANT /:id
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

// POST soumettre un devoir
router.post('/', protect, async (req, res) => {
    const { taskId, studentId, contenu, lienRendu, qcmAnswers } = req.body;
    try {
        const existing = await prisma.homework.findFirst({
            where: {
                taskId: parseInt(taskId),
                studentId: parseInt(studentId),
            }
        });

        if (existing) {
            const updated = await prisma.homework.update({
                where: { id: existing.id },
                data: { contenu, lienRendu, qcmAnswers, statut: 'RENDU' }
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
                statut: 'RENDU',
            }
        });

        // Notification enseignant
        try {
            const task = await prisma.task.findUnique({
                where: { id: parseInt(taskId) },
                include: {
                    chapter: {
                        include: {
                            course: {
                                include: {
                                    group: { include: { teacher: true } }
                                }
                            }
                        }
                    }
                }
            });

            if (task?.chapter?.course?.group?.teacher) {
                const student = await prisma.student.findUnique({
                    where: { id: parseInt(studentId) },
                    include: { user: true }
                });
                await prisma.notification.create({
                    data: {
                        userId: task.chapter.course.group.teacher.id,
                        titre: '📥 Nouveau devoir reçu',
                        message: `${student.user.prenom} ${student.user.nom} a rendu : ${task.titre}`,
                        type: 'DEVOIR',
                    }
                });
            }
        } catch (notifErr) {
            console.error('Erreur notification:', notifErr.message);
        }

        res.status(201).json({ message: 'Devoir soumis', homework });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT corriger un devoir ⚠️ APRÈS /student
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { note, commentaire } = req.body;
    try {
        const homework = await prisma.homework.update({
            where: { id: parseInt(req.params.id) },
            data: {
                note: note ? parseFloat(note) : null,
                commentaire,
                statut: 'CORRIGE',
            },
            include: {
                student: { include: { user: true } },
                task: true,
            }
        });

        // Notification étudiant
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
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un devoir
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