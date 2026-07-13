/**
 * Question intelligence / quiz quality from normalized QuestionAttempt rows.
 */

import "server-only";

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

export type QuestionIntelligenceRow = {
  questionId: string;
  prompt: string;
  type: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  attemptCount: number;
  correctCount: number;
  missRatePct: number | null;
  avgDurationMs: number | null;
  /** Point-biserial-ish: mean quiz score when correct minus when incorrect. */
  discriminationProxy: number | null;
  conceptNames: string[];
  conceptLinks: Array<{ conceptId: string; name: string }>;
  answerOptions: string[];
};

export type QuestionOptionDistribution = {
  label: string;
  count: number;
  sharePct: number;
};

export type QuestionDrilldown = QuestionIntelligenceRow & {
  optionDistribution: QuestionOptionDistribution[];
  hintUsedCount: number;
  hintUsedRatePct: number | null;
};

function submittedAtFilter(range: AnalyticsDateRange) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    lte: range.to,
  };
}

function parseSelectionIndex(payload: unknown): number | null {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return Math.trunc(payload);
  }
  if (typeof payload === "string" && /^\d+$/.test(payload.trim())) {
    return Number.parseInt(payload.trim(), 10);
  }
  return null;
}

export async function getQuestionIntelligenceRows(
  productId: string,
  range: AnalyticsDateRange,
  options?: { minAttempts?: number; limit?: number }
): Promise<QuestionIntelligenceRow[]> {
  const minAttempts = options?.minAttempts ?? 1;
  const limit = options?.limit ?? 100;

  const questions = await prisma.question.findMany({
    where: { quiz: { course: { productId } } },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, title: true } },
        },
      },
      conceptTags: {
        include: { concept: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ quiz: { title: "asc" } }, { order: "asc" }],
  });

  if (questions.length === 0) return [];

  const questionIds = questions.map((q) => q.id);

  const attempts = await prisma.questionAttempt.findMany({
    where: {
      questionId: { in: questionIds },
      submittedAt: submittedAtFilter(range),
    },
    select: {
      questionId: true,
      correct: true,
      durationMs: true,
      quizAttempt: { select: { score: true } },
    },
  });

  type Agg = {
    total: number;
    correct: number;
    durationSum: number;
    durationN: number;
    scoresWhenCorrect: number[];
    scoresWhenIncorrect: number[];
  };

  const byQuestion = new Map<string, Agg>();
  for (const a of attempts) {
    const cur = byQuestion.get(a.questionId) ?? {
      total: 0,
      correct: 0,
      durationSum: 0,
      durationN: 0,
      scoresWhenCorrect: [],
      scoresWhenIncorrect: [],
    };
    cur.total += 1;
    if (a.correct) {
      cur.correct += 1;
      cur.scoresWhenCorrect.push(a.quizAttempt.score);
    } else {
      cur.scoresWhenIncorrect.push(a.quizAttempt.score);
    }
    if (a.durationMs != null) {
      cur.durationSum += a.durationMs;
      cur.durationN += 1;
    }
    byQuestion.set(a.questionId, cur);
  }

  const mean = (xs: number[]) =>
    xs.length === 0 ? null : xs.reduce((s, x) => s + x, 0) / xs.length;

  const rows: QuestionIntelligenceRow[] = [];
  for (const q of questions) {
    const agg = byQuestion.get(q.id);
    if (!agg || agg.total < minAttempts) continue;

    const missRatePct = Math.round(
      ((agg.total - agg.correct) / agg.total) * 100
    );
    const avgCorrect = mean(agg.scoresWhenCorrect);
    const avgIncorrect = mean(agg.scoresWhenIncorrect);
    const discriminationProxy =
      avgCorrect !== null && avgIncorrect !== null
        ? Math.round(avgCorrect - avgIncorrect)
        : null;

    rows.push({
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      quizId: q.quiz.id,
      quizTitle: q.quiz.title,
      courseId: q.quiz.course.id,
      courseTitle: q.quiz.course.title,
      attemptCount: agg.total,
      correctCount: agg.correct,
      missRatePct,
      avgDurationMs:
        agg.durationN > 0 ? Math.round(agg.durationSum / agg.durationN) : null,
      discriminationProxy,
      conceptNames: q.conceptTags.map((t) => t.concept.name),
      conceptLinks: q.conceptTags.map((t) => ({
        conceptId: t.concept.id,
        name: t.concept.name,
      })),
      answerOptions: q.answerOptions,
    });
  }

  rows.sort((a, b) => (b.missRatePct ?? 0) - (a.missRatePct ?? 0));
  return rows.slice(0, limit);
}

export async function getQuestionDrilldown(
  productId: string,
  questionId: string,
  range: AnalyticsDateRange
): Promise<QuestionDrilldown | null> {
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      quiz: { course: { productId } },
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, title: true } },
        },
      },
      conceptTags: {
        include: { concept: { select: { id: true, name: true } } },
      },
    },
  });

  if (!question) return null;

  const attempts = await prisma.questionAttempt.findMany({
    where: {
      questionId,
      submittedAt: submittedAtFilter(range),
    },
    select: {
      correct: true,
      durationMs: true,
      hintUsed: true,
      answerPayload: true,
      quizAttempt: { select: { score: true } },
    },
  });

  const total = attempts.length;
  const correctCount = attempts.filter((a) => a.correct).length;
  const durationVals = attempts
    .map((a) => a.durationMs)
    .filter((d): d is number => d != null);
  const hintUsedCount = attempts.filter((a) => a.hintUsed).length;

  const scoresWhenCorrect = attempts
    .filter((a) => a.correct)
    .map((a) => a.quizAttempt.score);
  const scoresWhenIncorrect = attempts
    .filter((a) => !a.correct)
    .map((a) => a.quizAttempt.score);
  const mean = (xs: number[]) =>
    xs.length === 0 ? null : xs.reduce((s, x) => s + x, 0) / xs.length;
  const avgCorrect = mean(scoresWhenCorrect);
  const avgIncorrect = mean(scoresWhenIncorrect);

  const optionCounts = new Map<string, number>();
  for (const a of attempts) {
    const idx = parseSelectionIndex(a.answerPayload);
    if (idx !== null && question.answerOptions[idx] != null) {
      const label = question.answerOptions[idx];
      optionCounts.set(label, (optionCounts.get(label) ?? 0) + 1);
    } else if (Array.isArray(a.answerPayload)) {
      for (const item of a.answerPayload) {
        if (typeof item === "number" && question.answerOptions[item] != null) {
          const label = question.answerOptions[item];
          optionCounts.set(label, (optionCounts.get(label) ?? 0) + 1);
        }
      }
    } else {
      optionCounts.set("Other / free text", (optionCounts.get("Other / free text") ?? 0) + 1);
    }
  }

  const optionTotal = [...optionCounts.values()].reduce((s, n) => s + n, 0);
  const optionDistribution: QuestionOptionDistribution[] = [
    ...optionCounts.entries(),
  ]
    .map(([label, count]) => ({
      label,
      count,
      sharePct:
        optionTotal > 0 ? Math.round((count / optionTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    questionId: question.id,
    prompt: question.prompt,
    type: question.type,
    quizId: question.quiz.id,
    quizTitle: question.quiz.title,
    courseId: question.quiz.course.id,
    courseTitle: question.quiz.course.title,
    attemptCount: total,
    correctCount,
    missRatePct:
      total > 0 ? Math.round(((total - correctCount) / total) * 100) : null,
    avgDurationMs:
      durationVals.length > 0
        ? Math.round(
            durationVals.reduce((s, d) => s + d, 0) / durationVals.length
          )
        : null,
    discriminationProxy:
      avgCorrect !== null && avgIncorrect !== null
        ? Math.round(avgCorrect - avgIncorrect)
        : null,
    conceptNames: question.conceptTags.map((t) => t.concept.name),
    conceptLinks: question.conceptTags.map((t) => ({
      conceptId: t.concept.id,
      name: t.concept.name,
    })),
    answerOptions: question.answerOptions,
    optionDistribution,
    hintUsedCount,
    hintUsedRatePct:
      total > 0 ? Math.round((hintUsedCount / total) * 100) : null,
  };
}
