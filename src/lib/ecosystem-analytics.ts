import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import { getDailyTrends, type TrendSeries } from "@/lib/analytics-rollup";

/**
 * Ecosystem-wide (staff-only) analytics for the admin Ecosystem Overview.
 *
 * Funnel totals count raw AnalyticsEvent rows (indexed by eventName) so the
 * numbers are always current; trend charts read daily rollups so they stay
 * cheap as event history grows.
 */

export type EcosystemFunnelStep = {
  key: string;
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export type ProductComparisonRow = {
  productId: string;
  productName: string;
  productSlug: string;
  publishedCourses: number;
  starts: number;
  badgeAwards: number;
  completionRate: number | null;
};

export type ScorecardEntry = {
  key: string;
  label: string;
  /** Formatted current value, e.g. "42" or "18%". */
  value: string;
  target: string;
  met: boolean | null; // null = not enough data
  detail: string;
};

export type LearnerCohorts = {
  walletConnectedLearners: number;
  learnersWithProgress: number;
  multiCourseLearners: number;
  returnRate: number | null;
  medianDaysToCompletion: number | null;
  learnersWithBadge: number;
};

export type QuizHotspot = {
  courseTitle: string;
  courseId: string;
  prompt: string;
  missRate: number;
  attemptCount: number;
};

export type EcosystemOverview = {
  funnel: EcosystemFunnelStep[];
  trends: TrendSeries[];
  products: ProductComparisonRow[];
  scorecard: ScorecardEntry[];
  cohorts: LearnerCohorts;
  quizHotspots: QuizHotspot[];
};

const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "course_detail_viewed", label: "Course detail views" },
  { key: "start_course_clicked", label: "Start course clicks" },
  { key: "wallet_connected", label: "Wallet connections" },
  { key: "course_started", label: "Courses started" },
  { key: "course_completed", label: "Courses completed" },
  { key: "badge_awarded", label: "Badges awarded" },
];

async function getFunnel(
  range: AnalyticsDateRange
): Promise<EcosystemFunnelStep[]> {
  const occurredAt = occurredAtFilter(range);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["eventName"],
    where: {
      eventName: { in: FUNNEL_STEPS.map((s) => s.key) },
      ...(occurredAt ? { occurredAt } : {}),
    },
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((g) => [g.eventName, g._count._all]));

  let previous: number | null = null;
  return FUNNEL_STEPS.map((step) => {
    const count = counts.get(step.key) ?? 0;
    const rateFromPrevious =
      previous != null && previous > 0
        ? Math.round((count / previous) * 100)
        : null;
    previous = count;
    return { ...step, count, rateFromPrevious };
  });
}

async function getProductComparison(
  range: AnalyticsDateRange
): Promise<ProductComparisonRow[]> {
  const createdAt = range.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const awardedAt = range.from
    ? { gte: range.from, lte: range.to }
    : undefined;

  const [products, startGroups, awardGroups] = await Promise.all([
    prisma.product.findMany({
      where: { status: "published" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        courses: { select: { id: true, status: true } },
      },
    }),
    // Distinct learners per course who have any lesson progress.
    prisma.progress.groupBy({
      by: ["courseId", "userId"],
      where: createdAt ? { createdAt } : {},
      _count: { _all: true },
    }),
    prisma.badgeAward.groupBy({
      by: ["courseId"],
      where: awardedAt ? { awardedAt } : {},
      _count: { _all: true },
    }),
  ]);

  const startsByCourse = new Map<string, number>();
  for (const g of startGroups) {
    startsByCourse.set(g.courseId, (startsByCourse.get(g.courseId) ?? 0) + 1);
  }
  const awardsByCourse = new Map(
    awardGroups.map((g) => [g.courseId, g._count._all])
  );

  return products
    .map((product) => {
      const courseIds = product.courses.map((c) => c.id);
      const starts = courseIds.reduce(
        (sum, id) => sum + (startsByCourse.get(id) ?? 0),
        0
      );
      const badgeAwards = courseIds.reduce(
        (sum, id) => sum + (awardsByCourse.get(id) ?? 0),
        0
      );
      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        publishedCourses: product.courses.filter(
          (c) => c.status === "published"
        ).length,
        starts,
        badgeAwards,
        completionRate:
          starts > 0 ? Math.round((badgeAwards / starts) * 100) : null,
      };
    })
    .sort((a, b) => b.starts - a.starts);
}

async function getPassWithinTwoAttempts(
  range: AnalyticsDateRange
): Promise<{ rate: number | null; usersAttempted: number }> {
  const submittedAt = range.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: { lessonId: null },
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { userId: true, quizId: true, passed: true },
    orderBy: { submittedAt: "asc" },
  });

  const byUserQuiz = new Map<string, boolean[]>();
  for (const a of attempts) {
    const key = `${a.userId}:${a.quizId}`;
    const list = byUserQuiz.get(key) ?? [];
    list.push(a.passed);
    byUserQuiz.set(key, list);
  }

  const total = byUserQuiz.size;
  if (total === 0) return { rate: null, usersAttempted: 0 };

  let passedWithinTwo = 0;
  for (const tries of byUserQuiz.values()) {
    const firstPass = tries.findIndex(Boolean);
    if (firstPass >= 0 && firstPass <= 1) passedWithinTwo += 1;
  }
  return {
    rate: Math.round((passedWithinTwo / total) * 100),
    usersAttempted: total,
  };
}

async function getCohorts(): Promise<LearnerCohorts> {
  const [walletConnectedLearners, courseUserPairs, badgeUsers, medianRows] =
    await Promise.all([
      prisma.user.count({ where: { role: "learner" } }),
      prisma.progress.groupBy({
        by: ["userId", "courseId"],
        _count: { _all: true },
      }),
      prisma.badgeAward.groupBy({ by: ["userId"], _count: { _all: true } }),
      prisma.$queryRaw<{ medianSeconds: number | null }[]>`
        SELECT percentile_cont(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (ba."awardedAt" - fp."firstProgress"))
        ) AS "medianSeconds"
        FROM "BadgeAward" ba
        JOIN (
          SELECT "userId", "courseId", MIN("createdAt") AS "firstProgress"
          FROM "Progress"
          GROUP BY 1, 2
        ) fp ON fp."userId" = ba."userId" AND fp."courseId" = ba."courseId"
        WHERE ba."awardedAt" > fp."firstProgress"
      `,
    ]);

  const coursesByUser = new Map<string, number>();
  for (const pair of courseUserPairs) {
    coursesByUser.set(pair.userId, (coursesByUser.get(pair.userId) ?? 0) + 1);
  }
  const learnersWithProgress = coursesByUser.size;
  const multiCourseLearners = [...coursesByUser.values()].filter(
    (n) => n >= 2
  ).length;

  const medianSeconds = medianRows[0]?.medianSeconds ?? null;

  return {
    walletConnectedLearners,
    learnersWithProgress,
    multiCourseLearners,
    returnRate:
      learnersWithProgress > 0
        ? Math.round((multiCourseLearners / learnersWithProgress) * 100)
        : null,
    medianDaysToCompletion:
      medianSeconds != null
        ? Math.round((medianSeconds / 86400) * 10) / 10
        : null,
    learnersWithBadge: badgeUsers.length,
  };
}

/**
 * Most-missed final-quiz questions across all published courses.
 * Aligns each attempt's recorded answers (index-aligned array) with the
 * quiz's ordered questions; attempts whose answer array no longer matches
 * the question count are skipped.
 */
async function getQuizHotspots(
  range: AnalyticsDateRange,
  limit = 8
): Promise<QuizHotspot[]> {
  const submittedAt = range.from
    ? { gte: range.from, lte: range.to }
    : undefined;

  const quizzes = await prisma.quiz.findMany({
    where: { lessonId: null, course: { status: "published" } },
    select: {
      id: true,
      courseId: true,
      course: { select: { title: true } },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, correctAnswer: true },
      },
      attempts: {
        where: submittedAt ? { submittedAt } : {},
        select: { answers: true },
      },
    },
  });

  const hotspots: QuizHotspot[] = [];
  for (const quiz of quizzes) {
    quiz.questions.forEach((question, qi) => {
      let answered = 0;
      let misses = 0;
      for (const attempt of quiz.attempts) {
        const raw = attempt.answers;
        if (!Array.isArray(raw) || raw.length !== quiz.questions.length) {
          continue;
        }
        const selected = raw[qi];
        if (typeof selected !== "number") continue;
        answered += 1;
        if (selected !== question.correctAnswer) misses += 1;
      }
      if (answered >= 3) {
        hotspots.push({
          courseTitle: quiz.course.title,
          courseId: quiz.courseId,
          prompt: question.prompt,
          missRate: Math.round((misses / answered) * 100),
          attemptCount: answered,
        });
      }
    });
  }

  return hotspots
    .filter((h) => h.missRate > 0)
    .sort((a, b) => b.missRate - a.missRate || b.attemptCount - a.attemptCount)
    .slice(0, limit);
}

async function getScorecard(
  range: AnalyticsDateRange,
  funnel: EcosystemFunnelStep[],
  cohorts: LearnerCohorts
): Promise<ScorecardEntry[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [completions90d, passWithinTwo] = await Promise.all([
    prisma.badgeAward.count({ where: { awardedAt: { gte: ninetyDaysAgo } } }),
    getPassWithinTwoAttempts(range),
  ]);

  const byKey = new Map(funnel.map((s) => [s.key, s.count]));
  const startClicks = byKey.get("start_course_clicked") ?? 0;
  const walletConnections = byKey.get("wallet_connected") ?? 0;
  const started = byKey.get("course_started") ?? 0;
  const completed = byKey.get("course_completed") ?? 0;

  const walletRate =
    startClicks > 0 ? Math.round((walletConnections / startClicks) * 100) : null;
  const completionRate =
    started > 0 ? Math.round((completed / started) * 100) : null;

  return [
    {
      key: "completions_90d",
      label: "Course completions (rolling 90 days)",
      value: String(completions90d),
      target: "≥ 75",
      met: completions90d >= 75 ? true : completions90d > 0 ? false : null,
      detail: "Primary V1 success metric from the PRD.",
    },
    {
      key: "start_to_completion",
      label: "Start-to-completion rate",
      value: completionRate != null ? `${completionRate}%` : "—",
      target: "≥ 30%",
      met: completionRate != null ? completionRate >= 30 : null,
      detail: `${completed} completions from ${started} starts (${range.label}).`,
    },
    {
      key: "wallet_connect_rate",
      label: "Wallet connection rate",
      value: walletRate != null ? `${walletRate}%` : "—",
      target: "≥ 25%",
      met: walletRate != null ? walletRate >= 25 : null,
      detail: `${walletConnections} connections vs ${startClicks} start clicks (${range.label}).${
        walletRate != null && walletRate > 100
          ? " Can exceed 100% — users also connect outside the start-course flow."
          : ""
      }`,
    },
    {
      key: "quiz_pass_2_attempts",
      label: "Quiz pass rate within two attempts",
      value: passWithinTwo.rate != null ? `${passWithinTwo.rate}%` : "—",
      target: "≥ 60%",
      met: passWithinTwo.rate != null ? passWithinTwo.rate >= 60 : null,
      detail: `${passWithinTwo.usersAttempted} learner-quiz attempts evaluated (${range.label}).`,
    },
    {
      key: "return_rate",
      label: "Return learning rate",
      value: cohorts.returnRate != null ? `${cohorts.returnRate}%` : "—",
      target: "≥ 15%",
      met: cohorts.returnRate != null ? cohorts.returnRate >= 15 : null,
      detail: `${cohorts.multiCourseLearners} of ${cohorts.learnersWithProgress} active learners started more than one course (all time).`,
    },
  ];
}

export async function getEcosystemOverview(
  range: AnalyticsDateRange
): Promise<EcosystemOverview> {
  const [funnel, trends, products, cohorts, quizHotspots] = await Promise.all([
    getFunnel(range),
    getDailyTrends({
      eventNames: ["course_started", "course_completed", "lesson_completed"],
      range,
    }),
    getProductComparison(range),
    getCohorts(),
    getQuizHotspots(range),
  ]);

  const scorecard = await getScorecard(range, funnel, cohorts);

  return { funnel, trends, products, scorecard, cohorts, quizHotspots };
}
