const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les devoirs
router.get('/', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            include: {
                task: { select: { titre: true, type: true } },
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET devoirs d'un étudiant
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            where: { studentId: parseInt(req.params.studentId) },
            include: {
                task: { select: { titre: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST soumettre un devoir (étudiant)
router.post('/', protect, async (req, res) => {
    const { taskId, studentId, contenu } = req.body;
    try {
        // Vérifier si devoir déjà soumis
        const existing = await prisma.homework.findFirst({
            where: {
                taskId: parseInt(taskId),
                studentId: parseInt(studentId),
            }
        });
        if (existing) {
            return res.status(400).json({ message: 'Devoir déjà soumis' });
        }

        const homework = await prisma.homework.create({
            data: {
                taskId: parseInt(taskId),
                studentId: parseInt(studentId),
                contenu,
                statut: 'RENDU',
            }
        });
        res.status(201).json(homework);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT corriger un devoir (enseignant)
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

        // Créer une notification pour l'étudiant
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
        await prisma.homework.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Devoir supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;