// Diagnostic en LECTURE SEULE : quelle base est utilisée et quels comptes elle contient.
// Usage (dans backend) : node scripts/diagnostic-comptes.js
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    const url = process.env.DATABASE_URL || '';
    const m = /@([^/:?]+)(?::(\d+))?\/([^?]+)/.exec(url);
    const user = /^postgres(?:ql)?:\/\/([^:]+):/.exec(url);
    console.log('Base utilisée :', m ? `${m[1]}:${m[2] || ''}/${m[3]}` : '(DATABASE_URL introuvable)');
    console.log('Utilisateur BDD :', user ? user[1] : '?', '\n');

    const byRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    console.log('Comptes par rôle :');
    byRole.forEach(r => console.log(`  ${r.role.padEnd(13)} ${r._count._all}`));
    console.log('  Total élèves (Student) :', await prisma.student.count());
    console.log('  Groupes :', await prisma.group.count(), ' Cours :', await prisma.course.count(), ' Contrats :', await prisma.contract.count());

    const staff = await prisma.user.findMany({
        where: { role: { not: 'STUDENT' } },
        select: { login: true, role: true, prenom: true, nom: true },
        orderBy: { id: 'asc' },
    });
    console.log('\nComptes personnel :');
    staff.forEach(u => console.log(`  ${u.role.padEnd(13)} login: "${u.login}"  (${u.prenom} ${u.nom})`));
})()
    .catch(e => { console.error('❌', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
