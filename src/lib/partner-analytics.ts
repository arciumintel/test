import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import {
  getCourseAnalytics,
  getProductAnalytics,
  type CourseAnalytics,
  type ProductCourseMetric,
} from "@/lib/analytics";
import {
  getQuizDiagnostics,
  getAttemptsBeforePass,
  type QuizQuestionDiagnostic,
  type AttemptsBeforePassBucket,
} from "@/lib/quiz-diagnostics";

export type { QuizQuestionDiagnostic, AttemptsBeforePassBucket };
export { getQuizDiagnostics, getAttemptsBeforePass };

export type DiscoveryMetrics = {
  projectPageViews: number;
  courseDetailViews: number;
  startConversionRate: number | null;
  badgeVerificationViews: number;
};

export type FunnelStep = {
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export type WeeklyTrendPoint = {
  weekStart: string;
  starts: number;
  completions: number;
};

export type PartnerPlusCourseAnalytics = CourseAnalytics & {
  courseId: string;
  title: string;
  slug: string;
  status: string;
  badgeVerificationViews: number;
  quizDiagnostics: QuizQuestionDiagnostic[];
  attemptsBeforePass: AttemptsBeforePassBucket[];
};

export type PartnerPlusAnalytics = {
  productId: string;
  productName: string;
  rangeLabel: string;
  staffNotes: string | null;
  summary: {
    starts: number;
    completions: number;
    completionRate: number;
    badgeAwards: number;
    quizPassRate: number | null;
    publishedCourses: number;
  };
  courses: ProductCourseMetric[];
  discovery: DiscoveryMetrics;
  funnel: FunnelStep[];
  weeklyTrends: WeeklyTrendPoint[];
  insights: string[];
};

async function countProductEvents(
  productId: string,
  eventName: string,
  range: AnalyticsDateRange
): Promise<number> {
  const occurredAt = occurredAtFilter(range);
  return prisma.analyticsEvent.count({
    where: {
      ecosystemProjectId: productId,
      eventName,
      ...(occurredAt ? { occurredAt } : {}),
    },
  });
}

async function countCourseEvents(
  courseId: string,
  eventName: string,
  range: AnalyticsDateRange
): Promise<number> {
  const occurredAt = occurredAtFilter(range);
  return prisma.analyticsEvent.count({
    where: {
      courseId,
      eventName,
      ...(occurredAt ? { occurredAt } : {}),
    },
  });
}

export async function getDiscoveryMetrics(
  productId: string,
  range: AnalyticsDateRange,
  courseStarts: number
): Promise<DiscoveryMetrics> {
  const [projectPageViews, courseDetailViews, badgeVerificationViews] =
    await Promise.all([
      countProductEvents(productId, "ecosystem_project_viewed", range),
      countProductEvents(productId, "course_detail_viewed", range),
      countProductEvents(productId, "badge_verification_viewed", range),
    ]);

  return {
    projectPageViews,
    courseDetailViews,
    startConversionRate:
      courseDetailViews > 0
        ? Math.round((courseStarts / courseDetailViews) * 100)
        : null,
    badgeVerificationViews,
  };
}

const FUNNEL_EVENTS: { eventName: string; label: string }[] = [
  { eventName: "course_detail_viewed", label: "Course page viewed" },
  { eventName: "start_course_clicked", label: "Start course clicked" },
  { eventName: "wallet_connect_started", label: "Wallet connect started" },
  { eventName: "wallet_connected", label: "Wallet connected" },
  { eventName: "course_started", label: "Course started" },
  { eventName: "quiz_passed", label: "Quiz passed" },
  { eventName: "course_completed", label: "Course completed" },
  { eventName: "badge_awarded", label: "Badge awarded" },
];

export async function getLearnerFunnel(
  productId: string,
  range: AnalyticsDateRange
): Promise<FunnelStep[]> {
  const counts = await Promise.all(
    FUNNEL_EVENTS.map((step) =>
      countProductEvents(productId, step.eventName, range)
    )
  );

  return FUNNEL_EVENTS.map((step, i) => ({
    label: step.label,
    count: counts[i],
    rateFromPrevious:
      i === 0 || counts[i - 1] === 0
        ? null
        : Math.round((counts[i] / counts[i - 1]) * 100),
  }));
}

function weekStartKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function getWeeklyTrends(
  productId: string,
  range: AnalyticsDateRange
): Promise<WeeklyTrendPoint[]> {
  const occurredAt = occurredAtFilter(range);
  const events = await prisma.analyticsEvent.findMany({
    where: {
      ecosystemProjectId: productId,
      eventName: { in: ["course_started", "course_completed"] },
      ...(occurredAt ? { occurredAt } : {}),
    },
    select: { eventName: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  });

  const buckets = new Map<string, { starts: number; completions: number }>();
  for (const e of events) {
    const key = weekStartKey(e.occurredAt);
    const bucket = buckets.get(key) ?? { starts: 0, completions: 0 };
    if (e.eventName === "course_started") bucket.starts += 1;
    if (e.eventName === "course_completed") bucket.completions += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([weekStart, data]) => ({ weekStart, ...data }));
}

function buildPartnerInsights(input: {
  funnel: FunnelStep[];
  dropOff: CourseAnalytics["dropOff"];
  completionRate: number;
}): string[] {
  const insights: string[] = [];

  for (let i = 1; i < input.funnel.length; i++) {
    const prev = input.funnel[i - 1];
    const curr = input.funnel[i];
    if (prev.count > 10 && curr.rateFromPrevious !== null && curr.rateFromPrevious < 50) {
      insights.push(
        `Many learners drop off between "${prev.label}" and "${curr.label}" (${curr.rateFromPrevious}% continue). Consider reviewing wallet friction or course entry steps.`
      );
      break;
    }
  }

  if (input.dropOff) {
    insights.push(
      `The largest lesson drop-off is at "${input.dropOff.lessonTitle}" (lesson ${input.dropOff.order + 1}). Content length or difficulty may be worth reviewing with Arcademy staff.`
    );
  }

  if (input.completionRate > 0 && input.completionRate < 20) {
    insights.push(
      `Completion rate is ${input.completionRate}% of starts in this period. Pair analytics with learner feedback to decide whether to adjust lessons or quiz difficulty.`
    );
  }

  return insights.slice(0, 3);
}

function aggregateQuizPassRate(courses: ProductCourseMetric[]): number | null {
  const withQuiz = courses.filter((c) => c.quizPassRate !== null);
  if (withQuiz.length === 0) return null;
  return Math.round(
    withQuiz.reduce((s, c) => s + (c.quizPassRate ?? 0), 0) / withQuiz.length
  );
}

export async function getPartnerPlusAnalytics(
  productId: string,
  range: AnalyticsDateRange
): Promise<PartnerPlusAnalytics | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      partnerAnalyticsNotes: true,
    },
  });
  if (!product) return null;

  const analytics = await getProductAnalytics(productId, { range });
  if (!analytics) return null;

  const publishedCourses = analytics.courses.filter(
    (c) => c.status === "published"
  );

  const [discovery, funnel, weeklyTrends] = await Promise.all([
    getDiscoveryMetrics(productId, range, analytics.starts),
    getLearnerFunnel(productId, range),
    getWeeklyTrends(productId, range),
  ]);

  const primaryDropOff = publishedCourses.length
    ? (
        await getCourseAnalytics(publishedCourses[0].courseId, { range })
      ).dropOff
    : null;

  const insights = buildPartnerInsights({
    funnel,
    dropOff: primaryDropOff,
    completionRate: analytics.completionRate,
  });

  return {
    productId: product.id,
    productName: product.name,
    rangeLabel: range.label,
    staffNotes: product.partnerAnalyticsNotes,
    summary: {
      starts: analytics.starts,
      completions: analytics.completions,
      completionRate: analytics.completionRate,
      badgeAwards: analytics.badgeAwards,
      quizPassRate: aggregateQuizPassRate(publishedCourses),
      publishedCourses: analytics.publishedCourses,
    },
    courses: publishedCourses,
    discovery,
    funnel,
    weeklyTrends,
    insights,
  };
}

export async function getPartnerPlusCourseAnalytics(
  productId: string,
  courseId: string,
  range: AnalyticsDateRange
): Promise<PartnerPlusCourseAnalytics | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, productId },
    select: { id: true, title: true, slug: true, status: true },
  });
  if (!course) return null;

  const [analytics, badgeVerificationViews, quizDiagnostics, attemptsBeforePass] =
    await Promise.all([
      getCourseAnalytics(courseId, { range }),
      countCourseEvents(courseId, "badge_verification_viewed", range),
      getQuizDiagnostics(courseId, range),
      getAttemptsBeforePass(courseId, range),
    ]);

  return {
    courseId: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    badgeVerificationViews,
    quizDiagnostics,
    attemptsBeforePass,
    ...analytics,
  };
}

export function partnerPlusReportToMarkdown(
  data: PartnerPlusAnalytics,
  courseDetails: PartnerPlusCourseAnalytics[]
): string {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const courseLines = data.courses.map((c) => {
    const pass = c.quizPassRate === null ? "n/a" : `${c.quizPassRate}%`;
    const avg = c.averageQuizScore === null ? "n/a" : `${c.averageQuizScore}%`;
    return `| ${c.title} | ${c.starts} | ${c.completions} | ${c.badgeAwards} | ${pass} | ${avg} |`;
  });

  const funnelLines = data.funnel.map(
    (s) => `| ${s.label} | ${s.count} | ${s.rateFromPrevious ?? "—"}% |`
  );

  const trendLines = data.weeklyTrends.map(
    (w) => `| ${w.weekStart} | ${w.starts} | ${w.completions} |`
  );

  const topMissed = courseDetails.flatMap((c) =>
    c.quizDiagnostics
      .filter((q) => q.attemptCount > 0)
      .sort((a, b) => b.missRate - a.missRate)
      .slice(0, 3)
      .map(
        (q) =>
          `- **${c.title}** — Q${q.order + 1}: ${q.missRate}% miss rate (${q.prompt.slice(0, 80)}${q.prompt.length > 80 ? "…" : ""})`
      )
  );

  return `# Arcademy Partner Analytics Report — ${data.productName}

Generated: ${generatedAt}
Period: ${data.rangeLabel}

## Performance summary

| Metric | Value |
| --- | --- |
| Course starts | ${data.summary.starts} |
| Completions | ${data.summary.completions} |
| Completion rate | ${data.summary.completionRate}% |
| Badge awards | ${data.summary.badgeAwards} |
| Quiz pass rate (avg) | ${data.summary.quizPassRate ?? "n/a"}% |
| Published courses | ${data.summary.publishedCourses} |

## Discovery

| Metric | Value |
| --- | --- |
| Project page views | ${data.discovery.projectPageViews} |
| Course detail views | ${data.discovery.courseDetailViews} |
| Start conversion | ${data.discovery.startConversionRate ?? "n/a"}% |
| Badge verification views | ${data.discovery.badgeVerificationViews} |

## Learner funnel

| Step | Count | Rate from previous |
| --- | ---: | ---: |
${funnelLines.join("\n")}

## Published courses

| Course | Starts | Completions | Badges | Quiz pass | Avg score |
| --- | ---: | ---: | ---: | ---: | ---: |
${courseLines.length > 0 ? courseLines.join("\n") : "| _None_ | — | — | — | — | — |"}

## Weekly trends

| Week starting | Starts | Completions |
| --- | ---: | ---: |
${trendLines.length > 0 ? trendLines.join("\n") : "| _No activity_ | — | — |"}

## Quiz diagnostics (top missed)

${topMissed.length > 0 ? topMissed.join("\n") : "_No quiz attempts in this period._"}

${data.staffNotes ? `## Staff notes\n\n${data.staffNotes}\n` : ""}

---

_Individual learner data is not included in this report._
`;
}

export function partnerPlusReportToCsv(data: PartnerPlusAnalytics): string {
  const rows = [
    ["metric", "value"],
    ["product", data.productName],
    ["period", data.rangeLabel],
    ["starts", String(data.summary.starts)],
    ["completions", String(data.summary.completions)],
    ["completion_rate_pct", String(data.summary.completionRate)],
    ["badge_awards", String(data.summary.badgeAwards)],
    ["project_page_views", String(data.discovery.projectPageViews)],
    ["course_detail_views", String(data.discovery.courseDetailViews)],
    ["badge_verification_views", String(data.discovery.badgeVerificationViews)],
    [],
    ["course", "starts", "completions", "badges", "quiz_pass_pct", "avg_score"],
    ...data.courses.map((c) => [
      c.title,
      String(c.starts),
      String(c.completions),
      String(c.badgeAwards),
      c.quizPassRate === null ? "" : String(c.quizPassRate),
      c.averageQuizScore === null ? "" : String(c.averageQuizScore),
    ]),
  ];

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
