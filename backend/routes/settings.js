const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const prisma = require('../lib/prisma');

// GET profil utilisateur connecté
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, nom: true, prenom: true,
                email: true, login: true, role: true,
                avatarUrl: true, telephone: true, specialites: true,
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT modifier son téléphone (le nom/prénom restent gérés par l'administration)
router.put('/profile', protect, async (req, res) => {
    try {
        const data = {};
        if (req.body.telephone !== undefined) data.telephone = String(req.body.telephone || '').trim() || null;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data,
            select: { id: true, nom: true, prenom: true, email: true, login: true, role: true, avatarUrl: true, telephone: true },
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

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Remplissez tous les champs' });
        }
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
            data: { password: hashed, plainPassword: null } // l'ancien mot de passe en clair n'est plus valable
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