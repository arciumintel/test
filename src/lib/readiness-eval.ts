/**
 * Learning Readiness / custom model evaluation (aggregate + per-learner).
 * Missing path components contribute neutrally with setup CTAs (§9).
 * Partner conversion readiness weight is deferred to Analytics V2.
 */

import "server-only";

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import type { LearningReadinessRequirementType } from "@/lib/analytics-packs";
import { prisma } from "@/lib/prisma";

export type ReadinessComponentStatus = "ok" | "neutral" | "setup_needed";

export type ReadinessComponentEval = {
  type: LearningReadinessRequirementType | string;
  label: string;
  weight: number;
  status: ReadinessComponentStatus;
  /** 0–100 contribution when status is ok or neutral; null only if excluded. */
  score: number | null;
  setupMessage?: string;
  setupHref?: string;
};

export type ReadinessLevel = {
  id: string;
  label: string;
  minScore: number;
};

export type ReadinessModelEval = {
  modelId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  readyThreshold: number;
  /** Weighted aggregate 0–100 (neutral components contribute 50). */
  averageScore: number | null;
  level: ReadinessLevel | null;
  readySharePct: number | null;
  learnerSampleSize: number;
  components: ReadinessComponentEval[];
  levels: ReadinessLevel[];
};

const COMPONENT_LABELS: Record<LearningReadinessRequirementType, string> = {
  course_completion: "Course completion",
  quiz_performance: "Quiz performance",
  concept_mastery: "Concept mastery",
  required_path_completion: "Required learning path completion",
  partner_conversion_events: "Partner conversion events",
};

function parseRequirements(raw: unknown): Array<{
  type: LearningReadinessRequirementType | string;
  weight: number;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { type?: unknown; weight?: unknown };
      if (typeof row.type !== "string") return null;
      const weight = typeof row.weight === "number" ? row.weight : 0;
      return { type: row.type, weight };
    })
    .filter((r): r is { type: string; weight: number } => r !== null);
}

function parseLevels(raw: unknown): ReadinessLevel[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { id?: unknown; label?: unknown; minScore?: unknown };
      if (typeof row.id !== "string" || typeof row.label !== "string") return null;
      return {
        id: row.id,
        label: row.label,
        minScore: typeof row.minScore === "number" ? row.minScore : 0,
      };
    })
    .filter((r): r is ReadinessLevel => r !== null)
    .sort((a, b) => a.minScore - b.minScore);
}

function pickLevel(score: number, levels: ReadinessLevel[]): ReadinessLevel | null {
  if (levels.length === 0) return null;
  let current = levels[0];
  for (const level of levels) {
    if (score >= level.minScore) current = level;
  }
  return current;
}

function rangeFilter(range: AnalyticsDateRange) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    lte: range.to,
  };
}

async function courseCompletionScore(
  productId: string,
  range: AnalyticsDateRange
): Promise<{ score: number | null; sample: number; status: ReadinessComponentStatus }> {
  const courses = await prisma.course.count({
    where: { productId, status: "published" },
  });
  if (courses === 0) {
    return {
      score: null,
      sample: 0,
      status: "setup_needed",
    };
  }

  const starters = await prisma.progress.groupBy({
    by: ["userId"],
    where: { course: { productId }, createdAt: rangeFilter(range) },
  });
  if (starters.length === 0) {
    return { score: 50, sample: 0, status: "neutral" };
  }

  const completions = await prisma.badgeAward.groupBy({
    by: ["userId"],
    where: {
      course: { productId },
      awardedAt: rangeFilter(range),
    },
  });
  const score = Math.round((completions.length / starters.length) * 100);
  return { score, sample: starters.length, status: "ok" };
}

async function quizPerformanceScore(
  productId: string,
  range: AnalyticsDateRange
): Promise<{ score: number | null; status: ReadinessComponentStatus }> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: { course: { productId }, lessonId: null },
      submittedAt: rangeFilter(range),
    },
    select: { passed: true },
  });
  if (attempts.length === 0) {
    const quizCount = await prisma.quiz.count({
      where: { course: { productId }, lessonId: null, status: "published" },
    });
    if (quizCount === 0) {
      return { score: null, status: "setup_needed" };
    }
    return { score: 50, status: "neutral" };
  }
  const passed = attempts.filter((a) => a.passed).length;
  return {
    score: Math.round((passed / attempts.length) * 100),
    status: "ok",
  };
}

async function conceptMasteryScore(
  productId: string,
  range: AnalyticsDateRange
): Promise<{ score: number | null; status: ReadinessComponentStatus }> {
  const tagged = await prisma.contentConceptTag.count({
    where: {
      concept: { productId },
      questionId: { not: null },
    },
  });
  if (tagged === 0) {
    return { score: null, status: "setup_needed" };
  }

  const attempts = await prisma.questionAttempt.findMany({
    where: {
      submittedAt: rangeFilter(range),
      question: {
        conceptTags: { some: { concept: { productId } } },
        quiz: { course: { productId } },
      },
    },
    select: { correct: true },
  });
  if (attempts.length === 0) {
    return { score: 50, status: "neutral" };
  }
  const correct = attempts.filter((a) => a.correct).length;
  return {
    score: Math.round((correct / attempts.length) * 100),
    status: "ok",
  };
}

async function pathCompletionScore(
  productId: string,
  range: AnalyticsDateRange
): Promise<{ score: number | null; status: ReadinessComponentStatus; setupHref?: string }> {
  const paths = await prisma.learningPath.findMany({
    where: { productId, status: "published" },
    include: { courses: { select: { courseId: true } } },
  });
  if (paths.length === 0) {
    return {
      score: null,
      status: "setup_needed",
      setupHref: `/partner-console/${productId}/analytics/settings`,
    };
  }

  // Aggregate: share of path course badges earned among path course starters
  const courseIds = [...new Set(paths.flatMap((p) => p.courses.map((c) => c.courseId)))];
  if (courseIds.length === 0) {
    return {
      score: null,
      status: "setup_needed",
      setupHref: `/partner-console/${productId}/analytics/settings`,
    };
  }

  const starters = await prisma.progress.groupBy({
    by: ["userId"],
    where: {
      courseId: { in: courseIds },
      createdAt: rangeFilter(range),
    },
  });
  if (starters.length === 0) {
    return { score: 50, status: "neutral" };
  }

  const awards = await prisma.badgeAward.groupBy({
    by: ["userId"],
    where: {
      courseId: { in: courseIds },
      awardedAt: rangeFilter(range),
    },
  });
  return {
    score: Math.round((awards.length / starters.length) * 100),
    status: "ok",
  };
}

async function conversionScore(
  productId: string,
  range: AnalyticsDateRange
): Promise<{ score: number | null; status: ReadinessComponentStatus; setupHref?: string }> {
  const defs = await prisma.conversionDefinition.findMany({
    where: { productId },
    select: { eventName: true, key: true },
  });
  if (defs.length === 0) {
    return {
      score: null,
      status: "setup_needed",
      setupHref: `/partner-console/${productId}/analytics/settings`,
    };
  }

  const starters = await prisma.progress.groupBy({
    by: ["userId"],
    where: { course: { productId }, createdAt: rangeFilter(range) },
  });
  if (starters.length === 0) {
    return { score: 50, status: "neutral" };
  }

  const occurredAt = occurredAtFilter(range);
  const conversionUsers = await prisma.analyticsEvent.findMany({
    where: {
      ecosystemProjectId: productId,
      eventName: { in: defs.map((d) => d.eventName) },
      userId: { not: null },
      ...(occurredAt ? { occurredAt } : {}),
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return {
    score: Math.round((conversionUsers.length / starters.length) * 100),
    status: "ok",
  };
}

async function evalComponent(
  productId: string,
  range: AnalyticsDateRange,
  type: string,
  weight: number
): Promise<ReadinessComponentEval> {
  const label =
    COMPONENT_LABELS[type as LearningReadinessRequirementType] ?? type;
  const baseHref = `/partner-console/${productId}/analytics/settings`;

  switch (type) {
    case "course_completion": {
      const r = await courseCompletionScore(productId, range);
      return {
        type,
        label,
        weight,
        status: r.status,
        score: r.status === "setup_needed" ? 50 : r.score,
        setupMessage:
          r.status === "setup_needed"
            ? "Publish at least one course to measure completion."
            : undefined,
        setupHref: r.status === "setup_needed" ? baseHref : undefined,
      };
    }
    case "quiz_performance": {
      const r = await quizPerformanceScore(productId, range);
      return {
        type,
        label,
        weight,
        status: r.status,
        score: r.status === "setup_needed" ? 50 : r.score,
        setupMessage:
          r.status === "setup_needed"
            ? "Add a final course quiz to measure quiz performance."
            : undefined,
        setupHref: r.status === "setup_needed" ? baseHref : undefined,
      };
    }
    case "concept_mastery": {
      const r = await conceptMasteryScore(productId, range);
      return {
        type,
        label,
        weight,
        status: r.status,
        score: r.status === "setup_needed" ? 50 : r.score,
        setupMessage:
          r.status === "setup_needed"
            ? "Tag questions with concepts to unlock mastery scoring."
            : undefined,
        setupHref:
          r.status === "setup_needed"
            ? `/partner-console/${productId}/analytics/concepts`
            : undefined,
      };
    }
    case "required_path_completion": {
      const r = await pathCompletionScore(productId, range);
      return {
        type,
        label,
        weight,
        status: r.status,
        score: r.status === "setup_needed" ? 50 : r.score,
        setupMessage:
          r.status === "setup_needed"
            ? "Publish a learning path to include path completion."
            : undefined,
        setupHref: r.setupHref,
      };
    }
    case "partner_conversion_events": {
      const r = await conversionScore(productId, range);
      return {
        type,
        label,
        weight,
        status: r.status,
        score: r.status === "setup_needed" ? 50 : r.score,
        setupMessage:
          r.status === "setup_needed"
            ? "Partner conversion events are deferred to Analytics V2."
            : undefined,
        setupHref: r.setupHref,
      };
    }
    default:
      return {
        type,
        label,
        weight,
        status: "neutral",
        score: 50,
        setupMessage: "Unknown requirement type — contributing neutrally.",
      };
  }
}

function weightedAverage(components: ReadinessComponentEval[]): number | null {
  const usable = components.filter((c) => c.score !== null && c.weight > 0);
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((s, c) => s + c.weight, 0);
  if (totalWeight <= 0) return null;
  const sum = usable.reduce((s, c) => s + (c.score ?? 0) * c.weight, 0);
  return Math.round(sum / totalWeight);
}

export async function evaluateReadinessModels(
  productId: string,
  range: AnalyticsDateRange
): Promise<ReadinessModelEval[]> {
  const models = await prisma.readinessModel.findMany({
    where: { productId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  const starters = await prisma.progress.groupBy({
    by: ["userId"],
    where: { course: { productId }, createdAt: rangeFilter(range) },
  });

  const results: ReadinessModelEval[] = [];
  for (const model of models) {
    const reqs = parseRequirements(model.requirements);
    const levels = parseLevels(model.levels);
    const components: ReadinessComponentEval[] = [];
    for (const req of reqs) {
      components.push(
        await evalComponent(productId, range, req.type, req.weight)
      );
    }
    const averageScore = weightedAverage(components);
    results.push({
      modelId: model.id,
      name: model.name,
      description: model.description,
      isDefault: model.isDefault,
      readyThreshold: model.readyThreshold,
      averageScore,
      level: averageScore !== null ? pickLevel(averageScore, levels) : null,
      readySharePct:
        averageScore !== null
          ? averageScore >= model.readyThreshold
            ? Math.min(100, Math.round(averageScore))
            : Math.round((averageScore / model.readyThreshold) * 100)
          : null,
      learnerSampleSize: starters.length,
      components,
      levels,
    });
  }
  return results;
}

/**
 * Per-learner readiness score (0–100) using the default model, for certification gates.
 * Uses all-time activity (not date-bounded) for credential eligibility.
 */
export async function evaluateLearnerReadinessScore(
  userId: string,
  productId: string
): Promise<number | null> {
  const model = await prisma.readinessModel.findFirst({
    where: { productId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (!model) return null;

  const reqs = parseRequirements(model.requirements);
  if (reqs.length === 0) return null;

  const scores: Array<{ weight: number; score: number }> = [];

  for (const req of reqs) {
    let score = 50;
    switch (req.type) {
      case "course_completion": {
        const published = await prisma.course.count({
          where: { productId, status: "published" },
        });
        if (published === 0) break;
        const awards = await prisma.badgeAward.count({
          where: { userId, course: { productId } },
        });
        score = Math.min(100, Math.round((awards / published) * 100));
        break;
      }
      case "quiz_performance": {
        const attempts = await prisma.quizAttempt.findMany({
          where: {
            userId,
            quiz: { course: { productId }, lessonId: null },
          },
          select: { passed: true },
        });
        if (attempts.length === 0) break;
        score = Math.round(
          (attempts.filter((a) => a.passed).length / attempts.length) * 100
        );
        break;
      }
      case "concept_mastery": {
        const attempts = await prisma.questionAttempt.findMany({
          where: {
            userId,
            question: {
              conceptTags: { some: { concept: { productId } } },
              quiz: { course: { productId } },
            },
          },
          select: { correct: true },
        });
        if (attempts.length === 0) break;
        score = Math.round(
          (attempts.filter((a) => a.correct).length / attempts.length) * 100
        );
        break;
      }
      case "required_path_completion": {
        const paths = await prisma.learningPath.findMany({
          where: { productId, status: "published" },
          include: { courses: { select: { courseId: true } } },
        });
        if (paths.length === 0) break;
        let pathOk = 0;
        for (const path of paths) {
          if (path.courses.length === 0) continue;
          let all = true;
          for (const link of path.courses) {
            const award = await prisma.badgeAward.findFirst({
              where: { userId, courseId: link.courseId },
              select: { id: true },
            });
            if (!award) {
              all = false;
              break;
            }
          }
          if (all) pathOk += 1;
        }
        score = Math.round((pathOk / paths.length) * 100);
        break;
      }
      case "partner_conversion_events": {
        const defs = await prisma.conversionDefinition.findMany({
          where: { productId },
          select: { eventName: true },
        });
        if (defs.length === 0) break;
        const hit = await prisma.analyticsEvent.findFirst({
          where: {
            userId,
            ecosystemProjectId: productId,
            eventName: { in: defs.map((d) => d.eventName) },
          },
          select: { id: true },
        });
        score = hit ? 100 : 0;
        break;
      }
      default:
        break;
    }
    scores.push({ weight: req.weight, score });
  }

  const totalWeight = scores.reduce((s, x) => s + x.weight, 0);
  if (totalWeight <= 0) return null;
  return Math.round(
    scores.reduce((s, x) => s + x.score * x.weight, 0) / totalWeight
  );
}
