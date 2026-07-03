-- Foundation vs ecosystem product roles (idempotent)
DO $$ BEGIN
  CREATE TYPE "ProductRole" AS ENUM ('foundation', 'ecosystem');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "role" "ProductRole" NOT NULL DEFAULT 'ecosystem';

-- Arcium is the V1 foundation product
UPDATE "Product" SET "role" = 'foundation' WHERE "slug" = 'arcium';
UPDATE "Product" SET "featured" = false, "featuredOrder" = NULL WHERE "slug" = 'arcium';
