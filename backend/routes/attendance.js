const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
        // Vérifier si présence existe déjà pour cette date
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

        if (existing) {
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: { statut }
            });
            return res.json(updated);
        }

        const attendance = await prisma.attendance.create({
            data: {
                enrollmentId: parseInt(enrollmentId),
                date: new Date(date),
                statut: statut || 'PRESENT'
            }
        });
        res.status(201).json(attendance);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST marquer présence pour toute une séance (tous les étudiants d'un groupe)
router.post('/session', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { groupId, date, presences } = req.body;
    // presences = [{ enrollmentId, statut }]
    try {
        const results = [];
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
        }
        res.json({ message: 'Présences enregistrées', count: results.length });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;