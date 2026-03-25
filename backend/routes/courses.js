const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET tous les cours
router.get('/', protect, async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
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

// GET un cours par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
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
    const { titre, description, niveau } = req.body;
    try {
        const course = await prisma.course.create({
            data: { titre, description, niveau }
        });
        res.status(201).json(course);
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
                groupId: groupId ? parseInt(groupId) : null,
            }
        });
        res.status(201).json(task);
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

// DELETE supprimer une tâche ⚠️ doit être avant /:id
router.delete('/tasks/:taskId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.task.delete({
            where: { id: parseInt(req.params.taskId) }
        });
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un chapitre ⚠️ doit être avant /:id
router.delete('/chapters/:chapterId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.task.deleteMany({
            where: { chapterId: parseInt(req.params.chapterId) }
        });
        await prisma.chapter.delete({
            where: { id: parseInt(req.params.chapterId) }
        });
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
            include: {
                chapters: {
                    include: { tasks: true }
                }
            }
        });
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        for (const chapter of course.chapters) {
            await prisma.task.deleteMany({
                where: { chapterId: chapter.id }
            });
        }
        await prisma.chapter.deleteMany({
            where: { courseId: course.id }
        });
        await prisma.course.delete({
            where: { id: course.id }
        });
        res.json({ message: 'Cours supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});
// GET cours par groupe
router.get('/group/:groupId', protect, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { groupId: parseInt(req.params.groupId) },
                    { groupId: null }
                ]
            },
            include: {
                chapter: {
                    include: { course: true }
                }
            }
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;