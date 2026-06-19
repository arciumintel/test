-- Partner self-serve application fields on PartnerIntake

ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "applicantUserId" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "projectName" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "projectDescription" TEXT;

CREATE INDEX IF NOT EXISTS "PartnerIntake_applicantUserId_idx" ON "PartnerIntake"("applicantUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerIntake_applicantUserId_fkey'
  ) THEN
    ALTER TABLE "PartnerIntake"
      ADD CONSTRAINT "PartnerIntake_applicantUserId_fkey"
      FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
