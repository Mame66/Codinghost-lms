const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { studentCourseIds } = require('../lib/access');
const { deleteChapters, deleteChaptersTx, pathsOfChapters, cleanupPaths } = require('../lib/courseFiles');

const staff = allowRoles('ADMIN', 'TEACHER', 'TEACHER_VIEW');
const AUDIENCES = ['ENFANT', 'ADULTE'];

// Include standard pour un cours complet
const courseInclude = {
    courseGroups: {
        include: { group: { select: { id: true, titre: true, audience: true, ville: true } } }
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

// Vérifie que les groupes choisis ont le même public que le cours
const checkGroupsAudience = async (groupIds, audience) => {
    if (!groupIds || groupIds.length === 0) return null;
    const groups = await prisma.group.findMany({
        where: { id: { in: groupIds.map(g => parseInt(g)) } },
        select: { titre: true, audience: true },
    });
    const wrong = groups.filter(g => g.audience !== audience);
    if (wrong.length === 0) return null;
    const label = audience === 'ADULTE' ? 'adultes' : 'enfants';
    return `Ce cours est réservé aux ${label} : impossible de l'assigner à ${wrong.map(g => `« ${g.titre} »`).join(', ')}.`;
};

// ─────────────────────────────────────────────
// COURS
// ─────────────────────────────────────────────

// GET /courses/my → cours des groupes de l'élève connecté
router.get('/my', protect, async (req, res) => {
    try {
        const ids = await studentCourseIds(req.user.id);
        if (ids.length === 0) return res.json([]);

        const courses = await prisma.course.findMany({
            where: { id: { in: ids } },
            include: {
                modules: {
                    orderBy: { ordre: 'asc' },
                    include: {
                        chapters: {
                            orderBy: { ordre: 'asc' },
                            select: { id: true, titre: true, ordre: true, locked: true, moduleId: true },
                        }
                    }
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(courses);
    } catch (err) {
        console.error('GET /courses/my error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /courses?audience=ENFANT|ADULTE (personnel)
router.get('/', protect, staff, async (req, res) => {
    try {
        const { audience } = req.query;
        const courses = await prisma.course.findMany({
            where: AUDIENCES.includes(audience) ? { audience } : {},
            include: courseInclude,
            orderBy: { createdAt: 'desc' },
        });
        res.json(courses);
    } catch (err) {
        console.error('GET /courses error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST /courses
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupIds, lockedByAdmin, coverImage } = req.body;
    const audience = AUDIENCES.includes(req.body.audience) ? req.body.audience : 'ENFANT';
    if (!titre || !String(titre).trim()) return res.status(400).json({ message: 'Titre obligatoire' });
    try {
        const err = await checkGroupsAudience(groupIds, audience);
        if (err) return res.status(400).json({ message: err });

        const course = await prisma.course.create({
            data: {
                titre:         String(titre).trim(),
                description:   description   || null,
                niveau:        niveau        || null,
                coverImage:    coverImage    || null,
                audience,
                lockedByAdmin: req.user.role === 'ADMIN' ? !!lockedByAdmin : false,
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

// ─────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────

// POST créer un modul
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
        const id = parseInt(req.params.id);
        const chapters = await prisma.chapter.findMany({ where: { moduleId: id }, select: { id: true } });
        await deleteChapters(chapters.map(c => c.id), (tx) => tx.module.delete({ where: { id } }));
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
        await deleteChapters([parseInt(req.params.id)]);
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
router.get('/tasks/:id/questions', protect, staff, async (req, res) => {
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

// ─────────────────────────────────────────────
// DUPLIQUER UN COURS
// Copie modules, leçons, quiz, fichiers et liens (les fichiers ne sont
// pas recopiés dans le stockage : la copie les partage). Pas les groupes
// ni la progression des élèves.
// body optionnel : { titre, audience }
// ─────────────────────────────────────────────
router.post('/:id/duplicate', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const src = await prisma.course.findUnique({
            where: { id },
            include: {
                modules: { orderBy: { ordre: 'asc' } },
                chapters: {
                    orderBy: { ordre: 'asc' },
                    include: {
                        quizQuestions: { where: { chapterId: { not: null } }, orderBy: { ordre: 'asc' } },
                        resources: { orderBy: [{ ordre: 'asc' }, { id: 'asc' }] },
                    },
                },
            },
        });
        if (!src) return res.status(404).json({ message: 'Cours non trouvé' });
        const titre = String(req.body.titre || '').trim() || `${src.titre} (copie)`;
        const audience = AUDIENCES.includes(req.body.audience) ? req.body.audience : src.audience;

        const course = await prisma.$transaction(async (tx) => {
            const c = await tx.course.create({
                data: {
                    titre, audience,
                    description: src.description, niveau: src.niveau, coverImage: src.coverImage,
                    lockedByAdmin: false, createdBy: req.user.id,
                },
            });
            const moduleMap = new Map();
            for (const m of src.modules) {
                const nm = await tx.module.create({
                    data: { courseId: c.id, titre: m.titre, description: m.description, ordre: m.ordre, locked: m.locked },
                });
                moduleMap.set(m.id, nm.id);
            }
            for (const ch of src.chapters) {
                const nc = await tx.chapter.create({
                    data: {
                        courseId: c.id,
                        moduleId: ch.moduleId ? (moduleMap.get(ch.moduleId) ?? null) : null,
                        titre: ch.titre, ordre: ch.ordre, locked: ch.locked,
                        objectives: ch.objectives, teacherGuideUrl: ch.teacherGuideUrl,
                        studentSlidesUrl: ch.studentSlidesUrl, imageUrl: ch.imageUrl,
                        challengeContent: ch.challengeContent, challengeLang: ch.challengeLang,
                        homeworkEnabled: ch.homeworkEnabled, homeworkInstructions: ch.homeworkInstructions,
                        homeworkDueDate: null, // la date limite dépend de la nouvelle session
                    },
                });
                if (ch.quizQuestions.length) {
                    await tx.qcmQuestion.createMany({
                        data: ch.quizQuestions.map(q => ({
                            chapterId: nc.id, taskId: null, question: q.question, options: q.options, correct: q.correct, ordre: q.ordre,
                        })),
                    });
                }
                if (ch.resources.length) {
                    await tx.lessonResource.createMany({
                        data: ch.resources.map(r => ({
                            chapterId: nc.id, kind: r.kind, titre: r.titre, url: r.url, storagePath: r.storagePath,
                            fileName: r.fileName, mimeType: r.mimeType, size: r.size, visibility: r.visibility, ordre: r.ordre,
                        })),
                    });
                }
            }
            return c;
        }, { timeout: 60000 });
        res.status(201).json(course);
    } catch (err) {
        console.error('POST /courses/:id/duplicate error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ─────────────────────────────────────────────
// COURS PAR ID — déclarées APRÈS les routes /modules, /chapters, /tasks
// sinon Express prend "modules" pour un :id
// ─────────────────────────────────────────────

// GET /courses/:id
router.get('/:id', protect, staff, async (req, res) => {
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

// PUT /courses/:id
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupIds, lockedByAdmin, coverImage, audience } = req.body;
    const id = parseInt(req.params.id);
    try {
        const existing = await prisma.course.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Cours non trouvé' });
        if (req.user.role === 'TEACHER' && existing.lockedByAdmin)
            return res.status(403).json({ message: 'Cours verrouillé par l\'administrateur' });
        if (req.user.role === 'TEACHER' && lockedByAdmin !== undefined && lockedByAdmin !== existing.lockedByAdmin)
            return res.status(403).json({ message: 'Seul un administrateur peut verrouiller un cours' });

        const newAudience = AUDIENCES.includes(audience) ? audience : existing.audience;
        const targetGroups = groupIds !== undefined
            ? groupIds
            : (await prisma.courseGroup.findMany({ where: { courseId: id }, select: { groupId: true } })).map(c => c.groupId);
        const err = await checkGroupsAudience(targetGroups, newAudience);
        if (err) return res.status(400).json({ message: err });

        const course = await prisma.course.update({
            where: { id },
            data: {
                titre:         titre         !== undefined ? titre         : existing.titre,
                description:   description   !== undefined ? (description || null) : existing.description,
                niveau:        niveau        !== undefined ? (niveau || null)      : existing.niveau,
                coverImage:    coverImage    !== undefined ? (coverImage || null)  : existing.coverImage,
                lockedByAdmin: lockedByAdmin !== undefined ? !!lockedByAdmin       : existing.lockedByAdmin,
                audience:      newAudience,
            }
        });

        if (groupIds !== undefined) {
            await prisma.$transaction([
                prisma.courseGroup.deleteMany({ where: { courseId: id } }),
                prisma.courseGroup.createMany({
                    data: groupIds.map(gId => ({ courseId: id, groupId: parseInt(gId) })),
                    skipDuplicates: true,
                }),
            ]);
        }
        res.json(course);
    } catch (err) {
        console.error('PUT /courses/:id error:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE /courses/:id
router.delete('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
        if (req.user.role === 'TEACHER' && course.lockedByAdmin)
            return res.status(403).json({ message: 'Cours verrouillé par l\'administrateur' });

        const chapterIds = (await prisma.chapter.findMany({ where: { courseId: id }, select: { id: true } })).map(c => c.id);
        const paths = await pathsOfChapters(chapterIds);
        await prisma.$transaction(async (tx) => {
            // anciennes tâches, quiz, progression, fichiers et devoirs rendus des leçons
            await deleteChaptersTx(tx, chapterIds);
            await tx.module.deleteMany({ where: { courseId: id } });
            await tx.course.delete({ where: { id } });                                  // liaisons groupes en cascade
        }, { timeout: 30000 });
        // fichiers qui ne servent plus à aucun autre cours (les copies partagent les fichiers)
        await cleanupPaths(paths);

        res.json({ message: 'Cours supprimé avec succès' });
    } catch (err) {
        console.error('DELETE /courses/:id error:', err.message);
        res.status(500).json({ message: 'Erreur suppression', error: err.message });
    }
});

module.exports = router;
