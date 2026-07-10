-- Phase 18: optional quiz attempt duration for engagement analytics
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "durationInSeconds" INTEGER;
