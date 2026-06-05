/*
  Warnings:

  - You are about to drop the column `courseId` on the `Group` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('NOTE', 'DEVOIR', 'INFO');

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "groupId" INTEGER;

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "courseId";

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "fichierUrl" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
