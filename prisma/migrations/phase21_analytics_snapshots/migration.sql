-- Phase 21: AnalyticsSnapshot for Phase 2 engine shell

DO $$ BEGIN
  CREATE TYPE "AnalyticsSnapshotStatus" AS ENUM ('fresh', 'building', 'queued', 'stale', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsSnapshotTrigger" AS ENUM ('hourly', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AnalyticsSnapshot" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "rangeKey" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "compareKey" TEXT NOT NULL DEFAULT 'none',
  "status" "AnalyticsSnapshotStatus" NOT NULL DEFAULT 'fresh',
  "trigger" "AnalyticsSnapshotTrigger" NOT NULL DEFAULT 'hourly',
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "builtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "errorMessage" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsSnapshot_productId_rangeKey_compareKey_key"
  ON "AnalyticsSnapshot"("productId", "rangeKey", "compareKey");
CREATE INDEX IF NOT EXISTS "AnalyticsSnapshot_productId_builtAt_idx"
  ON "AnalyticsSnapshot"("productId", "builtAt");
CREATE INDEX IF NOT EXISTS "AnalyticsSnapshot_status_idx"
  ON "AnalyticsSnapshot"("status");

ALTER TABLE "AnalyticsSnapshot"
  DROP CONSTRAINT IF EXISTS "AnalyticsSnapshot_productId_fkey";
ALTER TABLE "AnalyticsSnapshot"
  ADD CONSTRAINT "AnalyticsSnapshot_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
