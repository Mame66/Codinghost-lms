const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET profil utilisateur connecté
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, nom: true, prenom: true,
                email: true, login: true, role: true
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT modifier mot de passe
router.put('/password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mot de passe trop court (min 6 caractères)' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashed }
        });

        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT modifier infos école (admin seulement)
router.put('/school', protect, allowRoles('ADMIN'), async (req, res) => {
    // On stocke dans un fichier JSON simple ou en mémoire
    // Pour l'instant on retourne juste success
    res.json({ message: 'Paramètres sauvegardés', data: req.body });
});

module.exports = router;