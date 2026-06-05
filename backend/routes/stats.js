const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const [
            totalStudents,
            totalGroups,
            totalTeachers,
            totalCourses,
            totalHomeworks,
            pendingHomeworks,
            totalPayments,
            paidPayments,
            recentHomeworks,
            recentStudents,
        ] = await Promise.all([
            prisma.student.count(),
            prisma.group.count(),
            prisma.user.count({ where: { role: { in: ['TEACHER'] } } }),
            prisma.course.count(),
            prisma.homework.count(),
            prisma.homework.count({ where: { statut: 'RENDU' } }),
            prisma.payment.aggregate({ _sum: { montant: true } }),
            prisma.payment.aggregate({ _sum: { montant: true }, where: { statut: 'PAYE' } }),
            prisma.homework.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { include: { user: { select: { nom: true, prenom: true } } } },
                    task: { select: { titre: true, type: true } },
                }
            }),
            prisma.student.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { nom: true, prenom: true, createdAt: true } },
                    enrollments: { include: { group: { select: { titre: true } } } }
                }
            }),
        ]);

        res.json({
            totalStudents,
            totalGroups,
            totalTeachers,
            totalCourses,
            totalHomeworks,
            pendingHomeworks,
            totalRevenue: totalPayments._sum.montant || 0,
            paidRevenue: paidPayments._sum.montant || 0,
            recentHomeworks,
            recentStudents,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;