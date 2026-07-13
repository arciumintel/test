-- Phase 24: Analytics read-path indexes + anonymous benchmark rollup table

CREATE TABLE IF NOT EXISTS "EcosystemBenchmarkRollup" (
  "id" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "p25" DOUBLE PRECISION,
  "p50" DOUBLE PRECISION,
  "p75" DOUBLE PRECISION,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EcosystemBenchmarkRollup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EcosystemBenchmarkRollup_metricId_periodKey_key"
  ON "EcosystemBenchmarkRollup"("metricId", "periodKey");
CREATE INDEX IF NOT EXISTS "EcosystemBenchmarkRollup_metricId_computedAt_idx"
  ON "EcosystemBenchmarkRollup"("metricId", "computedAt");

CREATE INDEX IF NOT EXISTS "ContentConceptTag_conceptId_questionId_idx"
  ON "ContentConceptTag"("conceptId", "questionId");
CREATE INDEX IF NOT EXISTS "ContentConceptTag_conceptId_lessonId_idx"
  ON "ContentConceptTag"("conceptId", "lessonId");

CREATE INDEX IF NOT EXISTS "QuestionAttempt_questionId_submittedAt_correct_idx"
  ON "QuestionAttempt"("questionId", "submittedAt", "correct");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_ecosystemProjectId_userId_eventName_idx"
  ON "AnalyticsEvent"("ecosystemProjectId", "userId", "eventName");

CREATE INDEX IF NOT EXISTS "Progress_courseId_createdAt_idx"
  ON "Progress"("courseId", "createdAt");

CREATE INDEX IF NOT EXISTS "BadgeAward_courseId_awardedAt_idx"
  ON "BadgeAward"("courseId", "awardedAt");

CREATE INDEX IF NOT EXISTS "CertificationAward_certificationId_awardedAt_idx"
  ON "CertificationAward"("certificationId", "awardedAt");
