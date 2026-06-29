import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";

export type QuizQuestionDiagnostic = {
  questionId: string;
  order: number;
  prompt: string;
  attemptCount: number;
  missRate: number;
  optionDistribution: { label: string; count: number; percent: number }[];
};

export type AttemptsBeforePassBucket = {
  label: string;
  count: number;
};

export async function getQuizDiagnostics(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<QuizQuestionDiagnostic[]> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!quiz || quiz.questions.length === 0) return [];

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { answers: true },
  });

  if (attempts.length === 0) return [];

  return quiz.questions.map((q, qi) => {
    const optionCounts = q.answerOptions.map(() => 0);
    let misses = 0;
    let answered = 0;

    for (const attempt of attempts) {
      const raw = attempt.answers;
      if (!Array.isArray(raw) || raw.length <= qi) continue;
      const selected = raw[qi];
      if (typeof selected !== "number") continue;
      answered += 1;
      if (selected >= 0 && selected < optionCounts.length) {
        optionCounts[selected] += 1;
      }
      if (selected !== q.correctAnswer) misses += 1;
    }

    return {
      questionId: q.id,
      order: q.order,
      prompt: q.prompt,
      attemptCount: answered,
      missRate: answered > 0 ? Math.round((misses / answered) * 100) : 0,
      optionDistribution: q.answerOptions.map((label, oi) => ({
        label,
        count: optionCounts[oi],
        percent:
          answered > 0 ? Math.round((optionCounts[oi] / answered) * 100) : 0,
      })),
    };
  });
}

export async function getAttemptsBeforePass(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<AttemptsBeforePassBucket[]> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    select: { id: true },
  });
  if (!quiz) return [];

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { userId: true, passed: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
  });

  const byUser = new Map<string, boolean[]>();
  for (const a of attempts) {
    const list = byUser.get(a.userId) ?? [];
    list.push(a.passed);
    byUser.set(a.userId, list);
  }

  let pass1 = 0;
  let pass2 = 0;
  let pass3plus = 0;
  let neverPassed = 0;

  for (const tries of byUser.values()) {
    const firstPass = tries.findIndex((p) => p);
    if (firstPass === -1) {
      neverPassed += 1;
    } else if (firstPass === 0) {
      pass1 += 1;
    } else if (firstPass === 1) {
      pass2 += 1;
    } else {
      pass3plus += 1;
    }
  }

  return [
    { label: "Passed on attempt 1", count: pass1 },
    { label: "Passed on attempt 2", count: pass2 },
    { label: "Passed on attempt 3+", count: pass3plus },
    { label: "Never passed", count: neverPassed },
  ];
}
