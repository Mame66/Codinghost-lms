const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, sendSafe } = require('../services/emailService');

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
                    select: {
                        id: true, nom: true, prenom: true,
                        email: true, login: true, plainPassword: true
                    }
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

// GET étudiant connecté
router.get('/me', protect, async (req, res) => {
    try {
        const student = await prisma.student.findFirst({
            where: { userId: req.user.id },
            include: {
                user: { select: { id: true, nom: true, prenom: true, login: true } },
                enrollments: { include: { group: true } }
            }
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json(student);
    } catch (err) {
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
                enrollments: { include: { group: true } }
            }
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un étudiant
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { nom, prenom, email, age, parentNom, parentTel, parentEmail, groupId } = req.body;
    try {
        let login = genLogin(prenom, nom);
        const existingUser = await prisma.user.findUnique({ where: { login } });
        if (existingUser) login = `${login}_${Date.now()}`;

        const plainPassword = genPassword(prenom, nom);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const finalEmail = email || `${login}_${Date.now()}@codinghost.fr`;

        const user = await prisma.user.create({
            data: {
                nom, prenom,
                email: finalEmail,
                login,
                password: hashedPassword,
                plainPassword,
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

        if (groupId) {
            await prisma.enrollment.create({
                data: {
                    studentId: student.id,
                    groupId: parseInt(groupId),
                }
            });
        }

        // ✅ Email de bienvenue automatique
        const emailDest = parentEmail || (email && !email.includes('@codinghost.fr') ? email : null);
        if (emailDest) {
            await sendSafe(
                () => sendWelcomeEmail({
                    to:          emailDest,
                    parentName:  parentNom || '',
                    studentName: `${prenom} ${nom}`,
                    login:       login,
                    password:    plainPassword,
                    groupName:   groupId ? null : null,
                }),
                { type:'WELCOME', to:emailDest, subject:`Bienvenue chez CodingHost — ${prenom} ${nom}` },
                prisma
            );
            console.log(`✅ Email de bienvenue envoyé à ${emailDest}`);
        }

        res.status(201).json({
            message: 'Étudiant créé avec succès',
            student,
            credentials: { login, password: plainPassword },
            emailSent: !!emailDest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un étudiant complet
router.put('/:id/full', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { nom, prenom, age, parentNom, parentTel, parentEmail, groupId, resetPassword } = req.body;
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { user: true }
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });

        await prisma.student.update({
            where: { id: parseInt(req.params.id) },
            data: {
                age: age ? parseInt(age) : null,
                parentNom: parentNom || null,
                parentTel: parentTel || null,
                parentEmail: parentEmail || null,
            }
        });

        const userUpdateData = { nom, prenom };
        let newPassword = null;

        if (resetPassword) {
            newPassword = genPassword(prenom, nom);
            userUpdateData.password = await bcrypt.hash(newPassword, 10);
            userUpdateData.plainPassword = newPassword;
        }

        await prisma.user.update({
            where: { id: student.userId },
            data: userUpdateData
        });

        // Gérer le groupe
        if (groupId !== undefined) {
            const existingEnrollments = await prisma.enrollment.findMany({
                where: { studentId: student.id }
            });
            for (const enrollment of existingEnrollments) {
                await prisma.attendance.deleteMany({
                    where: { enrollmentId: enrollment.id }
                });
            }
            await prisma.enrollment.deleteMany({ where: { studentId: student.id } });
            if (groupId) {
                await prisma.enrollment.create({
                    data: { studentId: student.id, groupId: parseInt(groupId) }
                });
            }
        }

        // ✅ Email nouveau mot de passe si réinitialisé
        if (resetPassword && newPassword) {
            const emailDest = parentEmail || student.parentEmail || student.user?.email;
            if (emailDest && !emailDest.includes('@codinghost.fr')) {
                await sendSafe(
                    () => sendWelcomeEmail({
                        to:          emailDest,
                        parentName:  parentNom || student.parentNom || '',
                        studentName: `${prenom} ${nom}`,
                        login:       student.user?.login,
                        password:    newPassword,
                    }),
                    { type:'RESET_PASSWORD', to:emailDest, subject:`Nouveaux identifiants — ${prenom} ${nom}` },
                    prisma
                );
                console.log(`✅ Email nouveau mot de passe envoyé à ${emailDest}`);
            }
        }

        res.json({
            message: 'Étudiant mis à jour',
            newPassword,
            login: student.user.login,
        });
    } catch (err) {
        console.error(err);
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
        await prisma.homework.deleteMany({ where: { studentId: student.id } });
        await prisma.payment.deleteMany({ where: { studentId: student.id } });
        await prisma.student.delete({ where: { id: student.id } });
        await prisma.user.delete({ where: { id: student.userId } });

        res.json({ message: 'Étudiant supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;