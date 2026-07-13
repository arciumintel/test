-- Phase 22: QuestionAttempt normalized answer rows

CREATE TABLE IF NOT EXISTS "QuestionAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quizAttemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "answerPayload" JSONB NOT NULL,
  "durationMs" INTEGER,
  "hintUsed" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionAttempt_quizAttemptId_questionId_key"
  ON "QuestionAttempt"("quizAttemptId", "questionId");
CREATE INDEX IF NOT EXISTS "QuestionAttempt_questionId_submittedAt_idx"
  ON "QuestionAttempt"("questionId", "submittedAt");
CREATE INDEX IF NOT EXISTS "QuestionAttempt_userId_submittedAt_idx"
  ON "QuestionAttempt"("userId", "submittedAt");
CREATE INDEX IF NOT EXISTS "QuestionAttempt_submittedAt_idx"
  ON "QuestionAttempt"("submittedAt");

ALTER TABLE "QuestionAttempt"
  DROP CONSTRAINT IF EXISTS "QuestionAttempt_userId_fkey";
ALTER TABLE "QuestionAttempt"
  ADD CONSTRAINT "QuestionAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionAttempt"
  DROP CONSTRAINT IF EXISTS "QuestionAttempt_quizAttemptId_fkey";
ALTER TABLE "QuestionAttempt"
  ADD CONSTRAINT "QuestionAttempt_quizAttemptId_fkey"
  FOREIGN KEY ("quizAttemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionAttempt"
  DROP CONSTRAINT IF EXISTS "QuestionAttempt_questionId_fkey";
ALTER TABLE "QuestionAttempt"
  ADD CONSTRAINT "QuestionAttempt_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
