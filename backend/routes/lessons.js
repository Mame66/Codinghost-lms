const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Include complet d'un chapitre/leçon ──────────────────
const chapterInclude = {
    quizQuestions:  { orderBy: { ordre: 'asc' } },
    lessonProgress: true,
    module:         { select: { id: true, titre: true, ordre: true } },
};

// ══════════════════════════════════════════════════════════
// ROUTES — MODULES
// ══════════════════════════════════════════════════════════

// GET modules d'un cours
router.get('/courses/:courseId/modules', protect, async (req, res) => {
    try {
        const modules = await prisma.module.findMany({
            where:   { courseId: parseInt(req.params.courseId) },
            orderBy: { ordre: 'asc' },
            include: {
                chapters: {
                    orderBy: { ordre: 'asc' },
                    include: { quizQuestions: { orderBy: { ordre: 'asc' } } }
                }
            }
        });
        res.json(modules);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST créer un module
router.post('/courses/:courseId/modules', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description } = req.body;
    try {
        const count = await prisma.module.count({ where: { courseId: parseInt(req.params.courseId) } });
        const module = await prisma.module.create({
            data: {
                titre,
                description: description || null,
                ordre:       count,
                courseId:    parseInt(req.params.courseId),
            },
            include: { chapters: true }
        });
        res.status(201).json(module);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// PUT modifier un module
router.put('/modules/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { titre, description, locked } = req.body;
    try {
        const module = await prisma.module.update({
            where: { id: parseInt(req.params.id) },
            data:  { titre, description: description || null, ...(locked !== undefined ? { locked } : {}) },
            include: { chapters: { orderBy: { ordre: 'asc' } } }
        });
        res.json(module);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// DELETE supprimer un module
router.delete('/modules/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.module.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Module supprimé' });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// PUT réordonner les modules
router.put('/courses/:courseId/modules/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orderedIds } = req.body;
    try {
        await Promise.all(orderedIds.map((id, index) =>
            prisma.module.update({ where: { id: parseInt(id) }, data: { ordre: index } })
        ));
        res.json({ message: 'Ordre mis à jour' });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — LEÇONS (Chapters)
// ══════════════════════════════════════════════════════════

// GET leçons d'un module
router.get('/modules/:moduleId/lessons', protect, async (req, res) => {
    try {
        const lessons = await prisma.chapter.findMany({
            where:   { moduleId: parseInt(req.params.moduleId) },
            orderBy: { ordre: 'asc' },
            include: chapterInclude,
        });
        res.json(lessons);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// GET une leçon par ID
router.get('/lessons/:id', protect, async (req, res) => {
    try {
        const lesson = await prisma.chapter.findUnique({
            where:   { id: parseInt(req.params.id) },
            include: chapterInclude,
        });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });

        // Si étudiant : cacher teacherGuideUrl
        if (req.user.role === 'STUDENT') {
            lesson.teacherGuideUrl = null;
        }
        res.json(lesson);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST créer une leçon dans un module
router.post('/modules/:moduleId/lessons', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const {
        titre, objectives, teacherGuideUrl, studentSlidesUrl,
        imageUrl, challengeContent, challengeLang, courseId
    } = req.body;
    try {
        const count = await prisma.chapter.count({ where: { moduleId: parseInt(req.params.moduleId) } });
        const lesson = await prisma.chapter.create({
            data: {
                titre,
                ordre:           count,
                moduleId:        parseInt(req.params.moduleId),
                courseId:        parseInt(courseId),
                objectives:      objectives      || null,
                teacherGuideUrl: teacherGuideUrl || null,
                studentSlidesUrl:studentSlidesUrl|| null,
                imageUrl:        imageUrl        || null,
                challengeContent:challengeContent|| null,
                challengeLang:   challengeLang   || 'python',
            },
            include: chapterInclude,
        });
        res.status(201).json(lesson);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// PUT modifier une leçon
router.put('/lessons/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const {
        titre, objectives, teacherGuideUrl, studentSlidesUrl,
        imageUrl, challengeContent, challengeLang, locked
    } = req.body;
    try {
        const data = {};
        if (titre             !== undefined) data.titre             = titre;
        if (objectives        !== undefined) data.objectives        = objectives        || null;
        if (teacherGuideUrl   !== undefined) data.teacherGuideUrl   = teacherGuideUrl   || null;
        if (studentSlidesUrl  !== undefined) data.studentSlidesUrl  = studentSlidesUrl  || null;
        if (imageUrl          !== undefined) data.imageUrl          = imageUrl          || null;
        if (challengeContent  !== undefined) data.challengeContent  = challengeContent  || null;
        if (challengeLang     !== undefined) data.challengeLang     = challengeLang;
        if (locked            !== undefined) data.locked            = locked;

        const lesson = await prisma.chapter.update({
            where:   { id: parseInt(req.params.id) },
            data,
            include: chapterInclude,
        });
        res.json(lesson);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// DELETE supprimer une leçon
router.delete('/lessons/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.chapter.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Leçon supprimée' });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// PUT réordonner les leçons d'un module
router.put('/modules/:moduleId/lessons/reorder', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { orderedIds } = req.body;
    try {
        await Promise.all(orderedIds.map((id, index) =>
            prisma.chapter.update({ where: { id: parseInt(id) }, data: { ordre: index } })
        ));
        res.json({ message: 'Ordre mis à jour' });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — QUIZ (QcmQuestion sur les leçons)
// ══════════════════════════════════════════════════════════

// GET questions du quiz d'une leçon
router.get('/lessons/:id/quiz', protect, async (req, res) => {
    try {
        const questions = await prisma.qcmQuestion.findMany({
            where:   { chapterId: parseInt(req.params.id) },
            orderBy: { ordre: 'asc' },
        });
        // Étudiant ne voit pas la bonne réponse
        if (req.user.role === 'STUDENT') {
            return res.json(questions.map(q => ({ ...q, correct: undefined })));
        }
        res.json(questions);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST ajouter une question au quiz d'une leçon
router.post('/lessons/:id/quiz', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { question, options, correct } = req.body;
    try {
        const count = await prisma.qcmQuestion.count({ where: { chapterId: parseInt(req.params.id) } });
        const q = await prisma.qcmQuestion.create({
            data: {
                question,
                options,
                correct:   parseInt(correct),
                ordre:     count + 1,
                chapterId: parseInt(req.params.id),
                taskId:    1, // valeur par défaut pour compatibilité
            }
        });
        res.status(201).json(q);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// PUT modifier une question
router.put('/quiz/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { question, options, correct } = req.body;
    try {
        const q = await prisma.qcmQuestion.update({
            where: { id: parseInt(req.params.id) },
            data:  { question, options, correct: parseInt(correct) }
        });
        res.json(q);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// DELETE supprimer une question
router.delete('/quiz/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    try {
        await prisma.qcmQuestion.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Question supprimée' });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — PROGRESSION ÉTUDIANT
// ══════════════════════════════════════════════════════════

// GET progression d'un étudiant pour un cours
router.get('/progress/course/:courseId/student/:studentId', protect, async (req, res) => {
    try {
        const modules = await prisma.module.findMany({
            where:   { courseId: parseInt(req.params.courseId) },
            orderBy: { ordre: 'asc' },
            include: {
                chapters: {
                    orderBy: { ordre: 'asc' },
                    include: {
                        lessonProgress: {
                            where: { studentId: parseInt(req.params.studentId) }
                        },
                        quizQuestions: { select: { id: true } }
                    }
                }
            }
        });

        const result = modules.map(m => {
            const lessons = m.chapters.map(c => {
                const prog = c.lessonProgress[0] || null;
                const hasQuiz = c.quizQuestions.length > 0;
                const elements = [
                    c.objectives      ? 'objectives'   : null,
                    c.studentSlidesUrl? 'slides'        : null,
                    c.imageUrl        ? 'images'        : null,
                    c.challengeContent? 'challenge'     : null,
                    hasQuiz           ? 'quiz'          : null,
                ].filter(Boolean);

                const done = elements.filter(el => {
                    if (!prog) return false;
                    if (el === 'objectives') return prog.objectivesDone;
                    if (el === 'slides')     return prog.slidesDone;
                    if (el === 'images')     return prog.imagesDone;
                    if (el === 'challenge')  return prog.challengeDone;
                    if (el === 'quiz')       return prog.quizSoumis;
                    return false;
                });

                const pct = elements.length > 0 ? Math.round((done.length / elements.length) * 100) : 0;
                return { lessonId: c.id, titre: c.titre, ordre: c.ordre, pct, done: done.length, total: elements.length, progress: prog };
            });

            const totalPct = lessons.length > 0
                ? Math.round(lessons.reduce((a, l) => a + l.pct, 0) / lessons.length)
                : 0;

            return { moduleId: m.id, titre: m.titre, ordre: m.ordre, pct: totalPct, lessons };
        });

        res.json(result);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST / PUT marquer un élément comme fait
router.post('/progress/lesson/:lessonId', protect, async (req, res) => {
    const { studentId, element } = req.body;
    // element = 'objectives' | 'slides' | 'images' | 'challenge'
    try {
        const fieldMap = {
            objectives: 'objectivesDone',
            slides:     'slidesDone',
            images:     'imagesDone',
            challenge:  'challengeDone',
        };
        const field = fieldMap[element];
        if (!field) return res.status(400).json({ message: 'Élément invalide' });

        const progress = await prisma.lessonProgress.upsert({
            where:  { studentId_chapterId: { studentId: parseInt(studentId), chapterId: parseInt(req.params.lessonId) } },
            update: { [field]: true },
            create: {
                studentId:  parseInt(studentId),
                chapterId:  parseInt(req.params.lessonId),
                [field]:    true,
            }
        });
        res.json(progress);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST soumettre le quiz d'une leçon
router.post('/progress/lesson/:lessonId/quiz', protect, async (req, res) => {
    const { studentId, answers } = req.body;
    try {
        const questions = await prisma.qcmQuestion.findMany({
            where:   { chapterId: parseInt(req.params.lessonId) },
            orderBy: { ordre: 'asc' },
        });

        let correct = 0;
        questions.forEach((q, i) => {
            if (parseInt(answers[i]) === q.correct) correct++;
        });
        const score = questions.length > 0 ? Math.round((correct / questions.length) * 20 * 10) / 10 : 0;

        const progress = await prisma.lessonProgress.upsert({
            where:  { studentId_chapterId: { studentId: parseInt(studentId), chapterId: parseInt(req.params.lessonId) } },
            update: {
                quizSoumis:  true,
                quizAnswers: answers,
                quizScore:   score,
                quizCorrect: correct,
                quizTotal:   questions.length,
            },
            create: {
                studentId:   parseInt(studentId),
                chapterId:   parseInt(req.params.lessonId),
                quizSoumis:  true,
                quizAnswers: answers,
                quizScore:   score,
                quizCorrect: correct,
                quizTotal:   questions.length,
            }
        });

        res.json({ progress, score, correct, total: questions.length });
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// ROUTES — IMAGE DE COUVERTURE DU COURS
// ══════════════════════════════════════════════════════════

// PUT mettre à jour l'image de couverture d'un cours
router.put('/courses/:id/cover', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const { coverImage } = req.body;
    try {
        const course = await prisma.course.update({
            where: { id: parseInt(req.params.id) },
            data:  { coverImage: coverImage || null },
        });
        res.json(course);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

module.exports = router;