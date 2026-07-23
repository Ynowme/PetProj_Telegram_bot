-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BonusSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "BonusSettings_pkey" PRIMARY KEY ("id")
);
