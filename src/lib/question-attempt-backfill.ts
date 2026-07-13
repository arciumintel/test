/**
 * Gate Concepts/Assessments on QuestionAttempt backfill health.
 */

import "server-only";

import { prisma } from "@/lib/prisma";

const COVERAGE_RATIO = 0.95;

export type QuestionAttemptBackfillStatus = {
  complete: boolean;
  quizAttemptCount: number;
  attemptsWithRows: number;
  questionAttemptCount: number;
  coverageRatio: number;
  message: string;
};

export async function getQuestionAttemptBackfillStatus(): Promise<QuestionAttemptBackfillStatus> {
  const [quizAttemptCount, attemptsWithRows, questionAttemptCount] =
    await Promise.all([
      prisma.quizAttempt.count(),
      prisma.quizAttempt.count({
        where: { questionAttempts: { some: {} } },
      }),
      prisma.questionAttempt.count(),
    ]);

  if (quizAttemptCount === 0) {
    return {
      complete: true,
      quizAttemptCount,
      attemptsWithRows,
      questionAttemptCount,
      coverageRatio: 1,
      message:
        "No quiz attempts yet — normalized QuestionAttempt writes are active for new submissions.",
    };
  }

  const coverageRatio = attemptsWithRows / quizAttemptCount;
  const complete = coverageRatio >= COVERAGE_RATIO;

  return {
    complete,
    quizAttemptCount,
    attemptsWithRows,
    questionAttemptCount,
    coverageRatio,
    message: complete
      ? `QuestionAttempt backfill ready (${Math.round(coverageRatio * 100)}% of attempts normalized).`
      : `QuestionAttempt backfill incomplete (${Math.round(coverageRatio * 100)}% of attempts). Run: pnpm exec tsx scripts/backfill-question-attempts.ts`,
  };
}

export async function isQuestionAttemptBackfillComplete(): Promise<boolean> {
  const status = await getQuestionAttemptBackfillStatus();
  return status.complete;
}
