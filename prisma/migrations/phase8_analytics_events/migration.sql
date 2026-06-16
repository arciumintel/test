-- Phase 8: additive analytics event storage
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "anonymousId" TEXT,
  "userId" TEXT,
  "walletAddress" TEXT,
  "sessionId" TEXT,
  "source" TEXT NOT NULL,
  "path" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "ecosystemProjectId" TEXT,
  "ecosystemProjectSlug" TEXT,
  "courseId" TEXT,
  "courseSlug" TEXT,
  "lessonId" TEXT,
  "quizId" TEXT,
  "badgeId" TEXT,
  "badgeAwardId" TEXT,
  "verificationSlug" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_courseId_idx" ON "AnalyticsEvent"("courseId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_ecosystemProjectId_idx" ON "AnalyticsEvent"("ecosystemProjectId");
