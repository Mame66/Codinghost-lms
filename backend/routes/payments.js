const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les paiements
router.get('/', protect, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                },
                group: { select: { id: true, titre: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET paiements d'un groupe
router.get('/group/:groupId', protect, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { groupId: parseInt(req.params.groupId) },
            include: {
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un paiement
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { studentId, groupId, montant, description, statut } = req.body;
    try {
        const payment = await prisma.payment.create({
            data: {
                studentId: parseInt(studentId),
                groupId: parseInt(groupId),
                montant: parseFloat(montant),
                description: description || null,
                statut: statut || 'EN_ATTENTE',
            }
        });
        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier statut paiement
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { statut, montant, description } = req.body;
    try {
        const payment = await prisma.payment.update({
            where: { id: parseInt(req.params.id) },
            data: {
                statut: statut || undefined,
                montant: montant ? parseFloat(montant) : undefined,
                description: description || undefined,
            }
        });
        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un paiement
router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        await prisma.payment.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Paiement supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;