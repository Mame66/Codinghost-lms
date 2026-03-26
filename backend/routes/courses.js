const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET cours par groupe de l'étudiant connecté
router.get('/my', protect, async (req, res) => {
    try {
        // Trouver le student
        const student = await prisma.student.findFirst({
            where: { userId: req.user.id },
            include: {
                enrollments: {
                    include: { group: true }
                }
            }
        });

        if (!student || student.enrollments.length === 0) {
            return res.json([]);
        }

        const groupId = student.enrollments[0].groupId;

        // Cours assignés à ce groupe
        const courses = await prisma.course.findMany({
            where: { groupId },
            include: {
                chapters: {
                    include: {
                        tasks: { orderBy: { ordre: 'asc' } }
                    },
                    orderBy: { ordre: 'asc' }
                }
            }
        });

        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET tous les cours (admin/teacher)
router.get('/', protect, async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                group: { select: { id: true, titre: true } },
                chapters: {
                    include: {
                        tasks: { orderBy: { ordre: 'asc' } }
                    },
                    orderBy: { ordre: 'asc' }
                }
            }
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET un cours par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                group: { select: { id: true, titre: true } },
                chapters: {
                    include: {
                        tasks: { orderBy: { ordre: 'asc' } }
                    },
                    orderBy: { ordre: 'asc' }
                }
            }
        });
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un cours
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupId } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                titre,
                description,
                niveau,
                groupId: groupId ? parseInt(groupId) : null,
            }
        });
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un cours
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupId } = req.body;
    try {
        const course = await prisma.course.update({
            where: { id: parseInt(req.params.id) },
            data: {
                titre,
                description,
                niveau,
                groupId: groupId ? parseInt(groupId) : null,
            }
        });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST ajouter un chapitre
router.post('/:id/chapters', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, ordre, locked } = req.body;
    try {
        const chapter = await prisma.chapter.create({
            data: {
                courseId: parseInt(req.params.id),
                titre,
                ordre: ordre || 1,
                locked: locked !== undefined ? locked : false,
            }
        });
        res.status(201).json(chapter);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT toggle lock chapitre
router.put('/chapters/:chapterId/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(req.params.chapterId) }
        });
        const updated = await prisma.chapter.update({
            where: { id: parseInt(req.params.chapterId) },
            data: { locked: !chapter.locked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST ajouter une tâche
router.post('/chapters/:chapterId/tasks', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, type, contenuUrl, ordre, groupId } = req.body;
    try {
        const task = await prisma.task.create({
            data: {
                chapterId: parseInt(req.params.chapterId),
                titre,
                type: type || 'SLIDE',
                contenuUrl: contenuUrl || null,
                ordre: ordre || 1,
                locked: false,
                groupId: groupId ? parseInt(groupId) : null,
            }
        });
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT toggle lock tâche
router.put('/tasks/:taskId/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: parseInt(req.params.taskId) }
        });
        const updated = await prisma.task.update({
            where: { id: parseInt(req.params.taskId) },
            data: { locked: !task.locked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier une tâche
router.put('/tasks/:taskId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, type, contenuUrl } = req.body;
    try {
        const task = await prisma.task.update({
            where: { id: parseInt(req.params.taskId) },
            data: { titre, type, contenuUrl }
        });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer une tâche
router.delete('/tasks/:taskId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.homework.deleteMany({ where: { taskId: parseInt(req.params.taskId) } });
        await prisma.task.delete({ where: { id: parseInt(req.params.taskId) } });
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un chapitre
router.delete('/chapters/:chapterId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { chapterId: parseInt(req.params.chapterId) }
        });
        for (const task of tasks) {
            await prisma.homework.deleteMany({ where: { taskId: task.id } });
        }
        await prisma.task.deleteMany({ where: { chapterId: parseInt(req.params.chapterId) } });
        await prisma.chapter.delete({ where: { id: parseInt(req.params.chapterId) } });
        res.json({ message: 'Chapitre supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un cours
router.delete('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { chapters: { include: { tasks: true } } }
        });
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        for (const chapter of course.chapters) {
            for (const task of chapter.tasks) {
                await prisma.homework.deleteMany({ where: { taskId: task.id } });
            }
            await prisma.task.deleteMany({ where: { chapterId: chapter.id } });
        }
        await prisma.chapter.deleteMany({ where: { courseId: course.id } });
        await prisma.course.delete({ where: { id: course.id } });
        res.json({ message: 'Cours supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;