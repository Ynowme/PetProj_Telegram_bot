-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'BOT_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'BOT_UNLINKED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "telegramBotLinkedAt" TIMESTAMP(3);
