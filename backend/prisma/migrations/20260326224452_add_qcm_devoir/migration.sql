/*
  Warnings:

  - The values [EXERCISE] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('SLIDE', 'QCM', 'DEVOIR');
ALTER TABLE "Task" ALTER COLUMN "type" TYPE "TaskType_new" USING ("type"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "TaskType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "lienRendu" TEXT,
ADD COLUMN     "qcmAnswers" JSONB;

-- CreateTable
CREATE TABLE "QcmQuestion" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QcmQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkFile" (
    "id" SERIAL NOT NULL,
    "homeworkId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeworkFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QcmQuestion" ADD CONSTRAINT "QcmQuestion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkFile" ADD CONSTRAINT "HomeworkFile_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
