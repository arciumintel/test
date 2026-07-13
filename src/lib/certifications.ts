/**
 * Certification attainment — distinct from Badge / BadgeAward.
 * Never auto-promotes badges to certifications.
 */

import "server-only";

import type { CertificationRequirementType } from "@prisma/client";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import { generateVerificationSlug } from "@/lib/badges";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { prisma } from "@/lib/prisma";

export type CertificationFunnelStep = {
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export type CertificationAnalyticsRow = {
  certificationId: string;
  slug: string;
  name: string;
  status: string;
  requirementCount: number;
  awardsInRange: number;
  awardsAllTime: number;
  /** Awards / learners who started a product course in range × 100. */
  attainmentRatePct: number | null;
  requirements: Array<{
    id: string;
    type: CertificationRequirementType;
    label: string | null;
    weight: number;
  }>;
};

export type CertificationAnalytics = {
  certifications: CertificationAnalyticsRow[];
  funnel: CertificationFunnelStep[];
  awardsInRange: number;
  certificateViewsInRange: number;
  learnersStarted: number;
  setupNeeded: boolean;
  setupMessage: string | null;
};

function submittedFilter(range: AnalyticsDateRange) {
  return {
    ...(range.from ? { gte: range.from } : {}),
    lte: range.to,
  };
}

function asConfig(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function countLearnersStarted(
  productId: string,
  range: AnalyticsDateRange
): Promise<number> {
  const rows = await prisma.progress.groupBy({
    by: ["userId"],
    where: {
      course: { productId },
      createdAt: submittedFilter(range),
    },
  });
  return rows.length;
}

export async function getCertificationAnalytics(
  productId: string,
  range: AnalyticsDateRange
): Promise<CertificationAnalytics> {
  const certifications = await prisma.certification.findMany({
    where: { productId },
    include: {
      requirements: { orderBy: { sortOrder: "asc" } },
      _count: { select: { awards: true } },
    },
    orderBy: [{ status: "desc" }, { name: "asc" }],
  });

  const awardsInRange = await prisma.certificationAward.count({
    where: {
      certification: { productId },
      awardedAt: submittedFilter(range),
    },
  });

  const awardCounts = await prisma.certificationAward.groupBy({
    by: ["certificationId"],
    where: {
      certification: { productId },
      awardedAt: submittedFilter(range),
    },
    _count: { _all: true },
  });
  const awardsByCert = new Map(
    awardCounts.map((r) => [r.certificationId, r._count._all])
  );

  const occurredAt = occurredAtFilter(range);
  const certificateViewsInRange = await prisma.analyticsEvent.count({
    where: {
      ecosystemProjectId: productId,
      eventName: "certificate_viewed",
      ...(occurredAt ? { occurredAt } : {}),
    },
  });

  const learnersStarted = await countLearnersStarted(productId, range);

  const rows: CertificationAnalyticsRow[] = certifications.map((c) => {
    const inRange = awardsByCert.get(c.id) ?? 0;
    return {
      certificationId: c.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      requirementCount: c.requirements.length,
      awardsInRange: inRange,
      awardsAllTime: c._count.awards,
      attainmentRatePct:
        learnersStarted > 0
          ? Math.round((inRange / learnersStarted) * 100)
          : null,
      requirements: c.requirements.map((r) => ({
        id: r.id,
        type: r.type,
        label: r.label,
        weight: r.weight,
      })),
    };
  });

  const published = certifications.filter((c) => c.status === "published");
  const eligibleApprox = learnersStarted;
  const awardedUsers = await prisma.certificationAward.groupBy({
    by: ["userId"],
    where: {
      certification: { productId, status: "published" },
      awardedAt: submittedFilter(range),
    },
  });

  const funnel: CertificationFunnelStep[] = [
    {
      label: "Learners started",
      count: eligibleApprox,
      rateFromPrevious: null,
    },
    {
      label: "Published certifications configured",
      count: published.length,
      rateFromPrevious: null,
    },
    {
      label: "Learners awarded (period)",
      count: awardedUsers.length,
      rateFromPrevious:
        eligibleApprox > 0
          ? Math.round((awardedUsers.length / eligibleApprox) * 100)
          : null,
    },
    {
      label: "Certificate views (period)",
      count: certificateViewsInRange,
      rateFromPrevious:
        awardedUsers.length > 0
          ? Math.round(
              (certificateViewsInRange / Math.max(1, awardsInRange)) * 100
            )
          : null,
    },
  ];

  const setupNeeded = certifications.length === 0;
  return {
    certifications: rows,
    funnel,
    awardsInRange,
    certificateViewsInRange,
    learnersStarted,
    setupNeeded,
    setupMessage: setupNeeded
      ? "Define a certification with requirements in Analytics settings. Badges stay under Courses/Overview as progress signals."
      : null,
  };
}

async function userMeetsRequirement(
  userId: string,
  productId: string,
  type: CertificationRequirementType,
  config: Record<string, unknown>
): Promise<boolean> {
  switch (type) {
    case "course_completion": {
      const courseId = typeof config.courseId === "string" ? config.courseId : null;
      if (!courseId) return false;
      const award = await prisma.badgeAward.findFirst({
        where: { userId, courseId, course: { productId } },
        select: { id: true },
      });
      // Course completion without badge: all required lessons + quiz pass
      if (award) return true;
      const course = await prisma.course.findFirst({
        where: { id: courseId, productId },
        include: {
          lessons: {
            where: { status: "published", required: true },
            select: { id: true },
          },
          quizzes: {
            where: { lessonId: null, status: "published" },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!course) return false;
      const progress = await prisma.progress.findMany({
        where: {
          userId,
          courseId,
          lessonId: { in: course.lessons.map((l) => l.id) },
          completedAt: { not: null },
        },
        select: { lessonId: true },
      });
      if (progress.length < course.lessons.length) return false;
      if (course.quizzes[0]) {
        const passed = await prisma.quizAttempt.findFirst({
          where: {
            userId,
            quizId: course.quizzes[0].id,
            passed: true,
          },
          select: { id: true },
        });
        if (!passed) return false;
      }
      return true;
    }
    case "quiz_pass": {
      const quizId = typeof config.quizId === "string" ? config.quizId : null;
      if (!quizId) return false;
      const minScore =
        typeof config.minScore === "number" ? config.minScore : 0;
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          quizId,
          passed: true,
          score: { gte: minScore },
          quiz: { course: { productId } },
        },
        select: { id: true },
      });
      return Boolean(attempt);
    }
    case "readiness_score": {
      const min =
        typeof config.minReadinessScore === "number"
          ? config.minReadinessScore
          : 70;
      const { evaluateLearnerReadinessScore } = await import(
        "@/lib/readiness-eval"
      );
      const score = await evaluateLearnerReadinessScore(userId, productId);
      return score !== null && score >= min;
    }
    case "learning_path_completion": {
      const pathId =
        typeof config.learningPathId === "string" ? config.learningPathId : null;
      if (!pathId) return false;
      const path = await prisma.learningPath.findFirst({
        where: { id: pathId, productId },
        include: { courses: { select: { courseId: true } } },
      });
      if (!path || path.courses.length === 0) return false;
      for (const link of path.courses) {
        const ok = await userMeetsRequirement(userId, productId, "course_completion", {
          courseId: link.courseId,
        });
        if (!ok) return false;
      }
      return true;
    }
    case "conversion_event": {
      const key =
        typeof config.conversionKey === "string" ? config.conversionKey : null;
      if (!key) return false;
      const def = await prisma.conversionDefinition.findFirst({
        where: { productId, key },
      });
      if (!def) return false;
      const event = await prisma.analyticsEvent.findFirst({
        where: {
          userId,
          ecosystemProjectId: productId,
          eventName: def.eventName,
          OR: [
            { metadata: { path: ["conversionKey"], equals: key } },
            { metadata: { equals: { conversionKey: key } } },
          ],
        },
        select: { id: true },
      });
      // Fallback: any event with that name for the user+product
      if (event) return true;
      const any = await prisma.analyticsEvent.findFirst({
        where: {
          userId,
          ecosystemProjectId: productId,
          eventName: def.eventName,
        },
        select: { id: true },
      });
      return Boolean(any);
    }
    case "concept_mastery": {
      const conceptId =
        typeof config.conceptId === "string" ? config.conceptId : null;
      const minMastery =
        typeof config.minMasteryPct === "number" ? config.minMasteryPct : 70;
      if (!conceptId) return false;
      const tags = await prisma.contentConceptTag.findMany({
        where: { conceptId, questionId: { not: null } },
        select: { questionId: true, weight: true },
      });
      const qids = tags
        .map((t) => t.questionId)
        .filter((id): id is string => Boolean(id));
      if (qids.length === 0) return false;
      const attempts = await prisma.questionAttempt.findMany({
        where: { userId, questionId: { in: qids } },
        select: { questionId: true, correct: true },
      });
      if (attempts.length === 0) return false;
      const correct = attempts.filter((a) => a.correct).length;
      const pct = (correct / attempts.length) * 100;
      return pct >= minMastery;
    }
    default:
      return false;
  }
}

/**
 * Evaluates published certifications for a learner and awards when all
 * requirements are met. Does not create BadgeAwards.
 */
export async function evaluateCertificationsForUser(
  userId: string,
  productId: string
): Promise<{ awarded: string[] }> {
  const certifications = await prisma.certification.findMany({
    where: { productId, status: "published" },
    include: { requirements: { orderBy: { sortOrder: "asc" } } },
  });

  const awarded: string[] = [];
  let readinessScore: number | null = null;

  for (const cert of certifications) {
    const existing = await prisma.certificationAward.findUnique({
      where: {
        userId_certificationId: {
          userId,
          certificationId: cert.id,
        },
      },
      select: { id: true },
    });
    if (existing) continue;

    if (cert.requirements.length === 0) continue;

    let allMet = true;
    for (const req of cert.requirements) {
      const met = await userMeetsRequirement(
        userId,
        productId,
        req.type,
        asConfig(req.config)
      );
      if (!met) {
        allMet = false;
        break;
      }
    }
    if (!allMet) continue;

    if (readinessScore === null) {
      try {
        const { evaluateLearnerReadinessScore } = await import(
          "@/lib/readiness-eval"
        );
        readinessScore = await evaluateLearnerReadinessScore(userId, productId);
      } catch {
        readinessScore = null;
      }
    }

    const threshold = cert.readyThreshold;
    if (
      threshold != null &&
      (readinessScore === null || readinessScore < threshold)
    ) {
      continue;
    }

    const slug = generateVerificationSlug();
    const created = await prisma.certificationAward.create({
      data: {
        userId,
        certificationId: cert.id,
        readinessScoreAtAward: readinessScore,
        verificationSlug: slug,
      },
    });

    awarded.push(created.id);
    trackEventFireAndForget({
      eventName: "certification_awarded",
      source: "server_action",
      userId,
      ecosystemProjectId: productId,
      metadata: {
        certificationId: cert.id,
        certificationAwardId: created.id,
        readinessScore: readinessScore,
      },
    });
  }

  return { awarded };
}
