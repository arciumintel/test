-- Phase 7: Partner-Assisted Workflow
-- Additive PartnerIntake model for internal staff tracking.

DO $$ BEGIN
  CREATE TYPE "PartnerIntakeReviewStatus" AS ENUM (
    'received',
    'in_review',
    'draft_created',
    'partner_review',
    'approved',
    'published'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PartnerIntake" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "partnerName" TEXT NOT NULL,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "sourceMaterialUrl" TEXT,
  "requestedCourseTopic" TEXT,
  "reviewStatus" "PartnerIntakeReviewStatus" NOT NULL DEFAULT 'received',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerIntake_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnerIntake_productId_idx" ON "PartnerIntake"("productId");
CREATE INDEX IF NOT EXISTS "PartnerIntake_reviewStatus_idx" ON "PartnerIntake"("reviewStatus");

DO $$ BEGIN
  ALTER TABLE "PartnerIntake"
    ADD CONSTRAINT "PartnerIntake_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
