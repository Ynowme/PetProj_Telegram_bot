-- AlterTable
ALTER TABLE "PromoBanner" ADD COLUMN     "posExternalId" TEXT,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiteContent" ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "venueName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PromoBanner_posExternalId_key" ON "PromoBanner"("posExternalId");
