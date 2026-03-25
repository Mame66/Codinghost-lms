const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const genLogin = (prenom, nom) => {
    const clean = str => str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');
    return `${clean(prenom)}.${clean(nom)}`;
};

const genPassword = (prenom, nom) => {
    const initiales = (prenom[0] + nom[0]).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 8999);
    const syms = ['!', '@', '#', '*'];
    return `${initiales}${num}${syms[Math.floor(Math.random() * syms.length)]}`;
};

// GET tous les étudiants
router.get('/', protect, async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            include: {
                user: {
                    select: { nom: true, prenom: true, email: true, login: true }
                },
                enrollments: {
                    include: {
                        group: { select: { id: true, titre: true } }
                    }
                }
            }
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un étudiant
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { nom, prenom, email, age, parentNom, parentTel, parentEmail, groupId } = req.body;

    try {
        // Générer login unique
        let login = genLogin(prenom, nom);

        // Vérifier si le login existe déjà
        const existingUser = await prisma.user.findUnique({ where: { login } });
        if (existingUser) {
            login = `${login}_${Date.now()}`;
        }

        const plainPassword = genPassword(prenom, nom);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Générer email unique
        const finalEmail = email || `${login}_${Date.now()}@codinghost.dz`;

        // Vérifier si email existe
        const existingEmail = await prisma.user.findUnique({ where: { email: finalEmail } });
        const uniqueEmail = existingEmail
            ? `${login}_${Date.now()}@codinghost.dz`
            : finalEmail;

        const user = await prisma.user.create({
            data: {
                nom,
                prenom,
                email: uniqueEmail,
                login,
                password: hashedPassword,
                role: 'STUDENT',
            }
        });

        const student = await prisma.student.create({
            data: {
                userId: user.id,
                age: age ? parseInt(age) : null,
                parentNom: parentNom || null,
                parentTel: parentTel || null,
                parentEmail: parentEmail || null,
            }
        });

        // Inscrire dans un groupe si fourni
        if (groupId) {
            await prisma.enrollment.create({
                data: {
                    studentId: student.id,
                    groupId: parseInt(groupId),
                }
            });
        }

        res.status(201).json({
            message: 'Étudiant créé avec succès',
            student,
            credentials: {
                login: user.login,
                password: plainPassword
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET un étudiant par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                user: true,
                enrollments: {
                    include: { group: true }
                }
            }
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un étudiant
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const student = await prisma.student.update({
            where: { id: parseInt(req.params.id) },
            data: {
                age: req.body.age ? parseInt(req.body.age) : null,
                parentNom: req.body.parentNom || null,
                parentTel: req.body.parentTel || null,
                parentEmail: req.body.parentEmail || null,
            }
        });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un étudiant
router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });

        await prisma.enrollment.deleteMany({ where: { studentId: student.id } });
        await prisma.student.delete({ where: { id: student.id } });
        await prisma.user.delete({ where: { id: student.userId } });

        res.json({ message: 'Étudiant supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;