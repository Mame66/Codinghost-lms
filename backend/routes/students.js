const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect, adminOnly, allowRoles } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { uniqueLogin, genPassword, placeholderEmail, isPlaceholderEmail } = require('../lib/credentials');
const { sendWelcomeEmail, sendSafe } = require('../services/emailService');

const canEdit = allowRoles('ADMIN', 'TEACHER');
const staff   = allowRoles('ADMIN', 'TEACHER', 'TEACHER_VIEW');

const AUDIENCES = ['ENFANT', 'ADULTE'];

// Champs utilisateur renvoyés au personnel (jamais le hash du mot de passe)
const userSelect = {
    id: true, nom: true, prenom: true, email: true, login: true,
    plainPassword: true, avatarUrl: true, telephone: true, createdAt: true,
};

const studentInclude = {
    user: { select: userSelect },
    enrollments: {
        include: { group: { select: { id: true, titre: true, audience: true, ville: true } } },
    },
};

const cleanStr = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
};

const parseAge = (v) => {
    const n = parseInt(v);
    return Number.isFinite(n) && n > 0 && n < 120 ? n : null;
};

// Vérifie qu'un email réel n'est pas déjà utilisé par un autre compte
const emailTaken = async (email, exceptUserId = null) => {
    if (!email) return false;
    const u = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}) },
        select: { id: true },
    });
    return !!u;
};

// ── Création d'un élève (utilisée par la création simple ET l'import) ──
const createStudent = async (data) => {
    const prenom = cleanStr(data.prenom);
    const nom    = cleanStr(data.nom);
    if (!prenom || !nom) throw Object.assign(new Error('Prénom et nom obligatoires'), { status: 400 });

    const email       = cleanStr(data.email);
    const parentEmail = cleanStr(data.parentEmail);
    if (email && await emailTaken(email)) {
        throw Object.assign(new Error(`L'email ${email} est déjà utilisé par un autre compte`), { status: 400 });
    }

    const login          = await uniqueLogin(prisma, prenom, nom);
    const plainPassword  = genPassword(prenom, nom);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const groupId        = data.groupId ? parseInt(data.groupId) : null;

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                nom, prenom, login,
                email:     email || placeholderEmail(login),
                password:  hashedPassword,
                plainPassword,           // gardé pour imprimer les fiches identifiants
                telephone: cleanStr(data.telephone),
                role:      'STUDENT',
            },
        });
        const student = await tx.student.create({
            data: {
                userId:      user.id,
                age:         parseAge(data.age),
                parentNom:   cleanStr(data.parentNom),
                parentTel:   cleanStr(data.parentTel),
                parentEmail,
            },
        });
        if (groupId) {
            await tx.enrollment.create({ data: { studentId: student.id, groupId } });
        }
        return { user, student };
    });

    return { ...result, login, plainPassword, groupId };
};

const sendWelcome = async ({ prenom, nom, email, parentEmail, parentNom, login, password, groupId }) => {
    const dest = parentEmail || (email && !isPlaceholderEmail(email) ? email : null);
    if (!dest) return false;
    let groupName = null;
    if (groupId) {
        const g = await prisma.group.findUnique({ where: { id: groupId }, select: { titre: true } });
        groupName = g?.titre || null;
    }
    const r = await sendSafe(
        () => sendWelcomeEmail({ to: dest, parentName: parentNom || '', studentName: `${prenom} ${nom}`, login, password, groupName }),
        { type: 'WELCOME', to: dest, subject: `Bienvenue chez CodingHost — ${prenom} ${nom}` },
        prisma
    );
    return r.success;
};

// ═══════════════════════════════════════════════════════════
// GET /students?audience=ENFANT|ADULTE|NONE   (personnel uniquement)
// ═══════════════════════════════════════════════════════════
router.get('/', protect, staff, async (req, res) => {
    try {
        const { audience } = req.query;
        let where = {};
        if (AUDIENCES.includes(audience)) where = { enrollments: { some: { group: { audience } } } };
        else if (audience === 'NONE')     where = { enrollments: { none: {} } };

        const students = await prisma.student.findMany({
            where,
            include: studentInclude,
            orderBy: { createdAt: 'desc' },
        });

        // Le mot de passe en clair n'est visible que par ADMIN et TEACHER
        if (req.user.role === 'TEACHER_VIEW') students.forEach(s => { s.user.plainPassword = null; });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /students/counts → nombre d'élèves par public (badges du menu)
router.get('/counts', protect, staff, async (req, res) => {
    try {
        const [enfants, adultes, sansGroupe] = await Promise.all([
            prisma.student.count({ where: { enrollments: { some: { group: { audience: 'ENFANT' } } } } }),
            prisma.student.count({ where: { enrollments: { some: { group: { audience: 'ADULTE' } } } } }),
            prisma.student.count({ where: { enrollments: { none: {} } } }),
        ]);
        res.json({ ENFANT: enfants, ADULTE: adultes, NONE: sansGroupe });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /students/me → fiche de l'élève connecté
router.get('/me', protect, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { userId: req.user.id },
            include: {
                user: { select: { id: true, nom: true, prenom: true, login: true, avatarUrl: true } },
                enrollments: { include: { group: { select: { id: true, titre: true, audience: true, ville: true } } } },
            },
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET /students/:id (personnel)
router.get('/:id', protect, staff, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: studentInclude,
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// POST /students → créer un élève
// ═══════════════════════════════════════════════════════════
router.post('/', protect, canEdit, async (req, res) => {
    try {
        const created = await createStudent(req.body);
        const emailSent = await sendWelcome({
            prenom: created.user.prenom, nom: created.user.nom,
            email: req.body.email, parentEmail: cleanStr(req.body.parentEmail), parentNom: req.body.parentNom,
            login: created.login, password: created.plainPassword, groupId: created.groupId,
        });
        res.status(201).json({
            message: 'Étudiant créé avec succès',
            student: created.student,
            credentials: { login: created.login, password: created.plainPassword },
            emailSent,
        });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// POST /students/import → import en masse (export Kommo CSV/Excel)
// body: { rows: [{prenom, nom, age, email, telephone, parentNom, parentTel, parentEmail}],
//         groupId?, skipDuplicates = true, sendEmails = false }
// ═══════════════════════════════════════════════════════════
router.post('/import', protect, canEdit, async (req, res) => {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const groupId = req.body.groupId ? parseInt(req.body.groupId) : null;
    const skipDuplicates = req.body.skipDuplicates !== false;
    const sendEmails = !!req.body.sendEmails;

    if (rows.length === 0) return res.status(400).json({ message: 'Aucune ligne à importer' });
    if (rows.length > 1000) return res.status(400).json({ message: '1000 lignes maximum par import' });

    try {
        let group = null;
        if (groupId) {
            group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, titre: true } });
            if (!group) return res.status(400).json({ message: 'Groupe introuvable' });
        }

        // Élèves déjà existants (même prénom + nom) pour détecter les doublons
        const existing = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { prenom: true, nom: true, login: true },
        });
        const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const known = new Map(existing.map(u => [`${norm(u.prenom)}|${norm(u.nom)}`, u.login]));

        const created = [], skipped = [], errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i] || {};
            const line = r._line || i + 1;
            const key = `${norm(r.prenom)}|${norm(r.nom)}`;

            if (!cleanStr(r.prenom) || !cleanStr(r.nom)) {
                errors.push({ line, prenom: r.prenom || '', nom: r.nom || '', raison: 'Prénom ou nom manquant' });
                continue;
            }
            if (skipDuplicates && known.has(key)) {
                skipped.push({ line, prenom: r.prenom, nom: r.nom, raison: `Déjà inscrit (login : ${known.get(key)})` });
                continue;
            }
            try {
                const c = await createStudent({ ...r, groupId });
                known.set(key, c.login);
                let emailSent = false;
                if (sendEmails) {
                    emailSent = await sendWelcome({
                        prenom: c.user.prenom, nom: c.user.nom, email: r.email,
                        parentEmail: cleanStr(r.parentEmail), parentNom: r.parentNom,
                        login: c.login, password: c.plainPassword, groupId,
                    });
                }
                created.push({
                    line, id: c.student.id, prenom: c.user.prenom, nom: c.user.nom,
                    login: c.login, password: c.plainPassword, groupe: group?.titre || null, emailSent,
                });
            } catch (e) {
                errors.push({ line, prenom: r.prenom, nom: r.nom, raison: e.status ? e.message : 'Erreur serveur' });
                if (!e.status) console.error('import row error:', e);
            }
        }

        res.status(201).json({ created, skipped, errors, total: rows.length });
    } catch (err) {
        console.error('POST /students/import error:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// PUT /students/:id/full → modifier un élève
// ═══════════════════════════════════════════════════════════
router.put('/:id/full', protect, canEdit, async (req, res) => {
    const { nom, prenom, age, parentNom, parentTel, parentEmail, groupId, resetPassword, email, telephone } = req.body;
    if (!cleanStr(nom) || !cleanStr(prenom)) return res.status(400).json({ message: 'Nom et prénom obligatoires' });

    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { user: true, enrollments: true },
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });

        const realEmail = cleanStr(email);
        if (realEmail && await emailTaken(realEmail, student.userId)) {
            return res.status(400).json({ message: `L'email ${realEmail} est déjà utilisé par un autre compte` });
        }

        await prisma.student.update({
            where: { id: student.id },
            data: {
                age: parseAge(age),
                parentNom: cleanStr(parentNom),
                parentTel: cleanStr(parentTel),
                parentEmail: cleanStr(parentEmail),
            }
        });

        const userUpdateData = { nom: cleanStr(nom), prenom: cleanStr(prenom) };
        if (telephone !== undefined) userUpdateData.telephone = cleanStr(telephone);
        if (email !== undefined) {
            userUpdateData.email = realEmail || (isPlaceholderEmail(student.user.email) ? student.user.email : placeholderEmail(student.user.login));
        }

        let newPassword = null;
        if (resetPassword) {
            newPassword = genPassword(prenom, nom);
            userUpdateData.password = await bcrypt.hash(newPassword, 10);
            userUpdateData.plainPassword = newPassword;
        }

        await prisma.user.update({ where: { id: student.userId }, data: userUpdateData });

        // ✅ FIX : on ne touche à l'inscription QUE si le groupe change.
        // Avant : chaque enregistrement supprimait l'inscription ET tout l'historique de présences.
        if (groupId !== undefined) {
            const target = groupId ? parseInt(groupId) : null;
            const current = student.enrollments.map(e => e.groupId);
            const unchanged = target ? (current.length === 1 && current[0] === target) : current.length === 0;
            if (!unchanged) {
                await prisma.$transaction(async (tx) => {
                    // Garde l'inscription (et ses présences) du groupe cible si elle existe déjà
                    await tx.enrollment.deleteMany({
                        where: { studentId: student.id, ...(target ? { NOT: { groupId: target } } : {}) },
                    });
                    if (target && !current.includes(target)) {
                        await tx.enrollment.create({ data: { studentId: student.id, groupId: target } });
                    }
                });
            }
        }

        if (resetPassword && newPassword) {
            const emailDest = cleanStr(parentEmail) || student.parentEmail || (isPlaceholderEmail(student.user.email) ? null : student.user.email);
            if (emailDest) {
                await sendSafe(
                    () => sendWelcomeEmail({
                        to: emailDest,
                        parentName:  parentNom || student.parentNom || '',
                        studentName: `${prenom} ${nom}`,
                        login:       student.user.login,
                        password:    newPassword,
                    }),
                    { type: 'RESET_PASSWORD', to: emailDest, subject: `Nouveaux identifiants — ${prenom} ${nom}` },
                    prisma
                );
            }
        }

        res.json({ message: 'Étudiant mis à jour', newPassword, login: student.user.login });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// DELETE /students/:id (admin)
// ═══════════════════════════════════════════════════════════
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { _count: { select: { contracts: true } } },
        });
        if (!student) return res.status(404).json({ message: 'Étudiant non trouvé' });

        // Protection comptable : un contrat serait supprimé en cascade avec l'élève
        if (student._count.contracts > 0) {
            return res.status(409).json({
                message: `Cet élève a ${student._count.contracts} contrat(s). Supprimez ou annulez d'abord ses contrats dans Facturation.`,
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.payment.deleteMany({ where: { studentId: student.id } });
            await tx.homework.deleteMany({ where: { studentId: student.id } });     // fichiers en cascade
            await tx.student.delete({ where: { id: student.id } });                 // inscriptions, présences, progression en cascade
            await tx.notification.deleteMany({ where: { userId: student.userId } });
            await tx.user.delete({ where: { id: student.userId } });
        });

        res.json({ message: 'Étudiant supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;
