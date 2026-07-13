/**
 * QuestionAttempt backfill from QuizAttempt.answers JSON.
 *
 * Run: pnpm exec tsx scripts/backfill-question-attempts.ts
 *
 * Concepts/Assessments analytics gate on isQuestionAttemptBackfillComplete().
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  gradeQuestion,
  type QuizSubmissionAnswer,
} from "../src/lib/question-types";

function getConnectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ""
  );
}

function parseAnswer(
  answers: unknown,
  index: number
): QuizSubmissionAnswer | null {
  if (!Array.isArray(answers) || answers.length <= index) return null;
  const value = answers[index];
  if (
    typeof value === "number" ||
    typeof value === "string" ||
    Array.isArray(value)
  ) {
    return value as QuizSubmissionAnswer;
  }
  return null;
}

async function main() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error("DATABASE_URL (or POSTGRES_*) is required.");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const batchSize = 100;
  let cursor: string | undefined;
  let processedAttempts = 0;
  let createdRows = 0;
  let skippedAttempts = 0;

  for (;;) {
    const attempts = await prisma.quizAttempt.findMany({
      take: batchSize,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      orderBy: { id: "asc" },
      include: {
        quiz: {
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        },
        questionAttempts: { select: { id: true }, take: 1 },
      },
    });

    if (attempts.length === 0) break;
    cursor = attempts[attempts.length - 1].id;

    for (const attempt of attempts) {
      processedAttempts += 1;
      if (attempt.questionAttempts.length > 0) {
        skippedAttempts += 1;
        continue;
      }

      const questions = attempt.quiz.questions;
      if (questions.length === 0) {
        skippedAttempts += 1;
        continue;
      }

      const perQuestionMs =
        attempt.durationInSeconds != null && questions.length > 0
          ? Math.round((attempt.durationInSeconds * 1000) / questions.length)
          : null;

      const rows = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const selected = parseAnswer(attempt.answers, i);
        if (selected === null) continue;
        const graded = gradeQuestion(q, selected);
        rows.push({
          userId: attempt.userId,
          quizAttemptId: attempt.id,
          questionId: q.id,
          correct: graded.correct,
          answerPayload: selected as object,
          durationMs: perQuestionMs,
          hintUsed: false,
          submittedAt: attempt.submittedAt,
        });
      }

      if (rows.length === 0) {
        skippedAttempts += 1;
        continue;
      }

      const result = await prisma.questionAttempt.createMany({
        data: rows,
        skipDuplicates: true,
      });
      createdRows += result.count;
    }

    console.log(
      `Processed ${processedAttempts} attempts; created ${createdRows} question rows…`
    );
  }

  const quizAttemptCount = await prisma.quizAttempt.count();
  const withRows = await prisma.quizAttempt.count({
    where: { questionAttempts: { some: {} } },
  });

  console.log("\nBackfill complete.");
  console.log(`QuizAttempts: ${quizAttemptCount}`);
  console.log(`QuizAttempts with QuestionAttempt rows: ${withRows}`);
  console.log(`QuestionAttempt rows created this run: ${createdRows}`);
  console.log(`Skipped (already filled / empty): ${skippedAttempts}`);

  if (quizAttemptCount > 0 && withRows < quizAttemptCount) {
    const missing = quizAttemptCount - withRows;
    console.warn(
      `Warning: ${missing} attempts still lack rows (likely empty answers JSON).`
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
