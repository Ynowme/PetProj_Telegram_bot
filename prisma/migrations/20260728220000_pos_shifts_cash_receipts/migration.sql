-- CreateEnum
CREATE TYPE "ReceiptPaymentType" AS ENUM ('CASH', 'CARD');

-- CreateEnum
CREATE TYPE "PosShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PosCashTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'EXPENSE');

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN "paymentType" "ReceiptPaymentType" NOT NULL DEFAULT 'CASH';

-- CreateTable
CREATE TABLE "PosShift" (
    "id" TEXT NOT NULL,
    "status" "PosShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedByName" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingCash" DECIMAL(10,2) NOT NULL,
    "closedByName" TEXT,
    "closedAt" TIMESTAMP(3),
    "closingCash" DECIMAL(10,2),

    CONSTRAINT "PosShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosCashTransaction" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "PosCashTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosCashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosReceiptGroup" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "paymentType" "ReceiptPaymentType" NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "posExternalId" TEXT NOT NULL,
    "receiptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosReceiptGroup_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PosOrder" ADD COLUMN "shiftId" TEXT;

-- AlterTable
ALTER TABLE "PosOrderItem" ADD COLUMN "receiptGroupId" TEXT;

-- CreateIndex
CREATE INDEX "PosShift_status_idx" ON "PosShift"("status");

-- CreateIndex: тільки одна відкрита зміна одночасно (частковий унікальний індекс, як для TableSession)
CREATE UNIQUE INDEX "PosShift_single_open_key" ON "PosShift" ("status") WHERE "status" = 'OPEN';

-- CreateIndex
CREATE INDEX "PosCashTransaction_shiftId_idx" ON "PosCashTransaction"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "PosReceiptGroup_posExternalId_key" ON "PosReceiptGroup"("posExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "PosReceiptGroup_receiptId_key" ON "PosReceiptGroup"("receiptId");

-- CreateIndex
CREATE INDEX "PosReceiptGroup_orderId_idx" ON "PosReceiptGroup"("orderId");

-- CreateIndex
CREATE INDEX "PosReceiptGroup_shiftId_idx" ON "PosReceiptGroup"("shiftId");

-- CreateIndex
CREATE INDEX "PosOrder_shiftId_idx" ON "PosOrder"("shiftId");

-- CreateIndex
CREATE INDEX "PosOrderItem_receiptGroupId_idx" ON "PosOrderItem"("receiptGroupId");

-- AddForeignKey
ALTER TABLE "PosCashTransaction" ADD CONSTRAINT "PosCashTransaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "PosShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosReceiptGroup" ADD CONSTRAINT "PosReceiptGroup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PosOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosReceiptGroup" ADD CONSTRAINT "PosReceiptGroup_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "PosShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrder" ADD CONSTRAINT "PosOrder_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "PosShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosOrderItem" ADD CONSTRAINT "PosOrderItem_receiptGroupId_fkey" FOREIGN KEY ("receiptGroupId") REFERENCES "PosReceiptGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
