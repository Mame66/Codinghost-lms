const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les devoirs (enseignant voit ceux de ses étudiants)
router.get('/', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            include: {
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

// POST soumettre un devoir (étudiant)
router.post('/', protect, async (req, res) => {
    const { taskId, studentId, contenu } = req.body;
    try {
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
            }
        });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET devoirs d'un étudiant
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const homeworks = await prisma.homework.findMany({
            where: { studentId: parseInt(req.params.studentId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;