/**
 * Concept mastery and knowledge gaps from normalized QuestionAttempt rows.
 */

import "server-only";

import type { ConceptImportance } from "@prisma/client";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

const IMPORTANCE_WEIGHT: Record<ConceptImportance, number> = {
  critical: 1.5,
  core: 1,
  supporting: 0.6,
};

export type ConceptMasteryRow = {
  conceptId: string;
  slug: string;
  name: string;
  importance: ConceptImportance;
  category: string | null;
  taggedQuestionCount: number;
  taggedLessonCount: number;
  attemptCount: number;
  correctCount: number;
  /** Weighted correct rate 0–100, or null when no attempts. */
  masteryPct: number | null;
  /** importance_weight × (1 − mastery); higher = bigger gap. */
  gapScore: number | null;
};

export type ConceptCoverageSummary = {
  lessonTotal: number;
  lessonTagged: number;
  questionTotal: number;
  questionTagged: number;
  /** Share of (lessons + questions) with ≥1 concept tag, 0–100. */
  coveragePct: number;
  complete: boolean;
};

export type ConceptDrilldown = ConceptMasteryRow & {
  description: string | null;
  lessons: Array<{
    lessonId: string;
    title: string;
    courseId: string;
    courseTitle: string;
    weight: number;
  }>;
  questions: Array<{
    questionId: string;
    prompt: string;
    quizId: string;
    quizTitle: string;
    courseId: string;
    courseTitle: string;
    attemptCount: number;
    correctCount: number;
    missRatePct: number | null;
    weight: number;
  }>;
};

function submittedAtFilter(range: AnalyticsDateRange) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    lte: range.to,
  };
}

export async function getConceptCoverage(
  productId: string
): Promise<ConceptCoverageSummary> {
  const [lessonTotal, questionTotal, taggedLessonIds, taggedQuestionIds] =
    await Promise.all([
      prisma.lesson.count({
        where: { course: { productId }, status: "published" },
      }),
      prisma.question.count({
        where: {
          quiz: { course: { productId } },
        },
      }),
      prisma.contentConceptTag.findMany({
        where: {
          concept: { productId },
          lessonId: { not: null },
          lesson: { status: "published", course: { productId } },
        },
        select: { lessonId: true },
        distinct: ["lessonId"],
      }),
      prisma.contentConceptTag.findMany({
        where: {
          concept: { productId },
          questionId: { not: null },
          question: { quiz: { course: { productId } } },
        },
        select: { questionId: true },
        distinct: ["questionId"],
      }),
    ]);

  const lessonTagged = taggedLessonIds.length;
  const questionTagged = taggedQuestionIds.length;
  const denom = lessonTotal + questionTotal;
  const coveragePct =
    denom === 0
      ? 100
      : Math.round(((lessonTagged + questionTagged) / denom) * 100);

  return {
    lessonTotal,
    lessonTagged,
    questionTotal,
    questionTagged,
    coveragePct,
    complete: denom === 0 || coveragePct >= 100,
  };
}

export async function getConceptMasteryRows(
  productId: string,
  range: AnalyticsDateRange
): Promise<ConceptMasteryRow[]> {
  const concepts = await prisma.concept.findMany({
    where: { productId },
    orderBy: [{ importance: "asc" }, { name: "asc" }],
    include: {
      tags: {
        where: {
          OR: [
            { questionId: { not: null } },
            { lessonId: { not: null } },
          ],
        },
        select: {
          questionId: true,
          lessonId: true,
          weight: true,
        },
      },
    },
  });

  if (concepts.length === 0) return [];

  const questionIds = [
    ...new Set(
      concepts.flatMap((c) =>
        c.tags.map((t) => t.questionId).filter((id): id is string => Boolean(id))
      )
    ),
  ];

  const attempts =
    questionIds.length === 0
      ? []
      : await prisma.questionAttempt.findMany({
          where: {
            questionId: { in: questionIds },
            submittedAt: submittedAtFilter(range),
            question: { quiz: { course: { productId } } },
          },
          select: {
            questionId: true,
            correct: true,
          },
        });

  const byQuestion = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const cur = byQuestion.get(a.questionId) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.correct) cur.correct += 1;
    byQuestion.set(a.questionId, cur);
  }

  return concepts.map((concept) => {
    const qTags = concept.tags.filter((t) => t.questionId);
    const lessonTags = concept.tags.filter((t) => t.lessonId);

    let weightedCorrect = 0;
    let weightedTotal = 0;
    let attemptCount = 0;
    let correctCount = 0;

    for (const tag of qTags) {
      const qid = tag.questionId!;
      const stats = byQuestion.get(qid);
      if (!stats || stats.total === 0) continue;
      const w = tag.weight > 0 ? tag.weight : 1;
      weightedCorrect += (stats.correct / stats.total) * w * stats.total;
      weightedTotal += w * stats.total;
      attemptCount += stats.total;
      correctCount += stats.correct;
    }

    const masteryPct =
      weightedTotal > 0
        ? Math.round((weightedCorrect / weightedTotal) * 100)
        : null;
    const importanceWeight = IMPORTANCE_WEIGHT[concept.importance];
    const gapScore =
      masteryPct === null
        ? null
        : Math.round(importanceWeight * (1 - masteryPct / 100) * 100) / 100;

    return {
      conceptId: concept.id,
      slug: concept.slug,
      name: concept.name,
      importance: concept.importance,
      category: concept.category,
      taggedQuestionCount: new Set(qTags.map((t) => t.questionId)).size,
      taggedLessonCount: new Set(lessonTags.map((t) => t.lessonId)).size,
      attemptCount,
      correctCount,
      masteryPct,
      gapScore,
    };
  });
}

/** Knowledge gaps: concepts with attempts, sorted by gapScore desc. */
export function rankKnowledgeGaps(
  rows: ConceptMasteryRow[],
  limit = 10
): ConceptMasteryRow[] {
  return [...rows]
    .filter((r) => r.gapScore !== null && r.attemptCount > 0)
    .sort((a, b) => (b.gapScore ?? 0) - (a.gapScore ?? 0))
    .slice(0, limit);
}

export async function getConceptDrilldown(
  productId: string,
  conceptId: string,
  range: AnalyticsDateRange
): Promise<ConceptDrilldown | null> {
  const concept = await prisma.concept.findFirst({
    where: { id: conceptId, productId },
    include: {
      tags: {
        include: {
          question: {
            include: {
              quiz: {
                include: {
                  course: { select: { id: true, title: true, productId: true } },
                },
              },
            },
          },
          lesson: {
            include: {
              course: { select: { id: true, title: true, productId: true } },
            },
          },
        },
      },
    },
  });

  if (!concept) return null;

  const questionIds = concept.tags
    .map((t) => t.questionId)
    .filter((id): id is string => Boolean(id));

  const attempts =
    questionIds.length === 0
      ? []
      : await prisma.questionAttempt.findMany({
          where: {
            questionId: { in: questionIds },
            submittedAt: submittedAtFilter(range),
            question: { quiz: { course: { productId } } },
          },
          select: { questionId: true, correct: true },
        });

  const byQuestion = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const cur = byQuestion.get(a.questionId) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.correct) cur.correct += 1;
    byQuestion.set(a.questionId, cur);
  }

  const rows = await getConceptMasteryRows(productId, range);
  const base = rows.find((r) => r.conceptId === conceptId);
  if (!base) return null;

  const questions = concept.tags
    .filter((t) => t.question && t.question.quiz.course.productId === productId)
    .map((t) => {
      const q = t.question!;
      const stats = byQuestion.get(q.id) ?? { correct: 0, total: 0 };
      const missRatePct =
        stats.total > 0
          ? Math.round(((stats.total - stats.correct) / stats.total) * 100)
          : null;
      return {
        questionId: q.id,
        prompt: q.prompt,
        quizId: q.quizId,
        quizTitle: q.quiz.title,
        courseId: q.quiz.course.id,
        courseTitle: q.quiz.course.title,
        attemptCount: stats.total,
        correctCount: stats.correct,
        missRatePct,
        weight: t.weight,
      };
    });

  const lessons = concept.tags
    .filter((t) => t.lesson && t.lesson.course.productId === productId)
    .map((t) => {
      const l = t.lesson!;
      return {
        lessonId: l.id,
        title: l.title,
        courseId: l.course.id,
        courseTitle: l.course.title,
        weight: t.weight,
      };
    });

  return {
    ...base,
    description: concept.description,
    lessons,
    questions,
  };
}
