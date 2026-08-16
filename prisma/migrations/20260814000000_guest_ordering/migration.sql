-- CreateEnum
CREATE TYPE "GuestOrderRequestStatus" AS ENUM ('PENDING', 'IMPORTED', 'REJECTED');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "kind" TEXT;

-- AlterTable
ALTER TABLE "SiteContent" ADD COLUMN     "guestOrderingEnabled" BOOLEAN;

-- CreateTable
CREATE TABLE "GuestOrderRequest" (
    "id" TEXT NOT NULL,
    "tableSessionId" TEXT NOT NULL,
    "status" "GuestOrderRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "GuestOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestOrderRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "GuestOrderRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestOrderRequest_tableSessionId_status_idx" ON "GuestOrderRequest"("tableSessionId", "status");

-- CreateIndex
CREATE INDEX "GuestOrderRequestItem_requestId_idx" ON "GuestOrderRequestItem"("requestId");

-- AddForeignKey
ALTER TABLE "GuestOrderRequest" ADD CONSTRAINT "GuestOrderRequest_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestOrderRequestItem" ADD CONSTRAINT "GuestOrderRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GuestOrderRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestOrderRequestItem" ADD CONSTRAINT "GuestOrderRequestItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
