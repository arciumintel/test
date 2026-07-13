import { prisma } from "@/lib/prisma";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import { coursePath, productPath } from "@/lib/paths";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import {
  awardedAtFilter,
  occurredAtFilter,
  progressCompletedAtFilter,
  progressCreatedAtFilter,
  submittedAtFilter,
} from "@/lib/analytics-date-range";

export type CourseAnalyticsOptions = {
  range?: AnalyticsDateRange;
};

export type CourseAnalytics = {
  starts: number;
  completions: number;
  badgeAwards: number;
  quizPassRate: number | null;
  withinTwoAttemptPassRate: number | null;
  averageQuizScore: number | null;
  averageQuizDurationSeconds: number | null;
  quizAbandonmentRate: number | null;
  attempts: number;
  averageAttemptsBeforePass: number | null;
  dropOff: { lessonTitle: string; order: number } | null;
  lessonFunnel: { title: string; order: number; completed: number }[];
};

function computeWithinTwoAttemptPassRate(
  attempts: { userId: string; passed: boolean }[]
): number | null {
  if (attempts.length === 0) return null;

  const byUser = new Map<string, boolean[]>();
  for (const attempt of attempts) {
    const list = byUser.get(attempt.userId) ?? [];
    list.push(attempt.passed);
    byUser.set(attempt.userId, list);
  }

  let passedWithinTwo = 0;
  for (const tries of byUser.values()) {
    const firstPassIdx = tries.findIndex((passed) => passed);
    if (firstPassIdx >= 0 && firstPassIdx <= 1) {
      passedWithinTwo += 1;
    }
  }

  return Math.round((passedWithinTwo / byUser.size) * 100);
}

function computeAverageDurationSeconds(
  attempts: { durationInSeconds: number | null }[]
): number | null {
  const durations = attempts
    .map((attempt) => attempt.durationInSeconds)
    .filter((value): value is number => value != null && value > 0);
  if (durations.length === 0) return null;

  return Math.round(
    durations.reduce((sum, value) => sum + value, 0) / durations.length
  );
}

async function computeQuizAbandonmentRate(
  courseId: string,
  quizId: string,
  range?: AnalyticsDateRange
): Promise<number | null> {
  const occurredAt = range ? occurredAtFilter(range) : undefined;

  const [quizStartedUsers, quizSubmitters] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        courseId,
        quizId,
        eventName: "quiz_started",
        userId: { not: null },
        ...(occurredAt ? { occurredAt } : {}),
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.quizAttempt.findMany({
      where: {
        quizId,
        ...(range ? { submittedAt: submittedAtFilter(range) } : {}),
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const starters = quizStartedUsers.length;
  if (starters === 0) return null;

  const submitterIds = new Set(quizSubmitters.map((row) => row.userId));
  const abandoned = quizStartedUsers.filter(
    (row) => row.userId != null && !submitterIds.has(row.userId)
  ).length;

  return Math.round((abandoned / starters) * 100);
}

export async function getCourseAnalytics(
  courseId: string,
  options?: CourseAnalyticsOptions
): Promise<CourseAnalytics> {
  const range = options?.range;
  const createdAtFilter = range ? progressCreatedAtFilter(range) : undefined;
  const completedAtFilter = range ? progressCompletedAtFilter(range) : undefined;
  const badgeAtFilter = range ? awardedAtFilter(range) : undefined;
  const attemptAtFilter = range ? submittedAtFilter(range) : undefined;

  const [lessons, finalQuiz, badgeAwards] = await Promise.all([
    prisma.lesson.findMany({
      where: { courseId, status: "published" },
      orderBy: { order: "asc" },
      select: { id: true, title: true, order: true },
    }),
    prisma.quiz.findFirst({
      where: { courseId, lessonId: null },
      select: { id: true },
    }),
    prisma.badgeAward.count({
      where: {
        courseId,
        ...(badgeAtFilter ? { awardedAt: badgeAtFilter } : {}),
      },
    }),
  ]);

  const lessonIds = lessons.map((l) => l.id);

  const starters = await prisma.progress.findMany({
    where: {
      courseId,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  const starts = starters.length;

  const lessonFunnel = await Promise.all(
    lessons.map(async (l) => ({
      title: l.title,
      order: l.order,
      completed: await prisma.progress.count({
        where: {
          lessonId: l.id,
          completed: true,
          ...(completedAtFilter ? { completedAt: completedAtFilter } : {}),
        },
      }),
    }))
  );

  let dropOff: CourseAnalytics["dropOff"] = null;
  if (lessonFunnel.length > 0 && starts > 0) {
    let prev = starts;
    let worstDrop = -1;
    for (const step of lessonFunnel) {
      const drop = prev - step.completed;
      if (drop > worstDrop && step.completed < prev) {
        worstDrop = drop;
        dropOff = { lessonTitle: step.title, order: step.order };
      }
      prev = step.completed;
    }
  }

  let quizPassRate: number | null = null;
  let withinTwoAttemptPassRate: number | null = null;
  let averageQuizScore: number | null = null;
  let averageQuizDurationSeconds: number | null = null;
  let quizAbandonmentRate: number | null = null;
  let averageAttemptsBeforePass: number | null = null;
  let attempts = 0;

  if (finalQuiz) {
    const allAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: finalQuiz.id,
        ...(attemptAtFilter ? { submittedAt: attemptAtFilter } : {}),
      },
      select: {
        userId: true,
        score: true,
        passed: true,
        submittedAt: true,
        durationInSeconds: true,
      },
      orderBy: { submittedAt: "asc" },
    });
    attempts = allAttempts.length;
    if (attempts > 0) {
      averageQuizScore = Math.round(
        allAttempts.reduce((sum, a) => sum + a.score, 0) / attempts
      );
      withinTwoAttemptPassRate = computeWithinTwoAttemptPassRate(allAttempts);
      averageQuizDurationSeconds = computeAverageDurationSeconds(allAttempts);
      const byUser = new Map<string, boolean>();
      for (const a of allAttempts) {
        byUser.set(a.userId, byUser.get(a.userId) || a.passed);
      }
      const passed = [...byUser.values()].filter(Boolean).length;
      quizPassRate = Math.round((passed / byUser.size) * 100);

      const attemptsBeforePass: number[] = [];
      const byUserAttempts = new Map<string, typeof allAttempts>();
      for (const a of allAttempts) {
        const list = byUserAttempts.get(a.userId) ?? [];
        list.push(a);
        byUserAttempts.set(a.userId, list);
      }
      for (const userAttempts of byUserAttempts.values()) {
        const firstPassIdx = userAttempts.findIndex((a) => a.passed);
        if (firstPassIdx >= 0) {
          attemptsBeforePass.push(firstPassIdx + 1);
        }
      }
      if (attemptsBeforePass.length > 0) {
        averageAttemptsBeforePass = Math.round(
          (attemptsBeforePass.reduce((s, n) => s + n, 0) /
            attemptsBeforePass.length) *
            10
        ) / 10;
      }
    }

    quizAbandonmentRate = await computeQuizAbandonmentRate(
      courseId,
      finalQuiz.id,
      range
    );
  }

  let completions = badgeAwards;
  if (!range) {
    completions = 0;
    if (lessonIds.length > 0) {
      const grouped = await prisma.progress.groupBy({
        by: ["userId"],
        where: { lessonId: { in: lessonIds }, completed: true },
        _count: { lessonId: true },
      });
      const finishers = grouped
        .filter((g) => g._count.lessonId === lessonIds.length)
        .map((g) => g.userId);

      if (!finalQuiz) {
        completions = finishers.length;
      } else if (finishers.length > 0) {
        const passers = await prisma.quizAttempt.findMany({
          where: {
            quizId: finalQuiz.id,
            passed: true,
            userId: { in: finishers },
          },
          distinct: ["userId"],
          select: { userId: true },
        });
        completions = passers.length;
      }
    }
  }

  return {
    starts,
    completions,
    badgeAwards,
    quizPassRate,
    withinTwoAttemptPassRate,
    averageQuizScore,
    averageQuizDurationSeconds,
    quizAbandonmentRate,
    attempts,
    averageAttemptsBeforePass,
    dropOff,
    lessonFunnel,
  };
}

export async function getPlatformSummary() {
  const [learners, published, completions, badges] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { status: "published" } }),
    prisma.badgeAward.count(),
    prisma.badge.count(),
  ]);
  return { learners, published, completions, badges };
}

export type ProductCourseMetric = {
  courseId: string;
  title: string;
  slug: string;
  status: string;
  starts: number;
  completions: number;
  badgeAwards: number;
  quizPassRate: number | null;
  averageQuizScore: number | null;
};

export type ProductAnalytics = {
  productId: string;
  productName: string;
  productSlug: string;
  publishedCourses: number;
  totalCourses: number;
  starts: number;
  completions: number;
  badgeAwards: number;
  completionRate: number;
  courses: ProductCourseMetric[];
};

export async function getProductAnalytics(
  productId: string,
  options?: CourseAnalyticsOptions
): Promise<ProductAnalytics | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      courses: {
        orderBy: { title: "asc" },
        select: { id: true, title: true, slug: true, status: true },
      },
    },
  });
  if (!product) return null;

  const courseMetrics = await Promise.all(
    product.courses.map(async (course) => {
      const analytics = await getCourseAnalytics(course.id, options);
      return {
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        starts: analytics.starts,
        completions: analytics.completions,
        badgeAwards: analytics.badgeAwards,
        quizPassRate: analytics.quizPassRate,
        averageQuizScore: analytics.averageQuizScore,
      };
    })
  );

  const published = courseMetrics.filter((c) => c.status === "published");
  const starts = published.reduce((sum, c) => sum + c.starts, 0);
  const completions = published.reduce((sum, c) => sum + c.completions, 0);
  const badgeAwards = published.reduce((sum, c) => sum + c.badgeAwards, 0);

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    publishedCourses: published.length,
    totalCourses: product.courses.length,
    starts,
    completions,
    badgeAwards,
    completionRate: starts > 0 ? Math.round((completions / starts) * 100) : 0,
    courses: courseMetrics,
  };
}

export type PartnerSafeAnalytics = {
  publishedCourses: number;
  starts: number;
  completions: number;
  badgeAwards: number;
  completionRate: number;
  courses: {
    title: string;
    starts: number;
    completions: number;
    badgeAwards: number;
    quizPassRate: number | null;
  }[];
};

export async function getPartnerSafeAnalytics(
  productId: string
): Promise<PartnerSafeAnalytics | null> {
  const full = await getProductAnalytics(productId);
  if (!full) return null;

  return {
    publishedCourses: full.publishedCourses,
    starts: full.starts,
    completions: full.completions,
    badgeAwards: full.badgeAwards,
    completionRate: full.completionRate,
    courses: full.courses
      .filter((c) => c.status === "published")
      .map(({ title, starts, completions, badgeAwards, quizPassRate }) => ({
        title,
        starts,
        completions,
        badgeAwards,
        quizPassRate,
      })),
  };
}

export type PartnerReport = {
  markdown: string;
  filename: string;
};

export async function generatePartnerReport(
  productId: string
): Promise<PartnerReport | null> {
  const { buildStaffPartnerReportMarkdown } = await import(
    "@/lib/analytics-export"
  );
  const report = await buildStaffPartnerReportMarkdown(productId);
  if (!report) return null;
  return {
    markdown: report.markdown,
    filename: report.filename,
  };
}
