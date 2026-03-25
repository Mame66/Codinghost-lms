const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Admin
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                nom: 'Oukil',
                prenom: 'Karim',
                email: 'admin@codinghost.dz',
                login: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
            }
        });
        console.log('✅ Admin créé');
    } catch (err) {
        console.log('⚠️ Admin existe déjà, on continue...');
    }

    // Cours Python
    try {
        const course = await prisma.course.create({
            data: {
                titre: 'Python : De zéro à héros',
                description: 'Apprenez Python de A à Z',
                niveau: 'Débutant',
            }
        });

        const chapter1 = await prisma.chapter.create({
            data: {
                courseId: course.id,
                titre: '1. LES BASES DE PYTHON',
                ordre: 1,
                locked: false,
            }
        });

        await prisma.task.createMany({
            data: [
                { chapterId: chapter1.id, titre: 'Introduction à Python', type: 'SLIDE', ordre: 1 },
                { chapterId: chapter1.id, titre: 'Variables et types', type: 'EXERCISE', ordre: 2 },
                { chapterId: chapter1.id, titre: 'La fonction print()', type: 'SLIDE', ordre: 3 },
                { chapterId: chapter1.id, titre: 'Quiz : Les bases', type: 'EXERCISE', ordre: 4 },
            ]
        });

        const chapter2 = await prisma.chapter.create({
            data: {
                courseId: course.id,
                titre: '2. LES VARIABLES ET TYPES',
                ordre: 2,
                locked: true,
            }
        });

        await prisma.task.createMany({
            data: [
                { chapterId: chapter2.id, titre: 'Types de données', type: 'SLIDE', ordre: 1 },
                { chapterId: chapter2.id, titre: 'Exercice types', type: 'EXERCISE', ordre: 2 },
            ]
        });

        await prisma.chapter.create({
            data: {
                courseId: course.id,
                titre: '3. BOUCLES ET CONDITIONS',
                ordre: 3,
                locked: true,
            }
        });

        console.log('✅ Cours Python créé !');
    } catch (err) {
        console.log('⚠️ Cours existe déjà ou erreur :', err.message);
    }
    // Créer un compte enseignant
    try {
        const hashedPass = await bcrypt.hash('teacher123', 10);
        await prisma.user.create({
            data: {
                nom: 'Hamidi',
                prenom: 'Sara',
                email: 'sara@codinghost.dz',
                login: 'sara.hamidi',
                password: hashedPass,
                role: 'TEACHER',
            }
        });
        console.log('✅ Enseignant créé : sara.hamidi / teacher123');
    } catch (err) {
        console.log('⚠️ Enseignant existe déjà');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());