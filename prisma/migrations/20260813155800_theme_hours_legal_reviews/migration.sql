-- AlterTable
ALTER TABLE "SiteContent" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "cookiePolicyText" TEXT,
ADD COLUMN     "privacyPolicyText" TEXT,
ADD COLUMN     "telegramUrl" TEXT,
ADD COLUMN     "termsOfUseText" TEXT,
ADD COLUMN     "workingHoursByDay" JSONB;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "dishesRating" INTEGER NOT NULL,
    "serviceRating" INTEGER NOT NULL,
    "comment" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
