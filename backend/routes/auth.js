const express = require('express');
const router = express.Router();
const { login, register, me } = require('../controllers/authController');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/login', login);
router.post('/register', protect, allowRoles('ADMIN', 'TEACHER'), register);
router.get('/me', protect, me);

// GET tous les enseignants et admins
router.get('/teachers', protect, async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: {
                role: { in: ['TEACHER', 'ADMIN'] }
            },
            select: { id: true, nom: true, prenom: true, role: true }
        });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;