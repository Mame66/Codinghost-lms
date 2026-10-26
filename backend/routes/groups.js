const express = require('express');
const router  = express.Router();
const { protect, allowRoles, adminOnly } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

const staff   = allowRoles('ADMIN', 'TEACHER', 'TEACHER_VIEW');
const canEdit = allowRoles('ADMIN', 'TEACHER');
const AUDIENCES = ['ENFANT', 'ADULTE'];

const personSelect = { id: true, nom: true, prenom: true, avatarUrl: true };

// GET /groups?audience=ENFANT|ADULTE
router.get('/', protect, staff, async (req, res) => {
    try {
        const { audience } = req.query;
        const groups = await prisma.group.findMany({
            where: AUDIENCES.includes(audience) ? { audience } : {},
            include: {
                teacher:    { select: personSelect },
                supervisor: { select: personSelect },
                _count:     { select: { enrollments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /groups/:id
router.get('/:id', protect, staff, async (req, res) => {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Identifiant invalide' });
    try {
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                teacher:    { select: personSelect },
                supervisor: { select: personSelect },
                _count:     { select: { enrollments: true } },
                enrollments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true, nom: true, prenom: true, login: true,
                                        plainPassword: true, avatarUrl: true, email: true, telephone: true,
                                    }
                                }
                            }
                        },
                        attendance: { orderBy: { date: 'asc' } }
                    }
                }
            }
        });
        if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
        if (req.user.role === 'TEACHER_VIEW') {
            group.enrollments.forEach(e => { if (e.student?.user) e.student.user.plainPassword = null; });
        }
        res.json(group);
    } catch (err) {
        console.error('GET /groups/:id error:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /groups/:id/courses → cours du groupe avec modules et leçons
router.get('/:id/courses', protect, staff, async (req, res) => {
    try {
        const courseGroups = await prisma.courseGroup.findMany({
            where: { groupId: parseInt(req.params.id) },
            include: {
                course: {
                    include: {
                        modules: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                chapters: {
                                    orderBy: { ordre: 'asc' },
                                    select: {
                                        id: true, titre: true, ordre: true, locked: true,
                                        objectives: true, studentSlidesUrl: true, imageUrl: true, challengeContent: true,
                                        homeworkEnabled: true,
                                        _count: { select: { quizQuestions: true, resources: true, submissions: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.json(courseGroups.map(cg => cg.course));
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

const buildData = (body) => {
    const ville = typeof body.ville === 'string' && body.ville.trim() ? body.ville.trim() : 'Thionville';
    return {
        titre:        String(body.titre).trim(),
        teacherId:    body.teacherId    ? parseInt(body.teacherId)    : null,
        supervisorId: body.supervisorId ? parseInt(body.supervisorId) : null,
        lieu:         body.lieu || null,
        ville,
        audience:     AUDIENCES.includes(body.audience) ? body.audience : 'ENFANT',
        statut:       body.statut || 'INSCRIPTION',
        format:       body.format || 'OFFLINE',
        type:         body.type   || 'GROUPE',
    };
};

// POST /groups
router.post('/', protect, canEdit, async (req, res) => {
    if (!req.body.titre || !String(req.body.titre).trim()) return res.status(400).json({ message: 'Titre obligatoire' });
    try {
        const group = await prisma.group.create({ data: buildData(req.body) });
        res.status(201).json(group);
    } catch (err) {
        console.error('Erreur création groupe:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT /groups/:id
router.put('/:id', protect, canEdit, async (req, res) => {
    if (!req.body.titre || !String(req.body.titre).trim()) return res.status(400).json({ message: 'Titre obligatoire' });
    try {
        const data = buildData(req.body);
        // Si le public n'est pas envoyé, on ne l'écrase pas
        if (!AUDIENCES.includes(req.body.audience)) delete data.audience;
        const group = await prisma.group.update({ where: { id: parseInt(req.params.id) }, data });
        res.json(group);
    } catch (err) {
        console.error('Erreur modification groupe:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE /groups/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const group = await prisma.group.findUnique({
            where: { id },
            select: { id: true, _count: { select: { contracts: true, payments: true } } },
        });
        if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });

        // Protection comptable : les contrats seraient supprimés en cascade
        if (group._count.contracts > 0 || group._count.payments > 0) {
            return res.status(409).json({
                message: `Ce groupe a ${group._count.contracts} contrat(s) et ${group._count.payments} paiement(s). Passez-le au statut « Terminé » plutôt que de le supprimer.`,
            });
        }

        // Inscriptions, présences et liaisons aux cours sont supprimées en cascade
        await prisma.group.delete({ where: { id } });
        res.json({ message: 'Groupe supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;
