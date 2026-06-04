const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Include standard pour un cours complet
const courseInclude = {
    courseGroups: {
        include: { group: { select: { id: true, titre: true } } }
    },
    modules: {
        orderBy: { ordre: 'asc' },
        include: {
            chapters: {
                orderBy: { ordre: 'asc' },
                include: { tasks: { orderBy: { ordre: 'asc' } } }
            }
        }
    },
    chapters: {
        where: { moduleId: null },
        orderBy: { ordre: 'asc' },
        include: { tasks: { orderBy: { ordre: 'asc' } } }
    }
};

// ─────────────────────────────────────────────
// COURS
// ─────────────────────────────────────────────

// GET cours de l'étudiant connecté — TOUS les cours de son groupe
router.get('/my', protect, async (req, res) => {
    try {
        // 1. Trouver l'étudiant connecté
        const student = await prisma.student.findFirst({
            where: { userId: req.user.id },
            include: { enrollments: { select: { groupId: true } } }
        });

        if (!student || student.enrollments.length === 0) return res.json([]);

        const groupIds = student.enrollments.map(e => e.groupId);

        // 2. Trouver TOUS les courseIds liés à ces groupes
        const courseGroups = await prisma.courseGroup.findMany({
            where: { groupId: { in: groupIds } },
            select: { courseId: true }
        });

        if (courseGroups.length === 0) return res.json([]);

        // 3. Dédupliquer les courseIds
        const uniqueCourseIds = [...new Set(courseGroups.map(cg => cg.courseId))];

        // 4. Charger chaque cours avec tous ses détails
        const courses = await prisma.course.findMany({
            where: { id: { in: uniqueCourseIds } },
            include: {
                courseGroups: {
                    include: { group: { select: { id: true, titre: true } } }
                },
                modules: {
                    orderBy: { ordre: 'asc' },
                    include: {
                        chapters: {
                            orderBy: { ordre: 'asc' },
                            include: { tasks: { orderBy: { ordre: 'asc' } } }
                        }
                    }
                },
                chapters: {
                    where: { moduleId: null },
                    orderBy: { ordre: 'asc' },
                    include: { tasks: { orderBy: { ordre: 'asc' } } }
                }
            }
        });

        res.json(courses);
    } catch (err) {
        console.error('GET /courses/my error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});
// GET tous les cours (admin/teacher)
router.get('/', protect, async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: courseInclude
        });
        res.json(courses);
    } catch (err) {
        console.error('GET /courses error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET un cours par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: courseInclude
        });
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
        res.json(course);
    } catch (err) {
        console.error('GET /courses/:id error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un cours
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupIds, lockedByAdmin } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                titre,
                description:   description   || null,
                niveau:        niveau        || null,
                lockedByAdmin: lockedByAdmin || false,
                createdBy:     req.user.id,
                courseGroups: {
                    create: (groupIds || []).map(gId => ({ groupId: parseInt(gId) }))
                }
            }
        });
        res.status(201).json(course);
    } catch (err) {
        console.error('POST /courses error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un cours
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupIds, lockedByAdmin } = req.body;
    try {
        const existing = await prisma.course.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!existing) return res.status(404).json({ message: 'Cours non trouvé' });
        if (req.user.role === 'TEACHER' && existing.lockedByAdmin)
            return res.status(403).json({ message: 'Cours verrouillé par l\'administrateur' });

        const course = await prisma.course.update({
            where: { id: parseInt(req.params.id) },
            data: {
                titre:         titre         !== undefined ? titre         : existing.titre,
                description:   description   !== undefined ? description   : existing.description,
                niveau:        niveau        !== undefined ? niveau        : existing.niveau,
                lockedByAdmin: lockedByAdmin !== undefined ? lockedByAdmin : existing.lockedByAdmin,
            }
        });

        if (groupIds !== undefined) {
            await prisma.courseGroup.deleteMany({ where: { courseId: parseInt(req.params.id) } });
            if (groupIds.length > 0) {
                await prisma.courseGroup.createMany({
                    data: groupIds.map(gId => ({
                        courseId: parseInt(req.params.id),
                        groupId:  parseInt(gId)
                    }))
                });
            }
        }
        res.json(course);
    } catch (err) {
        console.error('PUT /courses/:id error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un cours
router.delete('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.courseGroup.deleteMany({ where: { courseId: parseInt(req.params.id) } });
        await prisma.course.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Cours supprimé' });
    } catch (err) {
        console.error('DELETE /courses/:id error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ─────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────

// POST créer un module
router.post('/:id/modules', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description } = req.body;
    try {
        const count = await prisma.module.count({ where: { courseId: parseInt(req.params.id) } });
        const module = await prisma.module.create({
            data: {
                titre,
                description: description || null,
                ordre:       count,
                courseId:    parseInt(req.params.id),
            }
        });
        res.status(201).json(module);
    } catch (err) {
        console.error('POST /courses/:id/modules error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un module
router.put('/modules/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, locked } = req.body;
    try {
        const data = {};
        if (titre       !== undefined) data.titre       = titre;
        if (description !== undefined) data.description = description;
        if (locked      !== undefined) data.locked      = locked;
        const module = await prisma.module.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json(module);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT réordonner modules
router.put('/:id/modules/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orderedIds } = req.body;
    try {
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.module.update({ where: { id: parseInt(id) }, data: { ordre: index } })
            )
        );
        res.json({ message: 'Modules réordonnés' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un module
router.delete('/modules/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.module.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Module supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ─────────────────────────────────────────────
// CHAPITRES (LEÇONS)
// ─────────────────────────────────────────────

// POST créer un chapitre (dans cours ou dans module)
router.post('/:id/chapters', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, moduleId } = req.body;
    try {
        const where = moduleId
            ? { moduleId: parseInt(moduleId) }
            : { courseId: parseInt(req.params.id), moduleId: null };
        const count = await prisma.chapter.count({ where });
        const chapter = await prisma.chapter.create({
            data: {
                titre,
                ordre:    count,
                courseId: parseInt(req.params.id),
                moduleId: moduleId ? parseInt(moduleId) : null,
            }
        });
        res.status(201).json(chapter);
    } catch (err) {
        console.error('POST /courses/:id/chapters error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un chapitre directement dans un module
router.post('/modules/:moduleId/chapters', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre } = req.body;
    try {
        const mod = await prisma.module.findUnique({ where: { id: parseInt(req.params.moduleId) } });
        if (!mod) return res.status(404).json({ message: 'Module non trouvé' });
        const count = await prisma.chapter.count({ where: { moduleId: parseInt(req.params.moduleId) } });
        const chapter = await prisma.chapter.create({
            data: {
                titre,
                ordre:    count,
                courseId: mod.courseId,
                moduleId: parseInt(req.params.moduleId),
            }
        });
        res.status(201).json(chapter);
    } catch (err) {
        console.error('POST /courses/modules/:moduleId/chapters error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT toggle verrouillage chapitre
router.put('/chapters/:id/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { course: true }
        });
        if (!chapter) return res.status(404).json({ message: 'Chapitre non trouvé' });
        if (req.user.role === 'TEACHER' && chapter.course.lockedByAdmin)
            return res.status(403).json({ message: 'Cours verrouillé par l\'administrateur' });
        const updated = await prisma.chapter.update({
            where: { id: parseInt(req.params.id) },
            data:  { locked: !chapter.locked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT réordonner chapitres — FIX: parseInt sur chaque id
router.put('/:id/chapters/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orderedIds } = req.body;
    try {
        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds manquant ou invalide' });
        }
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.chapter.update({
                    where: { id: parseInt(id) },
                    data:  { ordre: index }
                })
            )
        );
        res.json({ message: 'Chapitres réordonnés' });
    } catch (err) {
        console.error('PUT chapters/reorder error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un chapitre
router.delete('/chapters/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.chapter.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Chapitre supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ─────────────────────────────────────────────
// TÂCHES
// ─────────────────────────────────────────────

// POST créer une tâche
router.post('/chapters/:id/tasks', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, type, contenuUrl, description, scriptContent, scriptLanguage } = req.body;
    try {
        const count = await prisma.task.count({ where: { chapterId: parseInt(req.params.id) } });
        const data = {
            titre,
            type,
            ordre:     count,
            chapterId: parseInt(req.params.id),
        };
        if (contenuUrl  !== undefined) data.contenuUrl  = contenuUrl  || null;
        if (description !== undefined) data.description = description || null;
        // scriptContent et scriptLanguage — seulement si les colonnes existent
        try {
            if (scriptContent  !== undefined) data.scriptContent  = scriptContent  || null;
            if (scriptLanguage !== undefined) data.scriptLanguage = scriptLanguage || null;
        } catch (e) { /* colonnes pas encore migrées */ }

        const task = await prisma.task.create({ data });
        res.status(201).json(task);
    } catch (err) {
        console.error('POST /chapters/:id/tasks error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier une tâche
router.put('/tasks/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, type, contenuUrl, description, scriptContent, scriptLanguage, locked, lockedByAdmin } = req.body;
    try {
        const task = await prisma.task.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { chapter: { include: { course: true } } }
        });
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
        if (req.user.role === 'TEACHER' && task.chapter.course.lockedByAdmin)
            return res.status(403).json({ message: 'Cours verrouillé par l\'administrateur' });

        const data = {};
        if (titre          !== undefined) data.titre          = titre;
        if (type           !== undefined) data.type           = type;
        if (contenuUrl     !== undefined) data.contenuUrl     = contenuUrl     || null;
        if (description    !== undefined) data.description    = description    || null;
        if (locked         !== undefined) data.locked         = locked;
        if (lockedByAdmin  !== undefined) data.lockedByAdmin  = lockedByAdmin;
        if (scriptContent  !== undefined) data.scriptContent  = scriptContent  || null;
        if (scriptLanguage !== undefined) data.scriptLanguage = scriptLanguage || null;

        const updated = await prisma.task.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json(updated);
    } catch (err) {
        console.error('PUT /tasks/:id error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT toggle verrouillage tâche
router.put('/tasks/:id/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { chapter: { include: { course: true } } }
        });
        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
        if (req.user.role === 'TEACHER' && (task.lockedByAdmin || task.chapter.course.lockedByAdmin))
            return res.status(403).json({ message: 'Tâche verrouillée par l\'administrateur' });
        const updated = await prisma.task.update({
            where: { id: parseInt(req.params.id) },
            data:  { locked: !task.locked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT réordonner tâches — FIX: parseInt sur chaque id
router.put('/chapters/:id/tasks/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orderedIds } = req.body;
    try {
        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds manquant ou invalide' });
        }
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.task.update({
                    where: { id: parseInt(id) },
                    data:  { ordre: index }
                })
            )
        );
        res.json({ message: 'Tâches réordonnées' });
    } catch (err) {
        console.error('PUT chapters/:id/tasks/reorder error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer une tâche
router.delete('/tasks/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ─────────────────────────────────────────────
// QUESTIONS QCM
// ─────────────────────────────────────────────

// POST ajouter questions QCM
router.post('/tasks/:id/questions', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { questions } = req.body;
    try {
        await prisma.qcmQuestion.deleteMany({ where: { taskId: parseInt(req.params.id) } });
        await prisma.qcmQuestion.createMany({
            data: questions.map(q => ({
                taskId:   parseInt(req.params.id),
                question: q.question,
                options:  q.options,
                correct:  q.correct,
            }))
        });
        const created = await prisma.qcmQuestion.findMany({ where: { taskId: parseInt(req.params.id) } });
        res.status(201).json(created);
    } catch (err) {
        console.error('POST /tasks/:id/questions error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET questions QCM d'une tâche
router.get('/tasks/:id/questions', protect, async (req, res) => {
    try {
        const questions = await prisma.qcmQuestion.findMany({
            where:   { taskId: parseInt(req.params.id) },
            orderBy: { id: 'asc' }
        });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;