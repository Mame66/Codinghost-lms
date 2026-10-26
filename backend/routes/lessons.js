const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { isStaff, canAccessCourse, canAccessModule, canAccessChapter, resolveStudentId } = require('../lib/access');
const { deleteChapters } = require('../lib/courseFiles');

const denied = (res) => res.status(403).json({ message: 'Accès refusé à ce cours' });

// Pour un élève : retire les bonnes réponses et la progression des autres élèves
const sanitizeLessonForStudent = (lesson, studentId) => {
    if (!lesson) return lesson;
    lesson.teacherGuideUrl = null;
    if (Array.isArray(lesson.resources)) {
        lesson.resources = lesson.resources.filter(r => r.visibility === 'STUDENT');
    }
    if (Array.isArray(lesson.quizQuestions)) {
        lesson.quizQuestions = lesson.quizQuestions.map(({ correct, ...q }) => q);
    }
    if (Array.isArray(lesson.lessonProgress)) {
        lesson.lessonProgress = lesson.lessonProgress.filter(p => p.studentId === studentId);
    }
    return lesson;
};

// ── Include complet d'un chapitre/leçon ──────────────────
const chapterInclude = {
    quizQuestions:  { orderBy: { ordre: 'asc' } },
    resources:      { orderBy: [{ ordre: 'asc' }, { id: 'asc' }] },
    lessonProgress: true,
    module:         { select: { id: true, titre: true, ordre: true } },
};

// ══════════════════════════════════════════════════════════
// ROUTES — MODULES
// ══════════════════════════════════════════════════════════

// GET modules d'un cours
router.get('/courses/:courseId/modules', protect, async (req, res) => {
    try {
        if (!(await canAccessCourse(req.user, req.params.courseId))) return denied(res);
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
        if (!isStaff(req.user)) {
            modules.forEach(m => m.chapters.forEach(c => {
                c.teacherGuideUrl = null;
                c.quizQuestions = c.quizQuestions.map(({ correct, ...q }) => q);
            }));
        }
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
        const id = parseInt(req.params.id);
        const chapters = await prisma.chapter.findMany({ where: { moduleId: id }, select: { id: true } });
        // les leçons du module sont supprimées avec lui (avant : elles restaient orphelines)
        await deleteChapters(chapters.map(c => c.id), (tx) => tx.module.delete({ where: { id } }));
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

// Champs « devoir à rendre » envoyés par le formulaire
const homeworkData = (body) => {
    const data = {};
    if (body.homeworkEnabled      !== undefined) data.homeworkEnabled      = !!body.homeworkEnabled;
    if (body.homeworkInstructions !== undefined) data.homeworkInstructions = body.homeworkInstructions || null;
    if (body.homeworkDueDate      !== undefined) {
        const d = body.homeworkDueDate ? new Date(body.homeworkDueDate) : null;
        data.homeworkDueDate = d && !isNaN(d) ? d : null;
    }
    return data;
};

// GET leçons d'un module
router.get('/modules/:moduleId/lessons', protect, async (req, res) => {
    try {
        if (!(await canAccessModule(req.user, req.params.moduleId))) return denied(res);
        const lessons = await prisma.chapter.findMany({
            where:   { moduleId: parseInt(req.params.moduleId) },
            orderBy: { ordre: 'asc' },
            include: chapterInclude,
        });
        if (!isStaff(req.user)) {
            const sid = await resolveStudentId(req.user);
            lessons.forEach(l => sanitizeLessonForStudent(l, sid));
        }
        res.json(lessons);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// GET une leçon par ID
router.get('/lessons/:id', protect, async (req, res) => {
    try {
        if (!(await canAccessChapter(req.user, req.params.id))) return denied(res);
        const lesson = await prisma.chapter.findUnique({
            where:   { id: parseInt(req.params.id) },
            include: chapterInclude,
        });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });

        // Élève : pas de guide prof, pas de bonnes réponses, pas la progression des autres
        if (!isStaff(req.user)) {
            const sid = await resolveStudentId(req.user);
            sanitizeLessonForStudent(lesson, sid);
            lesson.mySubmission = sid && lesson.homeworkEnabled
                ? await prisma.lessonSubmission.findUnique({ where: { studentId_chapterId: { studentId: sid, chapterId: lesson.id } } })
                : null;
        }
        res.json(lesson);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST créer une leçon dans un module
router.post('/modules/:moduleId/lessons', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const {
        titre, objectives, teacherGuideUrl, studentSlidesUrl,
        imageUrl, challengeContent, challengeLang
    } = req.body;
    if (!titre || !String(titre).trim()) return res.status(400).json({ message: 'Titre obligatoire' });
    try {
        const mod = await prisma.module.findUnique({ where: { id: parseInt(req.params.moduleId) }, select: { courseId: true } });
        if (!mod) return res.status(404).json({ message: 'Module non trouvé' });
        const count = await prisma.chapter.count({ where: { moduleId: parseInt(req.params.moduleId) } });
        const lesson = await prisma.chapter.create({
            data: {
                titre:           String(titre).trim(),
                ordre:           count,
                moduleId:        parseInt(req.params.moduleId),
                courseId:        mod.courseId,
                objectives:      objectives      || null,
                teacherGuideUrl: teacherGuideUrl || null,
                studentSlidesUrl:studentSlidesUrl|| null,
                imageUrl:        imageUrl        || null,
                challengeContent:challengeContent|| null,
                challengeLang:   challengeLang   || 'python',
                ...homeworkData(req.body),
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
        Object.assign(data, homeworkData(req.body));

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
        await deleteChapters([parseInt(req.params.id)]);
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
        if (!(await canAccessChapter(req.user, req.params.id))) return denied(res);
        const questions = await prisma.qcmQuestion.findMany({
            where:   { chapterId: parseInt(req.params.id) },
            orderBy: { ordre: 'asc' },
        });
        // Étudiant ne voit pas la bonne réponse
        if (!isStaff(req.user)) {
            return res.json(questions.map(({ correct, ...q }) => q));
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
                taskId:    null, // ✅ quiz de leçon : plus de taskId forcé à 1
            }
        });
        res.status(201).json(q);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST importer plusieurs questions (Excel / CSV / dossier)
// body : { questions: [{ question, options: [..2-4..], correct: 0-3 }], replace: bool }
router.post('/lessons/:id/quiz/bulk', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    const chapterId = parseInt(req.params.id);
    const list = Array.isArray(req.body.questions) ? req.body.questions : [];
    const clean = [];
    for (const [i, q] of list.entries()) {
        const question = String(q?.question || '').trim();
        const options = (Array.isArray(q?.options) ? q.options : []).map(o => String(o ?? '').trim()).filter(Boolean).slice(0, 4);
        const correct = parseInt(q?.correct);
        if (!question || options.length < 2 || !(correct >= 0 && correct < options.length)) {
            return res.status(400).json({ message: `Question ${i + 1} incomplète (texte, 2 à 4 réponses et la bonne réponse)` });
        }
        clean.push({ question, options, correct });
    }
    if (!clean.length) return res.status(400).json({ message: 'Aucune question à importer' });
    try {
        const lesson = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });
        await prisma.$transaction(async (tx) => {
            if (req.body.replace) await tx.qcmQuestion.deleteMany({ where: { chapterId } });
            const start = await tx.qcmQuestion.count({ where: { chapterId } });
            await tx.qcmQuestion.createMany({
                data: clean.map((q, i) => ({ ...q, chapterId, taskId: null, ordre: start + i + 1 })),
            });
        });
        const questions = await prisma.qcmQuestion.findMany({ where: { chapterId }, orderBy: { ordre: 'asc' } });
        res.status(201).json({ imported: clean.length, questions });
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
        // Un élève ne peut lire QUE sa propre progression
        const studentId = await resolveStudentId(req.user, req.params.studentId);
        if (!studentId) return res.status(404).json({ message: 'Élève introuvable' });
        if (!(await canAccessCourse(req.user, req.params.courseId))) return denied(res);
        const modules = await prisma.module.findMany({
            where:   { courseId: parseInt(req.params.courseId) },
            orderBy: { ordre: 'asc' },
            include: {
                chapters: {
                    orderBy: { ordre: 'asc' },
                    include: {
                        lessonProgress: {
                            where: { studentId }
                        },
                        quizQuestions: { select: { id: true } },
                        resources:     { where: { visibility: 'STUDENT' }, select: { id: true } },
                        submissions:   { where: { studentId }, select: { id: true, statut: true, note: true } },
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
                    c.resources.length > 0 ? 'files'    : null,
                    c.homeworkEnabled ? 'homework'      : null,
                ].filter(Boolean);
                const submission = c.submissions[0] || null;

                const done = elements.filter(el => {
                    if (el === 'homework')   return !!submission;
                    if (!prog) return false;
                    if (el === 'objectives') return prog.objectivesDone;
                    if (el === 'slides')     return prog.slidesDone;
                    if (el === 'images')     return prog.imagesDone;
                    if (el === 'challenge')  return prog.challengeDone;
                    if (el === 'quiz')       return prog.quizSoumis;
                    if (el === 'files')      return prog.filesDone;
                    return false;
                });

                const pct = elements.length > 0 ? Math.round((done.length / elements.length) * 100) : 0;
                return { lessonId: c.id, titre: c.titre, ordre: c.ordre, pct, done: done.length, total: elements.length, progress: prog, submission };
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
    const { element } = req.body;
    // element = 'objectives' | 'slides' | 'images' | 'challenge' | 'files'
    try {
        const fieldMap = {
            objectives: 'objectivesDone',
            slides:     'slidesDone',
            images:     'imagesDone',
            challenge:  'challengeDone',
            files:      'filesDone',
        };
        const field = fieldMap[element];
        if (!field) return res.status(400).json({ message: 'Élément invalide' });
        const studentId = await resolveStudentId(req.user, req.body.studentId);
        if (!studentId) return res.status(400).json({ message: 'Élève introuvable' });
        if (!(await canAccessChapter(req.user, req.params.lessonId))) return denied(res);

        const progress = await prisma.lessonProgress.upsert({
            where:  { studentId_chapterId: { studentId, chapterId: parseInt(req.params.lessonId) } },
            update: { [field]: true },
            create: {
                studentId,
                chapterId:  parseInt(req.params.lessonId),
                [field]:    true,
            }
        });
        res.json(progress);
    } catch (err) { res.status(500).json({ message: 'Erreur', error: err.message }); }
});

// POST soumettre le quiz d'une leçon
router.post('/progress/lesson/:lessonId/quiz', protect, async (req, res) => {
    const answers = req.body.answers || {};
    try {
        const studentId = await resolveStudentId(req.user, req.body.studentId);
        if (!studentId) return res.status(400).json({ message: 'Élève introuvable' });
        if (!(await canAccessChapter(req.user, req.params.lessonId))) return denied(res);

        // Un quiz déjà soumis ne peut pas être refait
        const already = await prisma.lessonProgress.findUnique({
            where: { studentId_chapterId: { studentId, chapterId: parseInt(req.params.lessonId) } },
            select: { quizSoumis: true },
        });
        if (already?.quizSoumis) return res.status(400).json({ message: 'Quiz déjà soumis' });

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
            where:  { studentId_chapterId: { studentId, chapterId: parseInt(req.params.lessonId) } },
            update: {
                quizSoumis:  true,
                quizAnswers: answers,
                quizScore:   score,
                quizCorrect: correct,
                quizTotal:   questions.length,
            },
            create: {
                studentId,
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