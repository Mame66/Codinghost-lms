const express = require('express');
const router = express.Router();
const { login, register, me } = require('../controllers/authController');
const { protect, adminOnly, staffOnly } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

router.post('/login', login);
router.post('/register', protect, adminOnly, register);
router.get('/me', protect, me);

// GET enseignants + admins actifs (listes déroulantes des groupes)
router.get('/teachers', protect, staffOnly, async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: { in: ['TEACHER', 'ADMIN'] }, actif: true },
            select: { id: true, nom: true, prenom: true, role: true, avatarUrl: true },
            orderBy: [{ prenom: 'asc' }, { nom: 'asc' }],
        });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
