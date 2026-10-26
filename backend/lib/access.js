// ════════════════════════════════════════════════════════════
// Contrôles d'accès « élève » : un élève ne voit QUE les cours
// des groupes dans lesquels il est inscrit.
// ════════════════════════════════════════════════════════════
const prisma = require('./prisma');

const isStaff = (user) => ['ADMIN', 'TEACHER', 'TEACHER_VIEW'].includes(user?.role);

const getStudentByUser = (userId) =>
    prisma.student.findUnique({
        where: { userId },
        include: { enrollments: { include: { group: { select: { id: true, titre: true, audience: true } } } } },
    });

// Public de l'élève (ENFANT / ADULTE) déduit de son groupe. null si sans groupe.
const audienceOfStudent = (student) => student?.enrollments?.[0]?.group?.audience || null;

const getStudentAudience = async (userId) => audienceOfStudent(await getStudentByUser(userId));

// Ids des cours accessibles à un élève
const studentCourseIds = async (userId) => {
    const student = await prisma.student.findUnique({
        where: { userId },
        select: { enrollments: { select: { groupId: true } } },
    });
    const groupIds = (student?.enrollments || []).map(e => e.groupId);
    if (groupIds.length === 0) return [];
    const cgs = await prisma.courseGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { courseId: true },
    });
    return [...new Set(cgs.map(c => c.courseId))];
};

const canAccessCourse = async (user, courseId) => {
    if (isStaff(user)) return true;
    const ids = await studentCourseIds(user.id);
    return ids.includes(Number(courseId));
};

const canAccessModule = async (user, moduleId) => {
    if (isStaff(user)) return true;
    const mod = await prisma.module.findUnique({ where: { id: Number(moduleId) }, select: { courseId: true } });
    return !!mod && canAccessCourse(user, mod.courseId);
};

const canAccessChapter = async (user, chapterId) => {
    if (isStaff(user)) return true;
    const ch = await prisma.chapter.findUnique({ where: { id: Number(chapterId) }, select: { courseId: true } });
    return !!ch && canAccessCourse(user, ch.courseId);
};

// Pour un élève, retourne SON studentId (ignore ce que le client envoie).
// Pour le personnel, retourne l'id demandé.
const resolveStudentId = async (user, requestedId) => {
    if (isStaff(user)) return parseInt(requestedId);
    const s = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
    return s?.id ?? null;
};

module.exports = {
    isStaff, getStudentByUser, audienceOfStudent, getStudentAudience,
    studentCourseIds, canAccessCourse, canAccessModule, canAccessChapter, resolveStudentId,
};
