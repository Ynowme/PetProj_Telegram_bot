-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "MenuItem_name_idx" ON "MenuItem" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "MenuItem_description_idx" ON "MenuItem" USING GIN ("description" gin_trgm_ops);