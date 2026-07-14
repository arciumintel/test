-- Phase 25: Partner intake contact channels and official project links.

DO $$ BEGIN
  CREATE TYPE "PartnerPreferredContactMethod" AS ENUM ('email', 'x', 'discord', 'telegram');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "contactX" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "contactDiscord" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "contactTelegram" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "preferredContactMethod" "PartnerPreferredContactMethod";

ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "officialWebsite" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "officialX" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "officialDiscord" TEXT;
ALTER TABLE "PartnerIntake" ADD COLUMN IF NOT EXISTS "officialTelegram" TEXT;
