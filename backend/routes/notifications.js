const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET notifications de l'utilisateur connecté
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT marquer comme lu
router.put('/:id/lu', protect, async (req, res) => {
    try {
        await prisma.notification.update({
            where: { id: parseInt(req.params.id) },
            data: { lu: true }
        });
        res.json({ message: 'Notification lue' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT marquer toutes comme lues
router.put('/all/lu', protect, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id },
            data: { lu: true }
        });
        res.json({ message: 'Toutes les notifications lues' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;