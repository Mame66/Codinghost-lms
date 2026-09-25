const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { sendAbsenceEmail, sendSafe } = require('../services/emailService');

const prisma = new PrismaClient();

// ── Helper : envoyer email absence ───────────────────────
const notifyAbsence = async (enrollmentId, date, prisma, req) => {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: parseInt(enrollmentId) },
            include: {
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                },
                group: { select: { titre: true } }
            }
        });

        if (!enrollment) return;

        const parentEmail = enrollment.student?.parentEmail;
        if (!parentEmail || parentEmail.includes('@codinghost.fr')) return;

        const studentName = `${enrollment.student?.user?.prenom} ${enrollment.student?.user?.nom}`;
        const teacherName = req.user ? `${req.user.prenom} ${req.user.nom}` : '';

        await sendSafe(
            () => sendAbsenceEmail({
                to:          parentEmail,
                parentName:  enrollment.student?.parentNom || '',
                studentName,
                groupName:   enrollment.group?.titre || '',
                date:        date || new Date(),
                teacherName,
            }),
            { type:'ABSENCE', to:parentEmail, subject:`Absence signalée — ${studentName}` },
            prisma
        );
        console.log(`✅ Email absence envoyé à ${parentEmail} pour ${studentName}`);
    } catch (err) {
        console.error('Erreur email absence:', err.message);
    }
};

// GET présences d'un groupe
router.get('/group/:groupId', protect, async (req, res) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { groupId: parseInt(req.params.groupId) },
            include: {
                student: {
                    include: {
                        user: { select: { nom: true, prenom: true } }
                    }
                },
                attendance: {
                    orderBy: { date: 'desc' }
                }
            }
        });
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST marquer présence
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { enrollmentId, date, statut } = req.body;
    try {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        const existing = await prisma.attendance.findFirst({
            where: {
                enrollmentId: parseInt(enrollmentId),
                date: { gte: dateObj, lt: nextDay }
            }
        });

        let result;
        const wasAbsent = existing?.statut !== 'ABSENT' && statut === 'ABSENT';

        if (existing) {
            result = await prisma.attendance.update({
                where: { id: existing.id },
                data: { statut }
            });
        } else {
            result = await prisma.attendance.create({
                data: {
                    enrollmentId: parseInt(enrollmentId),
                    date: new Date(date),
                    statut: statut || 'PRESENT'
                }
            });
        }

        // ✅ Email absence si statut ABSENT
        if (statut === 'ABSENT') {
            await notifyAbsence(enrollmentId, date, prisma, req);
        }

        return res.status(existing ? 200 : 201).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST marquer présence pour toute une séance
router.post('/session', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { groupId, date, presences } = req.body;
    try {
        const results = [];
        const absents = [];

        for (const p of presences) {
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);
            const nextDay = new Date(dateObj);
            nextDay.setDate(nextDay.getDate() + 1);

            const existing = await prisma.attendance.findFirst({
                where: {
                    enrollmentId: parseInt(p.enrollmentId),
                    date: { gte: dateObj, lt: nextDay }
                }
            });

            if (existing) {
                const updated = await prisma.attendance.update({
                    where: { id: existing.id },
                    data: { statut: p.statut }
                });
                results.push(updated);
            } else {
                const created = await prisma.attendance.create({
                    data: {
                        enrollmentId: parseInt(p.enrollmentId),
                        date: new Date(date),
                        statut: p.statut
                    }
                });
                results.push(created);
            }

            // Collecter les absents pour email
            if (p.statut === 'ABSENT') {
                absents.push(p.enrollmentId);
            }
        }

        // ✅ Envoyer emails absence pour tous les absents
        for (const enrollmentId of absents) {
            await notifyAbsence(enrollmentId, date, prisma, req);
        }

        res.json({
            message: 'Présences enregistrées',
            count: results.length,
            absentsNotified: absents.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;