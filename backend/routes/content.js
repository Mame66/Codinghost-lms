// ════════════════════════════════════════════════════════════
// Contenus de leçon : fichiers, liens et devoirs rendus
// Monté sur /api/content
// ════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { isStaff, canAccessChapter, resolveStudentId } = require('../lib/access');
const storage = require('../lib/storage');
const { cleanupPaths, storageUsage } = require('../lib/courseFiles');
const { sendHomeworkCorrectedEmail, sendSafe } = require('../services/emailService');
const { isPlaceholderEmail } = require('../lib/credentials');

const canEdit = allowRoles('ADMIN', 'TEACHER');
const staff   = allowRoles('ADMIN', 'TEACHER', 'TEACHER_VIEW');
const VISIBILITIES = ['STUDENT', 'TEACHER'];

const int = (v) => { const n = parseInt(v); return Number.isFinite(n) ? n : null; };
const fail = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('content:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
};
const isHttpUrl = (u) => /^https?:\/\/\S+$/i.test(String(u || '').trim());

// Groupes visibles par un membre du personnel (null = tous)
const staffGroupIds = async (user) => {
    if (user.role === 'ADMIN') return null;
    const groups = await prisma.group.findMany({
        where: { OR: [{ teacherId: user.id }, { supervisorId: user.id }] },
        select: { id: true },
    });
    return groups.map(g => g.id);
};

// Le personnel peut-il voir le travail de cet élève ?
const staffCanSeeStudent = async (user, studentId) => {
    const ids = await staffGroupIds(user);
    if (ids === null) return true;
    if (!ids.length) return false;
    const n = await prisma.enrollment.count({ where: { studentId, groupId: { in: ids } } });
    return n > 0;
};

const checkSize = (size) => {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) throw Object.assign(new Error('Taille de fichier invalide'), { status: 400 });
    if (n > storage.MAX_FILE_BYTES) {
        throw Object.assign(new Error(`Fichier trop lourd (${Math.round(n / 1048576)} Mo). Limite : 50 Mo. Pour les gros fichiers, ajoutez plutôt un lien Google Drive.`), { status: 413 });
    }
    return n;
};

// ══════════════════════════════════════════════════════════
// STOCKAGE
// ══════════════════════════════════════════════════════════
router.get('/storage', protect, staff, async (req, res) => {
    try { res.json(await storageUsage()); } catch (err) { fail(res, err); }
});

// ══════════════════════════════════════════════════════════
// RESSOURCES D'UNE LEÇON (personnel)
// ══════════════════════════════════════════════════════════

// 1) demander une URL d'envoi
router.post('/lessons/:id/upload-url', protect, canEdit, async (req, res) => {
    try {
        const chapterId = int(req.params.id);
        const lesson = chapterId && await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });
        checkSize(req.body.size);
        const path = storage.newObjectPath(`chapters/${chapterId}`, req.body.fileName);
        res.json(await storage.createUploadUrl(path));
    } catch (err) { fail(res, err); }
});

// 2) enregistrer le fichier envoyé (ou un lien)
router.post('/lessons/:id/resources', protect, canEdit, async (req, res) => {
    try {
        const chapterId = int(req.params.id);
        const lesson = chapterId && await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });

        const kind = req.body.kind === 'LINK' ? 'LINK' : 'FILE';
        const visibility = VISIBILITIES.includes(req.body.visibility) ? req.body.visibility : 'STUDENT';
        const ordre = await prisma.lessonResource.count({ where: { chapterId } });
        const data = { chapterId, kind, visibility, ordre };

        if (kind === 'LINK') {
            const url = String(req.body.url || '').trim();
            if (!isHttpUrl(url)) return res.status(400).json({ message: 'Lien invalide (il doit commencer par https://)' });
            data.url = url;
            data.titre = String(req.body.titre || '').trim() || url.replace(/^https?:\/\//, '').slice(0, 80);
        } else {
            const path = String(req.body.storagePath || '');
            // le chemin doit avoir été attribué à CETTE leçon
            if (!path.startsWith(`chapters/${chapterId}/`) || path.includes('..')) {
                return res.status(400).json({ message: 'Chemin de fichier invalide' });
            }
            data.storagePath = path;
            data.fileName = String(req.body.fileName || path.split('/').pop()).slice(0, 255);
            data.mimeType = req.body.mimeType ? String(req.body.mimeType).slice(0, 120) : null;
            data.size = checkSize(req.body.size);
            data.titre = String(req.body.titre || '').trim() || data.fileName.replace(/\.[^.]+$/, '');
        }
        const resource = await prisma.lessonResource.create({ data });
        res.status(201).json(resource);
    } catch (err) { fail(res, err); }
});

// modifier (titre, visibilité)
router.put('/resources/:id', protect, canEdit, async (req, res) => {
    try {
        const data = {};
        if (req.body.titre !== undefined) {
            const t = String(req.body.titre).trim();
            if (!t) return res.status(400).json({ message: 'Titre obligatoire' });
            data.titre = t;
        }
        if (VISIBILITIES.includes(req.body.visibility)) data.visibility = req.body.visibility;
        if (req.body.url !== undefined) {
            if (!isHttpUrl(req.body.url)) return res.status(400).json({ message: 'Lien invalide' });
            data.url = String(req.body.url).trim();
        }
        const resource = await prisma.lessonResource.update({ where: { id: int(req.params.id) || 0 }, data });
        res.json(resource);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ message: 'Ressource introuvable' });
        fail(res, err);
    }
});

// réordonner
router.put('/lessons/:id/resources/reorder', protect, canEdit, async (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds manquant' });
    try {
        const chapterId = int(req.params.id);
        await prisma.$transaction(orderedIds.map((id, i) =>
            prisma.lessonResource.updateMany({ where: { id: int(id) || 0, chapterId }, data: { ordre: i } })
        ));
        res.json({ message: 'Ordre mis à jour' });
    } catch (err) { fail(res, err); }
});

// supprimer
router.delete('/resources/:id', protect, canEdit, async (req, res) => {
    try {
        const r = await prisma.lessonResource.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!r) return res.status(404).json({ message: 'Ressource introuvable' });
        await prisma.lessonResource.delete({ where: { id: r.id } });
        await cleanupPaths([r.storagePath]);
        res.json({ message: 'Ressource supprimée' });
    } catch (err) { fail(res, err); }
});

// ouvrir / télécharger (personnel et élèves)
router.get('/resources/:id/url', protect, async (req, res) => {
    try {
        const r = await prisma.lessonResource.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!r) return res.status(404).json({ message: 'Ressource introuvable' });
        if (!isStaff(req.user)) {
            if (r.visibility !== 'STUDENT' || !(await canAccessChapter(req.user, r.chapterId))) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
        }
        if (r.kind === 'LINK') return res.json({ url: r.url, kind: 'LINK' });
        const download = req.query.download ? (r.fileName || 'fichier') : undefined;
        const url = await storage.createDownloadUrl(r.storagePath, { download });
        res.json({ url, kind: 'FILE', mimeType: r.mimeType, fileName: r.fileName });
    } catch (err) { fail(res, err); }
});

// ══════════════════════════════════════════════════════════
// DEVOIR RENDU — côté élève
// ══════════════════════════════════════════════════════════

const studentContext = async (req, res) => {
    const chapterId = int(req.params.id);
    if (!chapterId) { res.status(400).json({ message: 'Leçon invalide' }); return null; }
    if (!(await canAccessChapter(req.user, chapterId))) { res.status(403).json({ message: 'Accès refusé à ce cours' }); return null; }
    const studentId = await resolveStudentId(req.user);
    if (!studentId) { res.status(403).json({ message: 'Réservé aux élèves' }); return null; }
    const lesson = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, titre: true, homeworkEnabled: true, homeworkDueDate: true },
    });
    if (!lesson) { res.status(404).json({ message: 'Leçon non trouvée' }); return null; }
    return { chapterId, studentId, lesson };
};

router.get('/lessons/:id/submission', protect, async (req, res) => {
    try {
        if (isStaff(req.user)) return res.status(400).json({ message: 'Réservé aux élèves' });
        const ctx = await studentContext(req, res); if (!ctx) return;
        const sub = await prisma.lessonSubmission.findUnique({
            where: { studentId_chapterId: { studentId: ctx.studentId, chapterId: ctx.chapterId } },
        });
        res.json(sub);
    } catch (err) { fail(res, err); }
});

router.post('/lessons/:id/submission/upload-url', protect, async (req, res) => {
    try {
        if (isStaff(req.user)) return res.status(400).json({ message: 'Réservé aux élèves' });
        const ctx = await studentContext(req, res); if (!ctx) return;
        if (!ctx.lesson.homeworkEnabled) return res.status(400).json({ message: 'Pas de devoir à rendre pour cette leçon' });
        checkSize(req.body.size);
        const path = storage.newObjectPath(`submissions/${ctx.chapterId}/${ctx.studentId}`, req.body.fileName);
        res.json(await storage.createUploadUrl(path));
    } catch (err) { fail(res, err); }
});

router.put('/lessons/:id/submission', protect, async (req, res) => {
    try {
        if (isStaff(req.user)) return res.status(400).json({ message: 'Réservé aux élèves' });
        const ctx = await studentContext(req, res); if (!ctx) return;
        if (!ctx.lesson.homeworkEnabled) return res.status(400).json({ message: 'Pas de devoir à rendre pour cette leçon' });

        const key = { studentId_chapterId: { studentId: ctx.studentId, chapterId: ctx.chapterId } };
        const existing = await prisma.lessonSubmission.findUnique({ where: key });
        if (existing?.statut === 'CORRIGE') {
            return res.status(400).json({ message: 'Ce devoir a déjà été corrigé : il ne peut plus être modifié.' });
        }

        const data = {
            commentaireEleve: req.body.commentaireEleve ? String(req.body.commentaireEleve).slice(0, 2000) : null,
            statut: 'RENDU',
            submittedAt: new Date(),
        };
        const lien = String(req.body.lienRendu || '').trim();
        if (lien && !isHttpUrl(lien)) return res.status(400).json({ message: 'Lien invalide (il doit commencer par https://)' });
        data.lienRendu = lien || null;

        let oldPath = null;
        if (req.body.storagePath) {
            const path = String(req.body.storagePath);
            if (!path.startsWith(`submissions/${ctx.chapterId}/${ctx.studentId}/`) || path.includes('..')) {
                return res.status(400).json({ message: 'Chemin de fichier invalide' });
            }
            data.storagePath = path;
            data.fileName = String(req.body.fileName || path.split('/').pop()).slice(0, 255);
            data.mimeType = req.body.mimeType ? String(req.body.mimeType).slice(0, 120) : null;
            data.size = checkSize(req.body.size);
            if (existing?.storagePath && existing.storagePath !== path) oldPath = existing.storagePath;
        } else if (!existing?.storagePath && !data.lienRendu) {
            return res.status(400).json({ message: 'Ajoutez un fichier ou un lien' });
        }

        const sub = await prisma.lessonSubmission.upsert({
            where: key,
            update: data,
            create: { ...data, chapterId: ctx.chapterId, studentId: ctx.studentId },
        });
        if (oldPath) await cleanupPaths([oldPath]);

        // Notifier le(s) enseignant(s) du groupe
        if (!existing) {
            try {
                const student = await prisma.student.findUnique({
                    where: { id: ctx.studentId },
                    include: {
                        user: { select: { prenom: true, nom: true } },
                        enrollments: { include: { group: { select: { teacherId: true } } } },
                    },
                });
                const teacherIds = [...new Set(student.enrollments.map(e => e.group?.teacherId).filter(Boolean))];
                if (teacherIds.length) {
                    await prisma.notification.createMany({
                        data: teacherIds.map(userId => ({
                            userId,
                            titre: '📥 Nouveau devoir reçu',
                            message: `${student.user.prenom} ${student.user.nom} a rendu : ${ctx.lesson.titre}`,
                            type: 'DEVOIR',
                        })),
                    });
                }
            } catch (e) { console.error('Notification devoir :', e.message); }
        }
        res.json(sub);
    } catch (err) { fail(res, err); }
});

// notes de l'élève connecté (devoirs + quiz)
router.get('/my-results', protect, async (req, res) => {
    try {
        const studentId = await resolveStudentId(req.user);
        if (!studentId || isStaff(req.user)) return res.json({ submissions: [], quizzes: [] });
        const lessonSel = {
            select: {
                id: true, titre: true,
                module: { select: { titre: true } },
                course: { select: { id: true, titre: true } },
            },
        };
        const [submissions, quizzes] = await Promise.all([
            prisma.lessonSubmission.findMany({
                where: { studentId },
                include: { chapter: lessonSel },
                orderBy: { submittedAt: 'desc' },
            }),
            prisma.lessonProgress.findMany({
                where: { studentId, quizSoumis: true },
                select: { chapterId: true, quizScore: true, quizCorrect: true, quizTotal: true, updatedAt: true, chapter: lessonSel },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);
        res.json({ submissions, quizzes });
    } catch (err) { fail(res, err); }
});

// ══════════════════════════════════════════════════════════
// DEVOIRS RENDUS — côté personnel
// ══════════════════════════════════════════════════════════

const submissionInclude = {
    student: {
        include: {
            user: { select: { id: true, nom: true, prenom: true, avatarUrl: true } },
            enrollments: { include: { group: { select: { id: true, titre: true, audience: true } } } },
        },
    },
    chapter: {
        select: {
            id: true, titre: true, homeworkDueDate: true,
            module: { select: { id: true, titre: true } },
            course: { select: { id: true, titre: true, audience: true } },
        },
    },
};

// GET /content/submissions?statut=RENDU|CORRIGE&groupId=&courseId=
router.get('/submissions', protect, staff, async (req, res) => {
    try {
        const ids = await staffGroupIds(req.user);
        const where = {};
        if (['RENDU', 'CORRIGE'].includes(req.query.statut)) where.statut = req.query.statut;
        if (int(req.query.courseId)) where.chapter = { courseId: int(req.query.courseId) };
        let groupFilter = ids;
        if (int(req.query.groupId)) {
            const g = int(req.query.groupId);
            groupFilter = ids === null ? [g] : ids.filter(i => i === g);
        }
        if (groupFilter !== null) {
            if (!groupFilter.length) return res.json([]);
            where.student = { enrollments: { some: { groupId: { in: groupFilter } } } };
        }
        const subs = await prisma.lessonSubmission.findMany({
            where, include: submissionInclude, orderBy: { submittedAt: 'desc' }, take: 500,
        });
        res.json(subs);
    } catch (err) { fail(res, err); }
});

// GET /content/lessons/:id/submissions → élèves concernés + leur rendu
router.get('/lessons/:id/submissions', protect, staff, async (req, res) => {
    try {
        const chapterId = int(req.params.id);
        const lesson = chapterId && await prisma.chapter.findUnique({ where: { id: chapterId }, select: { courseId: true } });
        if (!lesson) return res.status(404).json({ message: 'Leçon non trouvée' });

        const ids = await staffGroupIds(req.user);
        const cgs = await prisma.courseGroup.findMany({
            where: { courseId: lesson.courseId, ...(ids === null ? {} : { groupId: { in: ids } }) },
            include: {
                group: {
                    select: {
                        id: true, titre: true,
                        enrollments: { include: { student: { include: { user: { select: { id: true, nom: true, prenom: true, avatarUrl: true } } } } } },
                    },
                },
            },
        });
        const subs = await prisma.lessonSubmission.findMany({ where: { chapterId } });
        const byStudent = new Map(subs.map(s => [s.studentId, s]));
        const groups = cgs.map(cg => ({
            id: cg.group.id,
            titre: cg.group.titre,
            students: cg.group.enrollments
                .map(e => ({ studentId: e.studentId, user: e.student.user, submission: byStudent.get(e.studentId) || null }))
                .sort((a, b) => `${a.user.nom} ${a.user.prenom}`.localeCompare(`${b.user.nom} ${b.user.prenom}`, 'fr')),
        }));
        res.json({ groups });
    } catch (err) { fail(res, err); }
});

// télécharger un rendu (personnel autorisé ou l'élève lui-même)
router.get('/submissions/:id/url', protect, async (req, res) => {
    try {
        const sub = await prisma.lessonSubmission.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!sub) return res.status(404).json({ message: 'Devoir introuvable' });
        if (isStaff(req.user)) {
            if (!(await staffCanSeeStudent(req.user, sub.studentId))) return res.status(403).json({ message: 'Accès refusé' });
        } else if ((await resolveStudentId(req.user)) !== sub.studentId) {
            return res.status(403).json({ message: 'Accès refusé' });
        }
        if (!sub.storagePath) return res.status(404).json({ message: 'Aucun fichier joint' });
        const url = await storage.createDownloadUrl(sub.storagePath, { download: sub.fileName || 'devoir' });
        res.json({ url });
    } catch (err) { fail(res, err); }
});

// corriger
router.put('/submissions/:id/grade', protect, canEdit, async (req, res) => {
    try {
        const sub = await prisma.lessonSubmission.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!sub) return res.status(404).json({ message: 'Devoir introuvable' });
        if (!(await staffCanSeeStudent(req.user, sub.studentId))) return res.status(403).json({ message: 'Ce devoir n\'est pas dans vos groupes' });

        const note = req.body.note === '' || req.body.note == null ? null : Number(req.body.note);
        if (note !== null && (!Number.isFinite(note) || note < 0 || note > 20)) {
            return res.status(400).json({ message: 'La note doit être comprise entre 0 et 20' });
        }
        const commentaire = req.body.commentaire ? String(req.body.commentaire).slice(0, 3000) : null;
        if (note === null && !commentaire) return res.status(400).json({ message: 'Mettez une note ou un commentaire' });

        const updated = await prisma.lessonSubmission.update({
            where: { id: sub.id },
            data: { note, commentaire, statut: 'CORRIGE', correctedAt: new Date() },
            include: {
                ...submissionInclude,
                student: { include: { user: { select: { id: true, nom: true, prenom: true, email: true, avatarUrl: true } }, enrollments: submissionInclude.student.include.enrollments } },
            },
        });

        try {
            await prisma.notification.create({
                data: {
                    userId: updated.student.user.id,
                    titre: '📝 Devoir corrigé',
                    message: note !== null
                        ? `Vous avez reçu ${note}/20 pour : ${updated.chapter.titre}`
                        : `Votre professeur a commenté : ${updated.chapter.titre}`,
                    type: 'NOTE',
                },
            });
            const dest = updated.student.parentEmail || updated.student.user.email;
            if (note !== null && dest && !isPlaceholderEmail(dest) && req.body.sendEmail !== false) {
                const teacher = await prisma.user.findUnique({ where: { id: req.user.id }, select: { prenom: true, nom: true } });
                await sendSafe(() => sendHomeworkCorrectedEmail({
                    to: dest,
                    studentName: `${updated.student.user.prenom} ${updated.student.user.nom}`,
                    taskTitle: updated.chapter.titre,
                    note, maxNote: 20, comment: commentaire,
                    teacherName: teacher ? `${teacher.prenom} ${teacher.nom}` : '',
                }), { to: dest, subject: 'Devoir corrigé', type: 'HOMEWORK_CORRECTED' }, prisma);
            }
        } catch (e) { console.error('Notification correction :', e.message); }

        delete updated.student.user.email;
        res.json(updated);
    } catch (err) { fail(res, err); }
});

// autoriser un nouveau rendu (supprime le rendu)
router.delete('/submissions/:id', protect, canEdit, async (req, res) => {
    try {
        const sub = await prisma.lessonSubmission.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!sub) return res.status(404).json({ message: 'Devoir introuvable' });
        if (!(await staffCanSeeStudent(req.user, sub.studentId))) return res.status(403).json({ message: 'Accès refusé' });
        await prisma.lessonSubmission.delete({ where: { id: sub.id } });
        await cleanupPaths([sub.storagePath]);
        res.json({ message: 'Rendu supprimé : l\'élève peut rendre à nouveau' });
    } catch (err) { fail(res, err); }
});

module.exports = router;
