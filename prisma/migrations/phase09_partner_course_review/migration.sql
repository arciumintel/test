-- Phase 9: Partner course authoring + staff review workflow

ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'partner_draft';
ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'submitted_for_review';
ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'staff_changes_requested';
ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'approved';

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "submittedForReviewAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "staffReviewNotes" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "reviewRequestedByUserId" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "reviewedByUserId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Course"
    ADD CONSTRAINT "Course_reviewRequestedByUserId_fkey"
    FOREIGN KEY ("reviewRequestedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Course"
    ADD CONSTRAINT "Course_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
