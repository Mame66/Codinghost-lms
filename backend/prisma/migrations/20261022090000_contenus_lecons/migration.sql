-- Contenus de leçon : fichiers / liens, devoir à rendre, progression « documents »
-- Migration tolérante : ne crée que ce qui n'existe pas encore.

-- ── Chapter : devoir à rendre (optionnel) ────────────────────
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "homeworkEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "homeworkInstructions" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "homeworkDueDate" TIMESTAMP(3);

-- ── LessonProgress : documents consultés ─────────────────────
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "filesDone" BOOLEAN NOT NULL DEFAULT false;

-- ── LessonResource ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LessonResource" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FILE',
    "titre" TEXT NOT NULL,
    "url" TEXT,
    "storagePath" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'STUDENT',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LessonResource_chapterId_idx" ON "LessonResource"("chapterId");

DO $$ BEGIN
    ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_chapterId_fkey"
        FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── LessonSubmission ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LessonSubmission" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "storagePath" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "lienRendu" TEXT,
    "commentaireEleve" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'RENDU',
    "note" DOUBLE PRECISION,
    "commentaire" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LessonSubmission_studentId_chapterId_key" ON "LessonSubmission"("studentId", "chapterId");

DO $$ BEGIN
    ALTER TABLE "LessonSubmission" ADD CONSTRAINT "LessonSubmission_chapterId_fkey"
        FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "LessonSubmission" ADD CONSTRAINT "LessonSubmission_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
