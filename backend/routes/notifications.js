const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const prisma = require('../lib/prisma');

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

// ✅ déclarée AVANT '/:id/lu', sinon "all" est pris pour un id
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

// PUT marquer comme lu
router.put('/:id/lu', protect, async (req, res) => {
    try {
        // updateMany + userId : on ne peut marquer que SES notifications
        await prisma.notification.updateMany({
            where: { id: parseInt(req.params.id), userId: req.user.id },
            data: { lu: true }
        });
        res.json({ message: 'Notification lue' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;