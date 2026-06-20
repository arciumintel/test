-- Partner analytics notes (staff-written narrative for partner reports)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "partnerAnalyticsNotes" TEXT;

-- Faster event queries for partner analytics dashboards
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_ecosystemProjectId_eventName_occurredAt_idx"
  ON "AnalyticsEvent"("ecosystemProjectId", "eventName", "occurredAt");
