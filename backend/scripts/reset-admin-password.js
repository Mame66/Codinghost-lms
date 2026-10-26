// ════════════════════════════════════════════════════════════
// Réinitialiser le mot de passe d'un compte (admin, enseignant…)
// Usage (dans le dossier backend) :
//   node scripts/reset-admin-password.js            → liste les comptes admin
//   node scripts/reset-admin-password.js <login> <nouveauMotDePasse>
// ════════════════════════════════════════════════════════════
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    const [login, newPassword] = process.argv.slice(2);

    if (!login) {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, login: true, prenom: true, nom: true, email: true },
        });
        console.log('Comptes administrateur :');
        admins.forEach(a => console.log(`  - login: "${a.login}"  (${a.prenom} ${a.nom}, ${a.email})`));
        console.log('\nPour changer le mot de passe :\n  node scripts/reset-admin-password.js <login> <nouveauMotDePasse>');
        return;
    }
    if (!newPassword || newPassword.length < 8) {
        console.error('❌ Donnez un nouveau mot de passe d\'au moins 8 caractères.');
        process.exitCode = 1;
        return;
    }

    const user = await prisma.user.findFirst({ where: { login: { equals: login, mode: 'insensitive' } } });
    if (!user) {
        console.error(`❌ Aucun compte avec le login "${login}". Lancez le script sans argument pour voir les logins admin.`);
        process.exitCode = 1;
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(newPassword, 10), plainPassword: null, actif: true },
    });
    console.log(`✅ Mot de passe mis à jour pour "${user.login}" (${user.prenom} ${user.nom}).`);
})()
    .catch(e => { console.error('❌', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
