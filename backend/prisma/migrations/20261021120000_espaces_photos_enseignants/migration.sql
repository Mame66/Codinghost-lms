-- ════════════════════════════════════════════════════════════════════
-- Migration « tolérante » : elle peut être appliquée sur une base où
-- certaines colonnes/tables existent déjà (ajoutées via `prisma db push`).
-- Chaque instruction vérifie l'existence avant de créer.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Rattrapage : éléments présents dans schema.prisma mais absents des migrations ──

-- Course.coverImage
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;

-- Chapter : contenu des leçons
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "objectives" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "teacherGuideUrl" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "studentSlidesUrl" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "challengeContent" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "challengeLang" TEXT DEFAULT 'python';

-- QcmQuestion.chapterId (quiz des leçons)
ALTER TABLE "QcmQuestion" ADD COLUMN IF NOT EXISTS "chapterId" INTEGER;
ALTER TABLE "QcmQuestion" DROP CONSTRAINT IF EXISTS "QcmQuestion_chapterId_fkey";
ALTER TABLE "QcmQuestion" ADD CONSTRAINT "QcmQuestion_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LessonProgress
CREATE TABLE IF NOT EXISTS "LessonProgress" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "objectivesDone" BOOLEAN NOT NULL DEFAULT false,
    "slidesDone" BOOLEAN NOT NULL DEFAULT false,
    "imagesDone" BOOLEAN NOT NULL DEFAULT false,
    "challengeDone" BOOLEAN NOT NULL DEFAULT false,
    "quizSoumis" BOOLEAN NOT NULL DEFAULT false,
    "quizAnswers" JSONB,
    "quizScore" DOUBLE PRECISION,
    "quizCorrect" INTEGER,
    "quizTotal" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LessonProgress_studentId_chapterId_key"
    ON "LessonProgress"("studentId", "chapterId");
ALTER TABLE "LessonProgress" DROP CONSTRAINT IF EXISTS "LessonProgress_studentId_fkey";
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" DROP CONSTRAINT IF EXISTS "LessonProgress_chapterId_fkey";
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 2. Public Enfants / Adultes ──
DO $$ BEGIN
    CREATE TYPE "Audience" AS ENUM ('ENFANT', 'ADULTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Group"  ADD COLUMN IF NOT EXISTS "audience" "Audience" NOT NULL DEFAULT 'ENFANT';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "audience" "Audience" NOT NULL DEFAULT 'ENFANT';

-- ── 3. Photo de profil + infos enseignants ──
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telephone"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialites" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "actif"       BOOLEAN NOT NULL DEFAULT true;

-- ── 4. Quiz de leçon : taskId devient optionnel (supprime le « taskId: 1 » forcé) ──
ALTER TABLE "QcmQuestion" ALTER COLUMN "taskId" DROP NOT NULL;
ALTER TABLE "QcmQuestion" DROP CONSTRAINT IF EXISTS "QcmQuestion_taskId_fkey";
ALTER TABLE "QcmQuestion" ADD CONSTRAINT "QcmQuestion_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 5. Suppressions en cascade (évite les erreurs 500 à la suppression) ──
ALTER TABLE "CourseGroup" DROP CONSTRAINT IF EXISTS "CourseGroup_courseId_fkey";
ALTER TABLE "CourseGroup" ADD CONSTRAINT "CourseGroup_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseGroup" DROP CONSTRAINT IF EXISTS "CourseGroup_groupId_fkey";
ALTER TABLE "CourseGroup" ADD CONSTRAINT "CourseGroup_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_studentId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_groupId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_enrollmentId_fkey";
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeworkFile" DROP CONSTRAINT IF EXISTS "HomeworkFile_homeworkId_fkey";
ALTER TABLE "HomeworkFile" ADD CONSTRAINT "HomeworkFile_homeworkId_fkey"
    FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 6. Journal des webhooks SumUp (le code l'utilisait mais la table n'existait pas → 500) ──
CREATE TABLE IF NOT EXISTS "SumupWebhook" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reference" TEXT,
    "status" TEXT NOT NULL,
    "rawData" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SumupWebhook_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SumupWebhook_eventId_key" ON "SumupWebhook"("eventId");
