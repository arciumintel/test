/**
 * QuestionAttempt write helpers — dual-write with QuizAttempt.answers JSON.
 */

import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { QuizSubmissionAnswer } from "@/lib/question-types";

export type QuestionAttemptWriteInput = {
  userId: string;
  quizAttemptId: string;
  questionId: string;
  correct: boolean;
  answer: QuizSubmissionAnswer;
  submittedAt?: Date;
  durationMs?: number | null;
  hintUsed?: boolean;
};

function answerPayload(
  answer: QuizSubmissionAnswer
): Prisma.InputJsonValue {
  return answer as unknown as Prisma.InputJsonValue;
}

/** Insert normalized rows for a quiz attempt (idempotent per quizAttemptId+questionId). */
export async function createQuestionAttemptsForQuizAttempt(
  rows: QuestionAttemptWriteInput[]
): Promise<number> {
  if (rows.length === 0) return 0;

  const result = await prisma.questionAttempt.createMany({
    data: rows.map((row) => ({
      userId: row.userId,
      quizAttemptId: row.quizAttemptId,
      questionId: row.questionId,
      correct: row.correct,
      answerPayload: answerPayload(row.answer),
      durationMs: row.durationMs ?? null,
      hintUsed: row.hintUsed ?? false,
      submittedAt: row.submittedAt ?? new Date(),
    })),
    skipDuplicates: true,
  });

  return result.count;
}
