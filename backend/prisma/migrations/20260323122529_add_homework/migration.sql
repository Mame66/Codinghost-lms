-- CreateEnum
CREATE TYPE "HomeworkStatut" AS ENUM ('RENDU', 'CORRIGE', 'EN_ATTENTE');

-- CreateTable
CREATE TABLE "Homework" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "contenu" TEXT,
    "note" DOUBLE PRECISION,
    "commentaire" TEXT,
    "statut" "HomeworkStatut" NOT NULL DEFAULT 'RENDU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
