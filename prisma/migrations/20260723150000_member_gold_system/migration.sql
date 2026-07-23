-- CreateEnum
CREATE TYPE "GuestRole" AS ENUM ('MEMBER', 'GOLD_MEMBER');

-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('PENDING_STAFF_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReceiptSource" AS ENUM ('MANUAL_ADMIN', 'POS_IMPORT');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('CONFIRMED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ROLE_CHANGED', 'PHONE_VERIFIED', 'TABLE_SESSION_CONFIRMED', 'TABLE_SESSION_REJECTED', 'CASHBACK_REVERSED');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "role" "GuestRole" NOT NULL DEFAULT 'MEMBER',
  ADD COLUMN "goldSinceMonth" TEXT;

-- AlterTable
ALTER TABLE "Receipt"
  ADD COLUMN "source" "ReceiptSource" NOT NULL DEFAULT 'MANUAL_ADMIN',
  ADD COLUMN "status" "ReceiptStatus" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "posExternalId" TEXT,
  ADD COLUMN "tableSessionId" TEXT,
  ADD COLUMN "countsTowardGoldMonth" TEXT;

-- AlterTable
ALTER TABLE "BonusTransaction"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'ACCRUAL';

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "tableCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'PENDING_STAFF_CONFIRMATION',
    "posTableExternalId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmedByStaffId" TEXT,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramBotLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramBotLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_posExternalId_key" ON "Receipt"("posExternalId");

-- CreateIndex
CREATE INDEX "TableSession_tableCode_status_idx" ON "TableSession"("tableCode", "status");

-- CreateIndex
CREATE INDEX "TableSession_userId_idx" ON "TableSession"("userId");

-- CreateIndex: частичный уникальный индекс — не более одной активной (не CLOSED/REJECTED)
-- сессии на один и тот же tableCode одновременно (specs/002-member-gold-system, FR-017).
-- Prisma-схема такое ограничение не выражает, поэтому оно добавлено вручную.
CREATE UNIQUE INDEX "TableSession_tableCode_active_key" ON "TableSession"("tableCode")
  WHERE "status" IN ('PENDING_STAFF_CONFIRMATION', 'CONFIRMED');

-- CreateIndex
CREATE UNIQUE INDEX "TelegramBotLinkToken_tokenHash_key" ON "TelegramBotLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "TelegramBotLinkToken_userId_idx" ON "TelegramBotLinkToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_targetUserId_idx" ON "AuditLogEntry"("targetUserId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_action_idx" ON "AuditLogEntry"("action");

-- CreateIndex
CREATE UNIQUE INDEX "BonusTransaction_receiptId_type_key" ON "BonusTransaction"("receiptId", "type");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_confirmedByStaffId_fkey" FOREIGN KEY ("confirmedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramBotLinkToken" ADD CONSTRAINT "TelegramBotLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
