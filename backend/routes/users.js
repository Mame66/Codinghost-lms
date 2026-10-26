// ════════════════════════════════════════════════════════════
// Photos de profil (élèves, enseignants, admins)
// ════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { uploadAvatar, deleteAvatar } = require('../lib/storage');

const setAvatar = async (userId, image) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, avatarUrl: true } });
    if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
    const url = await uploadAvatar(userId, image);
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
    await deleteAvatar(user.avatarUrl);
    return url;
};

const clearAvatar = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
    if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
    await deleteAvatar(user.avatarUrl);
};

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        console.error('avatar error:', err);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de la photo', error: err.message });
    }
};

// Ma photo  — body: { image: "data:image/jpeg;base64,..." }
router.post('/me/avatar', protect, handle(async (req, res) => {
    const url = await setAvatar(req.user.id, req.body.image);
    res.json({ avatarUrl: url });
}));

router.delete('/me/avatar', protect, handle(async (req, res) => {
    await clearAvatar(req.user.id);
    res.json({ avatarUrl: null });
}));

// Photo d'un autre utilisateur (admin)
router.post('/:id/avatar', protect, adminOnly, handle(async (req, res) => {
    const url = await setAvatar(parseInt(req.params.id), req.body.image);
    res.json({ avatarUrl: url });
}));

router.delete('/:id/avatar', protect, adminOnly, handle(async (req, res) => {
    await clearAvatar(parseInt(req.params.id));
    res.json({ avatarUrl: null });
}));

module.exports = router;
