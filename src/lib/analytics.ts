import { prisma } from "@/lib/prisma";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import { coursePath, productPath } from "@/lib/paths";

export type CourseAnalytics = {
  starts: number;
  completions: number;
  badgeAwards: number;
  quizPassRate: number | null; // 0-100, distinct learners
  averageQuizScore: number | null; // 0-100, across attempts
  attempts: number;
  dropOff: { lessonTitle: string; order: number } | null;
  lessonFunnel: { title: string; order: number; completed: number }[];
};

export async function getCourseAnalytics(
  courseId: string
): Promise<CourseAnalytics> {
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
    prisma.badgeAward.count({ where: { courseId } }),
  ]);

  const lessonIds = lessons.map((l) => l.id);

  // Starts = distinct learners with any progress in the course.
  const starters = await prisma.progress.findMany({
    where: { courseId },
    distinct: ["userId"],
    select: { userId: true },
  });
  const starts = starters.length;

  // Per-lesson completion counts (funnel).
  const lessonFunnel = await Promise.all(
    lessons.map(async (l) => ({
      title: l.title,
      order: l.order,
      completed: await prisma.progress.count({
        where: { lessonId: l.id, completed: true },
      }),
    }))
  );

  // Drop-off = step with the largest fall in completers (baseline = starts).
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

  // Quiz metrics.
  let quizPassRate: number | null = null;
  let averageQuizScore: number | null = null;
  let attempts = 0;
  if (finalQuiz) {
    const allAttempts = await prisma.quizAttempt.findMany({
      where: { quizId: finalQuiz.id },
      select: { userId: true, score: true, passed: true },
    });
    attempts = allAttempts.length;
    if (attempts > 0) {
      averageQuizScore = Math.round(
        allAttempts.reduce((sum, a) => sum + a.score, 0) / attempts
      );
      const byUser = new Map<string, boolean>();
      for (const a of allAttempts) {
        byUser.set(a.userId, byUser.get(a.userId) || a.passed);
      }
      const passed = [...byUser.values()].filter(Boolean).length;
      quizPassRate = Math.round((passed / byUser.size) * 100);
    }
  }

  // Completions = learners who finished all lessons + passed final quiz.
  let completions = 0;
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
        where: { quizId: finalQuiz.id, passed: true, userId: { in: finishers } },
        distinct: ["userId"],
        select: { userId: true },
      });
      completions = passers.length;
    }
  }

  return {
    starts,
    completions,
    badgeAwards,
    quizPassRate,
    averageQuizScore,
    attempts,
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

/** Aggregates learner metrics across all courses for an ecosystem project. */
export async function getProductAnalytics(
  productId: string
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
      const analytics = await getCourseAnalytics(course.id);
      return {
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        starts: analytics.starts,
        completions: analytics.completions,
        badgeAwards: analytics.badgeAwards,
        quizPassRate: analytics.quizPassRate,
      };
    })
  );

  const starts = courseMetrics.reduce((sum, c) => sum + c.starts, 0);
  const completions = courseMetrics.reduce((sum, c) => sum + c.completions, 0);
  const badgeAwards = courseMetrics.reduce((sum, c) => sum + c.badgeAwards, 0);
  const publishedCourses = product.courses.filter((c) => c.status === "published").length;

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    publishedCourses,
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

/** Partner-visible metrics only — published courses, no internal IDs or draft data. */
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

/** Staff-generated summary for manual partner sharing (no partner dashboard). */
export async function generatePartnerReport(
  productId: string
): Promise<PartnerReport | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      courses: {
        where: { status: "published" },
        orderBy: { title: "asc" },
        select: { slug: true, title: true },
      },
    },
  });
  if (!product) return null;

  const analytics = await getProductAnalytics(productId);
  if (!analytics) return null;

  const projectUrl = absoluteUrl(productPath(product.slug));
  const generatedAt = new Date().toISOString().slice(0, 10);
  const siteNote = getSiteUrl()
    ? ""
    : "\n> Set `NEXT_PUBLIC_APP_URL` for absolute referral links in exports.\n";

  const partnerLinks = (Array.isArray(product.links) ? product.links : []).filter(
    (link): link is { label: string; url: string } =>
      typeof link === "object" &&
      link !== null &&
      "label" in link &&
      "url" in link &&
      typeof link.label === "string" &&
      typeof link.url === "string"
  );
  const partnerLinkLines = partnerLinks
    .map((link) => `- **${link.label}:** ${link.url}`)
    .join("\n");

  const courseLines = analytics.courses
    .filter((c) => c.status === "published")
    .map((c) => {
      const url = absoluteUrl(coursePath(product.slug, c.slug));
      const pass =
        c.quizPassRate === null ? "n/a" : `${c.quizPassRate}%`;
      return `| ${c.title} | ${c.starts} | ${c.completions} | ${c.badgeAwards} | ${pass} | ${url} |`;
    });

  const suggestedCopy = [
    `Learn ${product.name} on Arcademy — the official learning destination for the Arcium ecosystem.`,
    projectUrl,
  ].join(" ");

  const markdown = `# Arcademy Partner Report — ${product.name}

Generated: ${generatedAt}
${siteNote}
## Ecosystem project

- **Name:** ${product.name}
- **Partner:** ${product.partnerName ?? "—"}
- **Arcademy page:** ${projectUrl}
${partnerLinkLines ? `${partnerLinkLines}\n` : ""}

## Performance summary

| Metric | Value |
| --- | --- |
| Published courses | ${analytics.publishedCourses} |
| Course starts | ${analytics.starts} |
| Course completions | ${analytics.completions} |
| Completion rate | ${analytics.completionRate}% of starts |
| Badge awards | ${analytics.badgeAwards} |

## Published courses

| Course | Starts | Completions | Badges | Quiz pass rate | URL |
| --- | ---: | ---: | ---: | ---: | --- |
${courseLines.length > 0 ? courseLines.join("\n") : "| _No published courses yet_ | — | — | — | — | — |"}

## Suggested referral copy

\`\`\`
${suggestedCopy}
\`\`\`

## Referral placement ideas

- Product onboarding or docs "Learn" section
- Welcome email or community announcement
- Campaign landing pages with UTM parameters

---

_This report was generated by Arcademy staff. V1 does not include a partner login or self-service analytics portal._
`;

  const slug = product.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return {
    markdown,
    filename: `arcademy-partner-report-${slug}-${generatedAt}.md`,
  };
}
