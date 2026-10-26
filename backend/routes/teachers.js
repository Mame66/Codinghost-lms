// ════════════════════════════════════════════════════════════
// Gestion des enseignants (ADMIN uniquement)
// ════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { uniqueLogin, genStaffPassword } = require('../lib/credentials');
const { sendTeacherWelcomeEmail, sendSafe } = require('../services/emailService');

router.use(protect, adminOnly);

const clean = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
};

const teacherSelect = {
    id: true, nom: true, prenom: true, email: true, login: true, role: true,
    avatarUrl: true, telephone: true, specialites: true, actif: true, createdAt: true,
    taughtGroups: {
        select: {
            id: true, titre: true, audience: true, ville: true, statut: true,
            _count: { select: { enrollments: true } },
        },
        orderBy: { titre: 'asc' },
    },
    supervisedGroups: { select: { id: true, titre: true } },
};

// GET /teachers
router.get('/', async (req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: { in: ['TEACHER', 'TEACHER_VIEW'] } },
            select: teacherSelect,
            orderBy: [{ actif: 'desc' }, { prenom: 'asc' }],
        });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /teachers/:id
router.get('/:id', async (req, res) => {
    try {
        const t = await prisma.user.findFirst({
            where: { id: parseInt(req.params.id), role: { in: ['TEACHER', 'TEACHER_VIEW'] } },
            select: teacherSelect,
        });
        if (!t) return res.status(404).json({ message: 'Enseignant introuvable' });
        res.json(t);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST /teachers  { prenom, nom, email, telephone, specialites, sendEmail }
router.post('/', async (req, res) => {
    const prenom = clean(req.body.prenom);
    const nom = clean(req.body.nom);
    const email = clean(req.body.email);
    if (!prenom || !nom) return res.status(400).json({ message: 'Prénom et nom obligatoires' });
    if (!email) return res.status(400).json({ message: 'L\'email est obligatoire pour un enseignant' });

    try {
        const exists = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
        if (exists) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

        const login = await uniqueLogin(prisma, prenom, nom);
        const password = genStaffPassword();
        const user = await prisma.user.create({
            data: {
                prenom, nom, email, login,
                password: await bcrypt.hash(password, 10),
                telephone: clean(req.body.telephone),
                specialites: clean(req.body.specialites),
                role: 'TEACHER',
            },
            select: teacherSelect,
        });

        let emailSent = false;
        if (req.body.sendEmail) {
            const r = await sendSafe(
                () => sendTeacherWelcomeEmail({ to: email, prenom, login, password }),
                { type: 'TEACHER_WELCOME', to: email, subject: `Votre accès enseignant CodingHost` },
                prisma
            );
            emailSent = r.success;
        }

        // Le mot de passe n'est PAS stocké en clair pour le personnel : il n'est montré qu'une fois.
        res.status(201).json({ teacher: user, credentials: { login, password }, emailSent });
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ message: 'Login ou email déjà utilisé' });
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT /teachers/:id  { prenom, nom, email, telephone, specialites, actif }
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const t = await prisma.user.findFirst({ where: { id, role: { in: ['TEACHER', 'TEACHER_VIEW'] } } });
        if (!t) return res.status(404).json({ message: 'Enseignant introuvable' });

        const data = {};
        if (req.body.prenom !== undefined) data.prenom = clean(req.body.prenom) || t.prenom;
        if (req.body.nom !== undefined) data.nom = clean(req.body.nom) || t.nom;
        if (req.body.telephone !== undefined) data.telephone = clean(req.body.telephone);
        if (req.body.specialites !== undefined) data.specialites = clean(req.body.specialites);
        if (req.body.actif !== undefined) data.actif = !!req.body.actif;
        if (req.body.email !== undefined) {
            const email = clean(req.body.email);
            if (!email) return res.status(400).json({ message: 'L\'email est obligatoire' });
            const exists = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, NOT: { id } } });
            if (exists) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            data.email = email;
        }

        const user = await prisma.user.update({ where: { id }, data, select: teacherSelect });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST /teachers/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const t = await prisma.user.findFirst({ where: { id, role: { in: ['TEACHER', 'TEACHER_VIEW'] } } });
        if (!t) return res.status(404).json({ message: 'Enseignant introuvable' });
        const password = genStaffPassword();
        await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(password, 10), plainPassword: null } });
        res.json({ credentials: { login: t.login, password } });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE /teachers/:id — refusé s'il a encore des groupes (le désactiver à la place)
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const t = await prisma.user.findFirst({
            where: { id, role: { in: ['TEACHER', 'TEACHER_VIEW'] } },
            select: { id: true, _count: { select: { taughtGroups: true, supervisedGroups: true } } },
        });
        if (!t) return res.status(404).json({ message: 'Enseignant introuvable' });
        const nbGroups = t._count.taughtGroups + t._count.supervisedGroups;
        if (nbGroups > 0) {
            return res.status(409).json({
                message: `Cet enseignant est encore assigné à ${nbGroups} groupe(s). Réassignez ses groupes ou désactivez son compte.`,
            });
        }
        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } }),
        ]);
        res.json({ message: 'Enseignant supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;
