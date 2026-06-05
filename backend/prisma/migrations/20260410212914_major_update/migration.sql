/*
  Warnings:

  - The `createdBy` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lockedByAdmin" BOOLEAN NOT NULL DEFAULT false;
