-- Product catalog presentation fields (featured, banner, learning outcomes)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "learningOutcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER;
