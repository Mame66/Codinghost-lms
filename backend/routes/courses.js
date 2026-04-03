const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET cours de l'étudiant (filtrés par son groupe)
router.get('/my', protect, async (req, res) => {
    try {
        const student = await prisma.student.findFirst({
            where: { userId: req.user.id },
            include: {
                enrollments: { include: { group: true } }
            }
        });

        if (!student || student.enrollments.length === 0) return res.json([]);

        const groupId = student.enrollments[0].groupId;

        const courseGroups = await prisma.courseGroup.findMany({
            where: { groupId },
            include: {
                course: {
                    include: {
                        chapters: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                tasks: { orderBy: { ordre: 'asc' } }
                            }
                        }
                    }
                }
            }
        });

        const courses = courseGroups.map(cg => cg.course);
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET tous les cours (admin voit tout, enseignant voit ses cours)
router.get('/', protect, async (req, res) => {
    try {
        let courses;

        if (req.user.role === 'ADMIN') {
            courses = await prisma.course.findMany({
                include: {
                    courseGroups: {
                        include: { group: { select: { id: true, titre: true } } }
                    },
                    chapters: {
                        orderBy: { ordre: 'asc' },
                        include: { tasks: { orderBy: { ordre: 'asc' } } }
                    }
                }
            });
        } else {
            const teacherGroups = await prisma.group.findMany({
                where: { teacherId: req.user.id },
                include: {
                    courseGroups: {
                        include: {
                            course: {
                                include: {
                                    courseGroups: {
                                        include: { group: { select: { id: true, titre: true } } }
                                    },
                                    chapters: {
                                        orderBy: { ordre: 'asc' },
                                        include: { tasks: { orderBy: { ordre: 'asc' } } }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const courseMap = new Map();
            teacherGroups.forEach(group => {
                group.courseGroups.forEach(cg => {
                    if (!courseMap.has(cg.course.id)) {
                        courseMap.set(cg.course.id, cg.course);
                    }
                });
            });

            const ownCourses = await prisma.course.findMany({
                where: { createdBy: req.user.login },
                include: {
                    courseGroups: {
                        include: { group: { select: { id: true, titre: true } } }
                    },
                    chapters: {
                        orderBy: { ordre: 'asc' },
                        include: { tasks: { orderBy: { ordre: 'asc' } } }
                    }
                }
            });

            ownCourses.forEach(c => {
                if (!courseMap.has(c.id)) courseMap.set(c.id, c);
            });

            courses = Array.from(courseMap.values());
        }

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
                courseGroups: {
                    include: { group: { select: { id: true, titre: true } } }
                },
                chapters: {
                    orderBy: { ordre: 'asc' },
                    include: { tasks: { orderBy: { ordre: 'asc' } } }
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
    const { titre, description, niveau, groupIds } = req.body;
    try {
        const course = await prisma.course.create({
            data: {
                titre,
                description,
                niveau,
                createdBy: req.user.login,
                lockedByAdmin: false,
            }
        });

        if (groupIds && groupIds.length > 0) {
            await prisma.courseGroup.createMany({
                data: groupIds.map(gId => ({
                    courseId: course.id,
                    groupId: parseInt(gId),
                })),
                skipDuplicates: true,
            });

            for (const gId of groupIds) {
                try {
                    const group = await prisma.group.findUnique({
                        where: { id: parseInt(gId) },
                        include: {
                            enrollments: {
                                include: { student: { include: { user: true } } }
                            }
                        }
                    });
                    if (group) {
                        for (const enrollment of group.enrollments) {
                            await prisma.notification.create({
                                data: {
                                    userId: enrollment.student.userId,
                                    titre: '📚 Nouveau cours disponible',
                                    message: `${titre} est maintenant disponible`,
                                    type: 'INFO',
                                }
                            });
                        }
                    }
                } catch (e) { console.error(e); }
            }
        }

        const fullCourse = await prisma.course.findUnique({
            where: { id: course.id },
            include: {
                courseGroups: { include: { group: true } },
                chapters: true
            }
        });

        res.status(201).json(fullCourse);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un cours
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, niveau, groupIds, lockedByAdmin } = req.body;
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (req.user.role === 'TEACHER' && course.createdBy !== req.user.login) {
            return res.status(403).json({ message: 'Vous ne pouvez pas modifier ce cours' });
        }

        const updateData = { titre, description, niveau };
        if (req.user.role === 'ADMIN' && lockedByAdmin !== undefined) {
            updateData.lockedByAdmin = lockedByAdmin;
        }

        await prisma.course.update({
            where: { id: parseInt(req.params.id) },
            data: updateData
        });

        if (groupIds !== undefined) {
            await prisma.courseGroup.deleteMany({
                where: { courseId: parseInt(req.params.id) }
            });
            if (groupIds.length > 0) {
                await prisma.courseGroup.createMany({
                    data: groupIds.map(gId => ({
                        courseId: parseInt(req.params.id),
                        groupId: parseInt(gId),
                    })),
                    skipDuplicates: true,
                });
            }
        }

        const updated = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                courseGroups: { include: { group: true } },
                chapters: { orderBy: { ordre: 'asc' }, include: { tasks: { orderBy: { ordre: 'asc' } } } }
            }
        });

        res.json(updated);
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

// ✅ PUT toggle lock chapitre — vérifie si cours verrouillé par admin
router.put('/chapters/:chapterId/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: parseInt(req.params.chapterId) },
            include: { course: true }
        });

        if (!chapter) return res.status(404).json({ message: 'Chapitre non trouvé' });

        // ✅ Enseignant bloqué si le cours est verrouillé par l'admin
        if (req.user.role === 'TEACHER' && chapter.course.lockedByAdmin) {
            return res.status(403).json({
                message: '🔒 Ce cours est verrouillé par l\'administrateur — vous ne pouvez pas modifier les chapitres'
            });
        }

        const updated = await prisma.chapter.update({
            where: { id: parseInt(req.params.chapterId) },
            data: { locked: !chapter.locked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT réordonner chapitres
router.put('/:id/chapters/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orders } = req.body;
    try {
        for (const item of orders) {
            await prisma.chapter.update({
                where: { id: item.id },
                data: { ordre: item.ordre }
            });
        }
        res.json({ message: 'Ordre mis à jour' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT réordonner tâches
router.put('/chapters/:chapterId/tasks/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orders } = req.body;
    try {
        for (const item of orders) {
            await prisma.task.update({
                where: { id: item.id },
                data: { ordre: item.ordre }
            });
        }
        res.json({ message: 'Ordre mis à jour' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST ajouter une tâche
router.post('/chapters/:chapterId/tasks', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, type, contenuUrl, description, ordre } = req.body;
    try {
        const task = await prisma.task.create({
            data: {
                chapterId: parseInt(req.params.chapterId),
                titre,
                type: type || 'SLIDE',
                contenuUrl: contenuUrl || null,
                description: description || null,
                ordre: ordre || 1,
                locked: false,
            }
        });

        if (type === 'DEVOIR' || type === 'QCM') {
            try {
                const chapter = await prisma.chapter.findUnique({
                    where: { id: parseInt(req.params.chapterId) },
                    include: {
                        course: {
                            include: {
                                courseGroups: {
                                    include: {
                                        group: {
                                            include: {
                                                enrollments: {
                                                    include: { student: { include: { user: true } } }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                if (chapter?.course?.courseGroups) {
                    const typeLabel = type === 'QCM' ? '✅ Nouveau QCM' : '📁 Nouveau devoir';
                    for (const cg of chapter.course.courseGroups) {
                        for (const enrollment of cg.group.enrollments) {
                            await prisma.notification.create({
                                data: {
                                    userId: enrollment.student.userId,
                                    titre: typeLabel,
                                    message: `${titre} — ${chapter.course.titre}`,
                                    type: 'DEVOIR',
                                }
                            });
                        }
                    }
                }
            } catch (e) { console.error(e); }
        }

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ✅ PUT toggle lock tâche — vérifie si cours verrouillé par admin
router.put('/tasks/:taskId/toggle', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: parseInt(req.params.taskId) },
            include: {
                chapter: { include: { course: true } }
            }
        });

        if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });

        // ✅ Enseignant bloqué si le cours est verrouillé par l'admin
        if (req.user.role === 'TEACHER' && task.chapter.course.lockedByAdmin) {
            return res.status(403).json({
                message: '🔒 Ce cours est verrouillé par l\'administrateur — vous ne pouvez pas modifier les tâches'
            });
        }

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
    const { titre, type, contenuUrl, description } = req.body;
    try {
        const task = await prisma.task.update({
            where: { id: parseInt(req.params.taskId) },
            data: { titre, type, contenuUrl, description }
        });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST questions QCM
router.post('/tasks/:taskId/questions', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { questions } = req.body;
    try {
        await prisma.qcmQuestion.deleteMany({
            where: { taskId: parseInt(req.params.taskId) }
        });
        await prisma.qcmQuestion.createMany({
            data: questions.map((q, i) => ({
                taskId: parseInt(req.params.taskId),
                question: q.question,
                options: q.options,
                correct: q.correct,
                ordre: i + 1,
            }))
        });
        res.json({ message: 'Questions créées' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET questions QCM
router.get('/tasks/:taskId/questions', protect, async (req, res) => {
    try {
        const questions = await prisma.qcmQuestion.findMany({
            where: { taskId: parseInt(req.params.taskId) },
            orderBy: { ordre: 'asc' }
        });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE tâche
router.delete('/tasks/:taskId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.qcmQuestion.deleteMany({ where: { taskId: parseInt(req.params.taskId) } });
        await prisma.homework.deleteMany({ where: { taskId: parseInt(req.params.taskId) } });
        await prisma.task.delete({ where: { id: parseInt(req.params.taskId) } });
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE chapitre
router.delete('/chapters/:chapterId', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { chapterId: parseInt(req.params.chapterId) }
        });
        for (const task of tasks) {
            await prisma.qcmQuestion.deleteMany({ where: { taskId: task.id } });
            await prisma.homework.deleteMany({ where: { taskId: task.id } });
        }
        await prisma.task.deleteMany({ where: { chapterId: parseInt(req.params.chapterId) } });
        await prisma.chapter.delete({ where: { id: parseInt(req.params.chapterId) } });
        res.json({ message: 'Chapitre supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE cours
router.delete('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { chapters: { include: { tasks: true } } }
        });

        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        if (req.user.role === 'TEACHER' && course.createdBy !== req.user.login) {
            return res.status(403).json({ message: 'Vous ne pouvez pas supprimer ce cours' });
        }

        for (const chapter of course.chapters) {
            for (const task of chapter.tasks) {
                await prisma.qcmQuestion.deleteMany({ where: { taskId: task.id } });
                await prisma.homework.deleteMany({ where: { taskId: task.id } });
            }
            await prisma.task.deleteMany({ where: { chapterId: chapter.id } });
        }
        await prisma.chapter.deleteMany({ where: { courseId: course.id } });
        await prisma.courseGroup.deleteMany({ where: { courseId: course.id } });
        await prisma.course.delete({ where: { id: course.id } });

        res.json({ message: 'Cours supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;