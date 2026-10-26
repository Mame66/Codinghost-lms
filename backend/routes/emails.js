// ════════════════════════════════════════════════════════════
// Emails aux parents et aux élèves adultes — monté sur /api/emails
// Administrateurs : tous les groupes. Enseignants : leurs groupes.
// ════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { transporter, emailProvider, fromAddress } = require('../services/emailService');
const {
    VARIABLES, unknownVariables, studentInclude, resolveRecipient, renderEmail, sampleVars,
} = require('../lib/emailCompose');

router.use(protect, allowRoles('ADMIN', 'TEACHER'));

const CIBLES = ['PARENTS', 'ADULTES', 'TOUS'];
const MAX_RECIPIENTS = 300;
const int = (v) => { const n = parseInt(v); return Number.isFinite(n) ? n : null; };
const fail = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('emails:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
};
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

// Groupes accessibles (null = tous)
const allowedGroupIds = async (user) => {
    if (user.role === 'ADMIN') return null;
    const gs = await prisma.group.findMany({ where: { OR: [{ teacherId: user.id }, { supervisorId: user.id }] }, select: { id: true } });
    return gs.map(g => g.id);
};

const checkContent = (sujet, contenu) => {
    if (!String(sujet || '').trim()) throw bad('Le sujet est obligatoire');
    if (!String(contenu || '').trim()) throw bad('Le message est vide');
    const unknown = unknownVariables(sujet, contenu);
    if (unknown.length) throw bad(`Variable inconnue : ${unknown.map(u => `{{${u}}}`).join(', ')}`);
};

// Construit la liste des destinataires à partir de groupes et/ou d'élèves
const buildRecipients = async (user, { groupIds = [], studentIds = [], targets = [] }) => {
    const allowed = await allowedGroupIds(user);
    const canGroup = (gid) => allowed === null || allowed.includes(gid);
    const out = new Map();

    const gids = (groupIds || []).map(int).filter(Boolean);
    for (const gid of gids) {
        if (!canGroup(gid)) throw Object.assign(new Error('Ce groupe ne fait pas partie de vos groupes'), { status: 403 });
    }
    if (gids.length) {
        const enrollments = await prisma.enrollment.findMany({
            where: { groupId: { in: gids } },
            include: { student: { include: studentInclude } },
        });
        enrollments.forEach(e => { const r = resolveRecipient(e.student, e.groupId); out.set(r.key, r); });
    }

    // élèves (envoi individuel) — optionnellement avec le groupe de contexte
    const pairs = [
        ...(studentIds || []).map(id => ({ studentId: int(id), groupId: null })),
        ...(targets || []).map(t => ({ studentId: int(t.studentId), groupId: int(t.groupId) })),
    ].filter(p => p.studentId);
    if (pairs.length) {
        const students = await prisma.student.findMany({ where: { id: { in: [...new Set(pairs.map(p => p.studentId))] } }, include: studentInclude });
        const byId = new Map(students.map(s => [s.id, s]));
        for (const p of pairs) {
            const s = byId.get(p.studentId);
            if (!s) continue;
            if (allowed !== null && !s.enrollments.some(e => allowed.includes(e.groupId))) {
                throw Object.assign(new Error(`${s.user.prenom} ${s.user.nom} n'est pas dans vos groupes`), { status: 403 });
            }
            const r = resolveRecipient(s, p.groupId);
            out.set(r.key, r);
        }
    }
    return [...out.values()].sort((a, b) =>
        (a.groupe || '').localeCompare(b.groupe || '', 'fr') || a.eleve.localeCompare(b.eleve, 'fr'));
};

const publicRecipient = ({ vars, ...r }) => r;

// ══════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════
router.get('/config', (req, res) => {
    const provider = emailProvider();
    res.json({
        configured: !!provider && !!fromAddress(),
        provider,
        from: fromAddress() || null,
        maxRecipients: MAX_RECIPIENTS,
        variables: VARIABLES,
    });
});

// ══════════════════════════════════════════════════════════
// MODÈLES
// ══════════════════════════════════════════════════════════
router.get('/templates', async (req, res) => {
    try {
        res.json(await prisma.emailTemplate.findMany({ orderBy: [{ cible: 'asc' }, { nom: 'asc' }] }));
    } catch (err) { fail(res, err); }
});

const templateData = (b) => {
    const nom = String(b.nom || '').trim();
    if (!nom) throw bad('Le nom du modèle est obligatoire');
    checkContent(b.sujet, b.contenu);
    return {
        nom: nom.slice(0, 120),
        cible: CIBLES.includes(b.cible) ? b.cible : 'TOUS',
        sujet: String(b.sujet).trim().slice(0, 250),
        contenu: String(b.contenu).slice(0, 20000),
    };
};

router.post('/templates', async (req, res) => {
    try {
        const t = await prisma.emailTemplate.create({ data: { ...templateData(req.body), createdBy: req.user.id } });
        res.status(201).json(t);
    } catch (err) { fail(res, err); }
});

const canEditTemplate = (user, t) => user.role === 'ADMIN' || t.createdBy === user.id;

router.put('/templates/:id', async (req, res) => {
    try {
        const t = await prisma.emailTemplate.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!t) return res.status(404).json({ message: 'Modèle introuvable' });
        if (!canEditTemplate(req.user, t)) return res.status(403).json({ message: 'Seul l\'auteur du modèle ou un administrateur peut le modifier' });
        res.json(await prisma.emailTemplate.update({ where: { id: t.id }, data: templateData(req.body) }));
    } catch (err) { fail(res, err); }
});

router.delete('/templates/:id', async (req, res) => {
    try {
        const t = await prisma.emailTemplate.findUnique({ where: { id: int(req.params.id) || 0 } });
        if (!t) return res.status(404).json({ message: 'Modèle introuvable' });
        if (!canEditTemplate(req.user, t)) return res.status(403).json({ message: 'Seul l\'auteur du modèle ou un administrateur peut le supprimer' });
        await prisma.emailTemplate.delete({ where: { id: t.id } });
        res.json({ message: 'Modèle supprimé' });
    } catch (err) { fail(res, err); }
});

// ══════════════════════════════════════════════════════════
// DESTINATAIRES ET APERÇU
// ══════════════════════════════════════════════════════════
router.post('/recipients', async (req, res) => {
    try {
        const list = await buildRecipients(req.user, req.body);
        res.json(list.map(publicRecipient));
    } catch (err) { fail(res, err); }
});

router.post('/preview', async (req, res) => {
    try {
        const { sujet = '', contenu = '', target } = req.body;
        let vars = sampleVars(), to = null;
        if (target?.studentId) {
            const [r] = await buildRecipients(req.user, { targets: [target] });
            if (r) { vars = r.vars; to = publicRecipient(r); }
        }
        const { subject, html } = renderEmail(sujet, contenu, vars);
        res.json({ subject, html, to, unknown: unknownVariables(sujet, contenu) });
    } catch (err) { fail(res, err); }
});

// Envoi d'un essai à soi-même
router.post('/test', async (req, res) => {
    try {
        checkContent(req.body.sujet, req.body.contenu);
        const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, prenom: true } });
        if (!me?.email) throw bad('Votre compte n\'a pas d\'adresse email');
        let vars = sampleVars();
        if (req.body.target?.studentId) {
            const [r] = await buildRecipients(req.user, { targets: [req.body.target] });
            if (r) vars = r.vars;
        }
        const { subject, html } = renderEmail(req.body.sujet, req.body.contenu, vars);
        await transporter.sendMail({ to: me.email, subject: `[ESSAI] ${subject}`, html });
        res.json({ message: `Essai envoyé à ${me.email}` });
    } catch (err) {
        if (!err.status) return res.status(502).json({ message: `Envoi impossible : ${err.message}` });
        fail(res, err);
    }
});

// ══════════════════════════════════════════════════════════
// ENVOI
// body : { sujet, contenu, groupIds?, studentIds?, targets?: [{studentId, groupId}], exclude?: [keys], cible? }
// ══════════════════════════════════════════════════════════
router.post('/send', async (req, res) => {
    try {
        const { sujet, contenu } = req.body;
        checkContent(sujet, contenu);
        if (!emailProvider()) throw Object.assign(new Error('L\'envoi d\'emails n\'est pas configuré sur le serveur'), { status: 503 });

        const exclude = new Set(req.body.exclude || []);
        const recipients = (await buildRecipients(req.user, req.body)).filter(r => !exclude.has(r.key));
        if (!recipients.length) throw bad('Aucun destinataire');
        if (recipients.length > MAX_RECIPIENTS) throw bad(`Maximum ${MAX_RECIPIENTS} destinataires par envoi`);

        const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { prenom: true, nom: true } });
        const groupes = [...new Set(recipients.map(r => r.groupe).filter(Boolean))];
        const cible = String(req.body.cible || '').trim().slice(0, 200) || (
            recipients.length === 1 ? `${recipients[0].nom}${recipients[0].type === 'PARENT' ? ` (parent de ${recipients[0].eleve})` : ''}`
                : groupes.length === 1 ? `Groupe ${groupes[0]}` : `${groupes.length} groupes`);

        const message = await prisma.emailMessage.create({
            data: { sujet: String(sujet).trim(), contenu: String(contenu), cible, sentById: req.user.id, sentByNom: me ? `${me.prenom} ${me.nom}` : null, total: recipients.length },
        });

        // envoi 3 par 3
        const results = [];
        let i = 0;
        const worker = async () => {
            while (i < recipients.length) {
                const r = recipients[i++];
                const base = { messageId: message.id, studentId: r.studentId, type: r.type, nom: r.nom, email: r.email, eleve: r.eleve, groupe: r.groupe };
                if (!r.email) { results.push({ ...base, success: false, error: 'Pas d\'adresse email' }); continue; }
                try {
                    const { subject, html } = renderEmail(sujet, contenu, r.vars);
                    await transporter.sendMail({ to: r.email, subject, html });
                    results.push({ ...base, success: true });
                } catch (e) {
                    results.push({ ...base, success: false, error: String(e.message).slice(0, 500) });
                }
            }
        };
        await Promise.all([worker(), worker(), worker()]);

        await prisma.emailRecipient.createMany({ data: results });
        const envoyes = results.filter(r => r.success).length;
        const updated = await prisma.emailMessage.update({
            where: { id: message.id },
            data: { envoyes, echecs: results.length - envoyes },
        });
        res.json({ ...updated, failures: results.filter(r => !r.success).map(r => ({ nom: r.nom, eleve: r.eleve, email: r.email, error: r.error })) });
    } catch (err) { fail(res, err); }
});

// ══════════════════════════════════════════════════════════
// HISTORIQUE
// ══════════════════════════════════════════════════════════
router.get('/history', async (req, res) => {
    try {
        const where = req.user.role === 'ADMIN' ? {} : { sentById: req.user.id };
        res.json(await prisma.emailMessage.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }));
    } catch (err) { fail(res, err); }
});

router.get('/history/:id', async (req, res) => {
    try {
        const m = await prisma.emailMessage.findUnique({
            where: { id: int(req.params.id) || 0 },
            include: { recipients: { orderBy: [{ success: 'asc' }, { nom: 'asc' }] } },
        });
        if (!m) return res.status(404).json({ message: 'Envoi introuvable' });
        if (req.user.role !== 'ADMIN' && m.sentById !== req.user.id) return res.status(403).json({ message: 'Accès refusé' });
        res.json(m);
    } catch (err) { fail(res, err); }
});

module.exports = router;
