// ════════════════════════════════════════════════════════════
// Outils communs aux contenus de cours :
//  - suppression propre des leçons (anciennes tâches comprises)
//  - nettoyage du stockage quand plus aucune leçon n'utilise un fichier
//  - espace utilisé
// ════════════════════════════════════════════════════════════
const prisma = require('./prisma');
const { removeFiles, STORAGE_QUOTA_BYTES, MAX_FILE_BYTES, isConfigured } = require('./storage');

// Chemins de stockage utilisés par des leçons (ressources + devoirs rendus)
const pathsOfChapters = async (chapterIds) => {
    if (!chapterIds.length) return [];
    const [res, subs] = await Promise.all([
        prisma.lessonResource.findMany({ where: { chapterId: { in: chapterIds }, storagePath: { not: null } }, select: { storagePath: true } }),
        prisma.lessonSubmission.findMany({ where: { chapterId: { in: chapterIds }, storagePath: { not: null } }, select: { storagePath: true } }),
    ]);
    return [...res, ...subs].map(r => r.storagePath);
};

// Supprime du stockage les fichiers qui ne sont plus référencés
// (une copie de cours partage les fichiers de l'original)
const cleanupPaths = async (paths) => {
    const unique = [...new Set((paths || []).filter(Boolean))];
    if (!unique.length) return;
    const [res, subs] = await Promise.all([
        prisma.lessonResource.findMany({ where: { storagePath: { in: unique } }, select: { storagePath: true } }),
        prisma.lessonSubmission.findMany({ where: { storagePath: { in: unique } }, select: { storagePath: true } }),
    ]);
    const stillUsed = new Set([...res, ...subs].map(r => r.storagePath));
    await removeFiles(unique.filter(p => !stillUsed.has(p)));
};

// Supprime des leçons et tout ce qui en dépend (dans une transaction)
const deleteChaptersTx = async (tx, chapterIds) => {
    if (!chapterIds.length) return;
    const tasks = await tx.task.findMany({ where: { chapterId: { in: chapterIds } }, select: { id: true } });
    const taskIds = tasks.map(t => t.id);
    if (taskIds.length) {
        await tx.homework.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.qcmQuestion.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    }
    // quiz, progression, ressources et devoirs rendus : en cascade
    await tx.chapter.deleteMany({ where: { id: { in: chapterIds } } });
};

// Supprime des leçons + leurs fichiers devenus inutiles
const deleteChapters = async (chapterIds, extra) => {
    const paths = await pathsOfChapters(chapterIds);
    await prisma.$transaction(async (tx) => {
        await deleteChaptersTx(tx, chapterIds);
        if (extra) await extra(tx);
    });
    await cleanupPaths(paths);
};

// Espace occupé (chaque fichier compté une seule fois)
const storageUsage = async () => {
    const rows = await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(size), 0)::bigint AS used, COUNT(*)::bigint AS files FROM (
            SELECT "storagePath", MAX(COALESCE("size", 0)) AS size FROM (
                SELECT "storagePath", "size" FROM "LessonResource"   WHERE "storagePath" IS NOT NULL
                UNION ALL
                SELECT "storagePath", "size" FROM "LessonSubmission" WHERE "storagePath" IS NOT NULL
            ) t GROUP BY "storagePath"
        ) u`);
    return {
        configured: isConfigured(),
        usedBytes:  Number(rows[0]?.used || 0),
        files:      Number(rows[0]?.files || 0),
        quotaBytes: STORAGE_QUOTA_BYTES,
        maxFileBytes: MAX_FILE_BYTES,
    };
};

module.exports = { pathsOfChapters, cleanupPaths, deleteChaptersTx, deleteChapters, storageUsage };
