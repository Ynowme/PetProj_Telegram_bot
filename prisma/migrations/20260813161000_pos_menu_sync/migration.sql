-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "posExternalId" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "posExternalId" TEXT,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "photoUrl" DROP NOT NULL,
ALTER COLUMN "volume" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_posExternalId_key" ON "MenuCategory"("posExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_posExternalId_key" ON "MenuItem"("posExternalId");
