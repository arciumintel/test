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

export async function getQuizEngagementSummary(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<QuizEngagementSummary> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    select: { id: true },
  });
  if (!quiz) {
    return {
      averageDurationSeconds: null,
      withinTwoAttemptPassRate: null,
      withinTwoAttemptCount: 0,
      learnersAttempted: 0,
    };
  }

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { durationInSeconds: true },
  });

  const durations = attempts
    .map((attempt) => attempt.durationInSeconds)
    .filter((value): value is number => value != null && value > 0);
  const averageDurationSeconds =
    durations.length > 0
      ? Math.round(
          durations.reduce((sum, value) => sum + value, 0) / durations.length
        )
      : null;

  const attemptsBeforePass = await getAttemptsBeforePass(courseId, range);
  const withinTwo = summarizeWithinTwoAttempts(attemptsBeforePass);

  return {
    averageDurationSeconds,
    ...withinTwo,
  };
}

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
