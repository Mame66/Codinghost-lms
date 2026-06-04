const express = require('express');
const router  = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les groupes
router.get('/', protect, async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            include: {
                teacher:    { select: { id: true, nom: true, prenom: true } },
                supervisor: { select: { id: true, nom: true, prenom: true } },
                _count:     { select: { enrollments: true } },
            }
        });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET un groupe par ID
router.get('/:id', protect, async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                teacher:    { select: { id: true, nom: true, prenom: true } },
                supervisor: { select: { id: true, nom: true, prenom: true } },
                _count:     { select: { enrollments: true } },
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true, nom: true, prenom: true,
                                        login: true, plainPassword: true,
                                    }
                                }
                            }
                        },
                        attendance: { orderBy: { date: 'asc' } }
                    }
                }
            }
        });
        if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// GET cours d'un groupe
router.get('/:id/courses', protect, async (req, res) => {
    try {
        const courseGroups = await prisma.courseGroup.findMany({
            where: { groupId: parseInt(req.params.id) },
            include: {
                course: {
                    include: {
                        chapters: {
                            orderBy: { ordre: 'asc' },
                            include: { tasks: { orderBy: { ordre: 'asc' } } }
                        }
                    }
                }
            }
        });
        res.json(courseGroups.map(cg => cg.course));
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST créer un groupe
router.post('/', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    // ✅ FIX : lire ville EXPLICITEMENT depuis req.body
    const ville        = req.body.ville;
    const titre        = req.body.titre;
    const teacherId    = req.body.teacherId;
    const supervisorId = req.body.supervisorId;
    const lieu         = req.body.lieu;
    const statut       = req.body.statut;
    const format       = req.body.format;
    const type         = req.body.type;

    // Log pour confirmer ce que le backend reçoit
    console.log('📦 POST /groups — body reçu:', {
        titre, ville, lieu, statut, format, type, teacherId, supervisorId
    });

    if (!titre) return res.status(400).json({ message: 'Titre obligatoire' });

    // ✅ FIX : ne pas utiliser || 'Thionville' si ville est déjà une string valide
    const villeValue = (ville && ville.trim() !== '') ? ville.trim() : 'Thionville';

    console.log('📍 Ville qui sera enregistrée:', villeValue);

    try {
        const group = await prisma.group.create({
            data: {
                titre,
                teacherId:    teacherId    ? parseInt(teacherId)    : null,
                supervisorId: supervisorId ? parseInt(supervisorId) : null,
                lieu:         lieu         || null,
                ville:        villeValue,                // ✅ toujours correct
                statut:       statut        || 'INSCRIPTION',
                format:       format        || 'OFFLINE',
                type:         type          || 'GROUPE',
            }
        });
        console.log('✅ Groupe créé en BDD:', { id: group.id, titre: group.titre, ville: group.ville });
        res.status(201).json(group);
    } catch (err) {
        console.error('❌ Erreur création groupe:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PUT modifier un groupe
router.put('/:id', protect, allowRoles('ADMIN', 'TEACHER'), async (req, res) => {
    // ✅ FIX : même approche — lecture explicite
    const ville        = req.body.ville;
    const titre        = req.body.titre;
    const teacherId    = req.body.teacherId;
    const supervisorId = req.body.supervisorId;
    const lieu         = req.body.lieu;
    const statut       = req.body.statut;
    const format       = req.body.format;
    const type         = req.body.type;

    console.log('📦 PUT /groups/:id — body reçu:', {
        id: req.params.id, titre, ville, lieu, statut, format, type
    });

    if (!titre) return res.status(400).json({ message: 'Titre obligatoire' });

    const villeValue = (ville && ville.trim() !== '') ? ville.trim() : 'Thionville';

    console.log('📍 Ville qui sera mise à jour:', villeValue);

    try {
        const group = await prisma.group.update({
            where: { id: parseInt(req.params.id) },
            data: {
                titre,
                teacherId:    teacherId    ? parseInt(teacherId)    : null,
                supervisorId: supervisorId ? parseInt(supervisorId) : null,
                lieu:         lieu         || null,
                ville:        villeValue,                // ✅ toujours correct
                statut:       statut        || 'INSCRIPTION',
                format:       format        || 'OFFLINE',
                type:         type          || 'GROUPE',
            }
        });
        console.log('✅ Groupe modifié en BDD:', { id: group.id, titre: group.titre, ville: group.ville });
        res.json(group);
    } catch (err) {
        console.error('❌ Erreur modification groupe:', err.message);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE supprimer un groupe
router.delete('/:id', protect, allowRoles('ADMIN'), async (req, res) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where:  { groupId: parseInt(req.params.id) },
            select: { id: true }
        });
        const enrollmentIds = enrollments.map(e => e.id);
        if (enrollmentIds.length > 0) {
            await prisma.attendance.deleteMany({
                where: { enrollmentId: { in: enrollmentIds } }
            });
        }
        await prisma.enrollment.deleteMany({ where: { groupId: parseInt(req.params.id) } });
        await prisma.group.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Groupe supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;