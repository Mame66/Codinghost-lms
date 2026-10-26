const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Vérifie le token ET recharge l'utilisateur en base :
// un compte désactivé ou supprimé perd l'accès immédiatement,
// et le rôle utilisé est toujours celui de la base (pas celui du token).
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non autorisé' });
    }
    let decoded;
    try {
        decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: 'Token invalide' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, nom: true, prenom: true, actif: true },
        });
        if (!user || user.actif === false) return res.status(401).json({ message: 'Compte inactif ou introuvable' });
        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

const allowRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
};

// Raccourcis
const staffOnly = allowRoles('ADMIN', 'TEACHER', 'TEACHER_VIEW');
const adminOnly = allowRoles('ADMIN');

module.exports = { protect, allowRoles, staffOnly, adminOnly };
