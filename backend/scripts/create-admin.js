// Crée (ou remet à zéro) un compte ADMIN.
// Usage (dans backend) :
//   node scripts/create-admin.js <login> <motDePasse> [email] [prenom] [nom]
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    const [login, password, email, prenom, nom] = process.argv.slice(2);
    if (!login || !password || password.length < 8) {
        console.error('Usage : node scripts/create-admin.js <login> <motDePasse (8+ caractères)> [email] [prenom] [nom]');
        process.exitCode = 1;
        return;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
        where: { login },
        update: { password: hash, role: 'ADMIN', actif: true, plainPassword: null },
        create: {
            login,
            password: hash,
            role: 'ADMIN',
            email: email || `${login}@codinghost.fr`,
            prenom: prenom || 'Admin',
            nom: nom || 'CodingHost',
        },
    });
    console.log(`✅ Compte admin prêt : login "${user.login}" (${user.prenom} ${user.nom}, ${user.email})`);
})()
    .catch(e => { console.error('❌', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
