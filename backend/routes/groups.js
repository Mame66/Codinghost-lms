const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les groupes
router.get('/', protect, async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            include: {
                course: true,
                teacher: { select: { nom: true, prenom: true } },
                supervisor: { select: { nom: true, prenom: true } },
                _count: { select: { enrollments: true } }
            }
        });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET un groupe par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                course: true,
                teacher: { select: { nom: true, prenom: true, id: true } },
                supervisor: { select: { nom: true, prenom: true, id: true } },
                enrollments: {
                    include: {
                        student: {
                            include: { user: { select: { nom: true, prenom: true } } }
                        }
                    }
                }
            }
        });
        if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un groupe
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, courseId, teacherId, supervisorId, lieu, statut, format, type } = req.body;
    try {
        const group = await prisma.group.create({
            data: {
                titre,
                courseId: courseId || null,
                teacherId: teacherId || null,
                supervisorId: supervisorId || null,
                lieu: lieu || null,
                statut: statut || 'INSCRIPTION',
                format: format || 'OFFLINE',
                type: type || 'GROUPE',
            }
        });
        res.status(201).json(group);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un groupe
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const group = await prisma.group.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un groupe
router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        await prisma.group.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Groupe supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;