-- Phase 1: Data Model and Terminology Alignment
--
-- Additive, non-destructive changes that bring the schema to PRD parity.
-- This migration is idempotent and safe to replay against the already-pushed
-- development database as well as an empty shadow database.

-- New enums --------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "CourseType" AS ENUM ('foundational', 'product_onboarding', 'builder_intro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuizType" AS ENUM ('final_course_quiz');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuizStatus" AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BadgeStatus" AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Product (Ecosystem Project) --------------------------------------------

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "partnerName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "referralUrl" TEXT;

-- Course -----------------------------------------------------------------

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "courseType" "CourseType" NOT NULL DEFAULT 'foundational';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "prerequisiteCourseIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Lesson -----------------------------------------------------------------

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "estimatedDuration" INTEGER;

-- Quiz -------------------------------------------------------------------

ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "type" "QuizType" NOT NULL DEFAULT 'final_course_quiz';
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "status" "QuizStatus" NOT NULL DEFAULT 'published';

-- Badge ------------------------------------------------------------------

ALTER TABLE "Badge" ADD COLUMN IF NOT EXISTS "criteria" TEXT;
ALTER TABLE "Badge" ADD COLUMN IF NOT EXISTS "issuer" TEXT;
ALTER TABLE "Badge" ADD COLUMN IF NOT EXISTS "status" "BadgeStatus" NOT NULL DEFAULT 'published';

-- BadgeAward -------------------------------------------------------------

ALTER TABLE "BadgeAward" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
ALTER TABLE "BadgeAward" ADD COLUMN IF NOT EXISTS "verificationSlug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "BadgeAward_verificationSlug_key" ON "BadgeAward"("verificationSlug");
