-- AlterEnum
ALTER TYPE "PaymentMode" ADD VALUE 'MONTHLY';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "courseDay" TEXT,
ADD COLUMN     "courseStartDate" TEXT,
ADD COLUMN     "parentSignature" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3);
