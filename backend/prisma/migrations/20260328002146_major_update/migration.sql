/*
  Warnings:

  - You are about to drop the column `groupId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `Task` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "AttStatut" ADD VALUE 'NON_COMMENCE';

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_groupId_fkey";

-- AlterTable
ALTER TABLE "Chapter" ALTER COLUMN "locked" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "groupId",
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "lockedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "qcmSoumis" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "statut" SET DEFAULT 'EN_ATTENTE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "devise" TEXT NOT NULL DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "groupId",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plainPassword" TEXT;

-- CreateTable
CREATE TABLE "CourseGroup" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "CourseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseGroup_courseId_groupId_key" ON "CourseGroup"("courseId", "groupId");

-- AddForeignKey
ALTER TABLE "CourseGroup" ADD CONSTRAINT "CourseGroup_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseGroup" ADD CONSTRAINT "CourseGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
