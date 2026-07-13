-- Phase 23: Certification entities (distinct from Badge / BadgeAward)

DO $$ BEGIN
  CREATE TYPE "CertificationStatus" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CertificationRequirementType" AS ENUM (
    'course_completion',
    'quiz_pass',
    'readiness_score',
    'learning_path_completion',
    'conversion_event',
    'concept_mastery'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Certification" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "status" "CertificationStatus" NOT NULL DEFAULT 'draft',
  "readyThreshold" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Certification_productId_slug_key"
  ON "Certification"("productId", "slug");
CREATE INDEX IF NOT EXISTS "Certification_productId_idx" ON "Certification"("productId");
CREATE INDEX IF NOT EXISTS "Certification_status_idx" ON "Certification"("status");

CREATE TABLE IF NOT EXISTS "CertificationRequirement" (
  "id" TEXT NOT NULL,
  "certificationId" TEXT NOT NULL,
  "type" "CertificationRequirementType" NOT NULL,
  "label" TEXT,
  "config" JSONB NOT NULL DEFAULT '{}',
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificationRequirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CertificationRequirement_certificationId_idx"
  ON "CertificationRequirement"("certificationId");

CREATE TABLE IF NOT EXISTS "CertificationAward" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "certificationId" TEXT NOT NULL,
  "readinessScoreAtAward" DOUBLE PRECISION,
  "verificationSlug" TEXT,
  "metadata" JSONB,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificationAward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CertificationAward_userId_certificationId_key"
  ON "CertificationAward"("userId", "certificationId");
CREATE UNIQUE INDEX IF NOT EXISTS "CertificationAward_verificationSlug_key"
  ON "CertificationAward"("verificationSlug");
CREATE INDEX IF NOT EXISTS "CertificationAward_userId_idx" ON "CertificationAward"("userId");
CREATE INDEX IF NOT EXISTS "CertificationAward_certificationId_idx" ON "CertificationAward"("certificationId");
CREATE INDEX IF NOT EXISTS "CertificationAward_awardedAt_idx" ON "CertificationAward"("awardedAt");

ALTER TABLE "Certification"
  DROP CONSTRAINT IF EXISTS "Certification_productId_fkey";
ALTER TABLE "Certification"
  ADD CONSTRAINT "Certification_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CertificationRequirement"
  DROP CONSTRAINT IF EXISTS "CertificationRequirement_certificationId_fkey";
ALTER TABLE "CertificationRequirement"
  ADD CONSTRAINT "CertificationRequirement_certificationId_fkey"
  FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CertificationAward"
  DROP CONSTRAINT IF EXISTS "CertificationAward_userId_fkey";
ALTER TABLE "CertificationAward"
  ADD CONSTRAINT "CertificationAward_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CertificationAward"
  DROP CONSTRAINT IF EXISTS "CertificationAward_certificationId_fkey";
ALTER TABLE "CertificationAward"
  ADD CONSTRAINT "CertificationAward_certificationId_fkey"
  FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
