const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');

const prisma = require('../lib/prisma');

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
            studentsEnfants,
            studentsAdultes,
        ] = await Promise.all([
            prisma.student.count(),
            prisma.group.count(),
            prisma.user.count({ where: { role: { in: ['TEACHER'] } } }),
            prisma.course.count(),
            Promise.all([prisma.homework.count(), prisma.lessonSubmission.count()]).then(([a, b]) => a + b),
            Promise.all([
                prisma.homework.count({ where: { statut: 'RENDU' } }),
                prisma.lessonSubmission.count({ where: { statut: 'RENDU' } }),
            ]).then(([a, b]) => a + b),
            prisma.payment.aggregate({ _sum: { montant: true } }),
            prisma.payment.aggregate({ _sum: { montant: true }, where: { statut: 'PAYE' } }),
            // devoirs rendus sur les leçons (même forme que les anciens devoirs pour le tableau de bord)
            prisma.lessonSubmission.findMany({
                take: 5,
                orderBy: { submittedAt: 'desc' },
                include: {
                    student: { include: { user: { select: { nom: true, prenom: true } } } },
                    chapter: { select: { titre: true } },
                }
            }).then(list => list.map(s => ({
                id: `L${s.id}`, statut: s.statut, note: s.note, createdAt: s.submittedAt,
                student: s.student, task: { titre: s.chapter.titre, type: 'DEVOIR' },
            }))),
            prisma.student.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { nom: true, prenom: true, createdAt: true, avatarUrl: true } },
                    enrollments: { include: { group: { select: { titre: true, audience: true } } } }
                }
            }),
            prisma.student.count({ where: { enrollments: { some: { group: { audience: 'ENFANT' } } } } }),
            prisma.student.count({ where: { enrollments: { some: { group: { audience: 'ADULTE' } } } } }),
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
            studentsEnfants,
            studentsAdultes,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;