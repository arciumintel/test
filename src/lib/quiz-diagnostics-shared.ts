import type { QuestionType } from "@prisma/client";

export type QuizQuestionDiagnostic = {
  questionId: string;
  order: number;
  prompt: string;
  type: QuestionType;
  typeLabel: string;
  attemptCount: number;
  missRate: number;
  optionDistribution?: { label: string; count: number; percent: number }[];
  pairMissRates?: { left: string; missRate: number; attemptCount: number }[];
  positionAccuracy?: { label: string; correctPercent: number }[];
  commonWrongAnswers?: { answer: string; count: number; percent: number }[];
};

export type AttemptsBeforePassBucket = {
  label: string;
  count: number;
};

export type QuizEngagementSummary = {
  averageDurationSeconds: number | null;
  withinTwoAttemptPassRate: number | null;
  withinTwoAttemptCount: number;
  learnersAttempted: number;
};

export function formatQuizDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "n/a";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function summarizeWithinTwoAttempts(
  buckets: AttemptsBeforePassBucket[]
): Pick<
  QuizEngagementSummary,
  "withinTwoAttemptPassRate" | "withinTwoAttemptCount" | "learnersAttempted"
> {
  const pass1 = buckets.find((b) => b.label === "Passed on attempt 1")?.count ?? 0;
  const pass2 = buckets.find((b) => b.label === "Passed on attempt 2")?.count ?? 0;
  const pass3plus =
    buckets.find((b) => b.label === "Passed on attempt 3+")?.count ?? 0;
  const neverPassed = buckets.find((b) => b.label === "Never passed")?.count ?? 0;
  const learnersAttempted = pass1 + pass2 + pass3plus + neverPassed;
  const withinTwoAttemptCount = pass1 + pass2;

  return {
    withinTwoAttemptPassRate:
      learnersAttempted > 0
        ? Math.round((withinTwoAttemptCount / learnersAttempted) * 100)
        : null,
    withinTwoAttemptCount,
    learnersAttempted,
  };
}
