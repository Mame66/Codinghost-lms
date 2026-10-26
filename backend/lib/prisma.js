// ════════════════════════════════════════════════════════════
// Client Prisma UNIQUE pour toute l'application.
// Avant : chaque fichier de route faisait `new PrismaClient()`,
// ce qui ouvrait une douzaine de pools de connexions vers Supabase
// (erreurs « too many connections » / 500 aléatoires).
// ════════════════════════════════════════════════════════════
const { PrismaClient } = require('@prisma/client');

const prisma = global.__codinghostPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__codinghostPrisma = prisma;

module.exports = prisma;
