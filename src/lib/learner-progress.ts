import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import type { ProductProgressState } from "@/lib/product-catalog";
import {
  buildCourseRequirementsSnapshot,
  buildLearnerCompletionSnapshot,
  computeCourseCompletionProgress,
  computeResumeHref,
  evaluateCourseRequirements,
} from "@/lib/course-completion";

export type LearnerCourseProgress = {
  courseId: string;
  slug: string;
  productSlug: string;
  title: string;
  productName: string;
  /** Required lessons on the completion path. */
  totalLessons: number;
  /** Required lessons marked complete. */
  completedLessons: number;
  pct: number;
  /** Requirements met (required lessons + final quiz). */
  completed: boolean;
  resumeHref: string;
  lastActivityAt: Date;
};

type CourseAgg = {
  courseId: string;
  slug: string;
  productSlug: string;
  title: string;
  productName: string;
  requiredLessonIds: string[];
  publishedLessonIds: string[];
  completedLessonIds: Set<string>;
  finalQuizId: string | null;
  lastActivityAt: Date;
};

export async function getLearnerCourseProgressList(
  userId: string
): Promise<LearnerCourseProgress[]> {
  const [progressRows, passedAttempts] = await Promise.all([
    prisma.progress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            product: { select: { slug: true, name: true } },
            lessons: {
              where: { status: "published" },
              orderBy: { order: "asc" },
              select: { id: true, required: true },
            },
            quizzes: {
              where: { lessonId: null, status: "published" },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { quizId: true },
    }),
  ]);

  const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
  const byCourse = new Map<string, CourseAgg>();

  for (const row of progressRows) {
    const c = row.course;
    if (c.status !== "published") continue;

    let agg = byCourse.get(c.id);
    if (!agg) {
      agg = {
        courseId: c.id,
        slug: c.slug,
        productSlug: c.product.slug,
        title: c.title,
        productName: c.product.name,
        requiredLessonIds: c.lessons.filter((l) => l.required).map((l) => l.id),
        publishedLessonIds: c.lessons.map((l) => l.id),
        completedLessonIds: new Set(),
        finalQuizId: c.quizzes[0]?.id ?? null,
        lastActivityAt: row.updatedAt,
      };
      byCourse.set(c.id, agg);
    }

    if (row.completed) agg.completedLessonIds.add(row.lessonId);
    if (row.updatedAt > agg.lastActivityAt) agg.lastActivityAt = row.updatedAt;
  }

  return [...byCourse.values()].map((agg) => {
    const finalQuizId = agg.finalQuizId;
    const finalQuizPassed = finalQuizId ? passedQuizIds.has(finalQuizId) : false;
    const requirements = buildCourseRequirementsSnapshot({
      lessons: agg.requiredLessonIds.map((id) => ({ id, required: true })),
      finalQuizId,
    });
    const learner = buildLearnerCompletionSnapshot({
      completedLessonIds: agg.completedLessonIds,
      finalQuizId,
      finalQuizPassed,
    });
    const progress = computeCourseCompletionProgress(requirements, learner);
    const completed = evaluateCourseRequirements(requirements, learner);
    const resumeHref = computeResumeHref({
      productSlug: agg.productSlug,
      courseSlug: agg.slug,
      publishedLessonIds: agg.publishedLessonIds,
      completedLessonIds: agg.completedLessonIds,
      finalQuizId,
      finalQuizPassed,
    });

    return {
      courseId: agg.courseId,
      slug: agg.slug,
      productSlug: agg.productSlug,
      title: agg.title,
      productName: agg.productName,
      totalLessons: progress.totalRequiredLessons,
      completedLessons: progress.completedRequiredLessons,
      pct: progress.pct,
      completed,
      resumeHref,
      lastActivityAt: agg.lastActivityAt,
    };
  });
}

export function getInProgressCourses(
  courses: LearnerCourseProgress[]
): LearnerCourseProgress[] {
  return courses
    .filter((c) => !c.completed && c.pct < 100)
    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
}

export function getMostRecentInProgress(
  courses: LearnerCourseProgress[]
): LearnerCourseProgress | null {
  return getInProgressCourses(courses)[0] ?? null;
}

export function buildProductProgressMap(
  courses: LearnerCourseProgress[]
): Record<string, ProductProgressState> {
  const byProduct = new Map<string, LearnerCourseProgress[]>();

  for (const course of courses) {
    if (course.pct <= 0 && !course.completed) continue;
    const list = byProduct.get(course.productSlug) ?? [];
    list.push(course);
    byProduct.set(course.productSlug, list);
  }

  const result: Record<string, ProductProgressState> = {};

  for (const [productSlug, productCourses] of byProduct) {
    const completed = productCourses.every((course) => course.completed);
    const pct = completed
      ? 100
      : Math.round(
          productCourses.reduce((sum, course) => sum + course.pct, 0) /
            productCourses.length
        );
    const resumeCourse =
      getInProgressCourses(productCourses)[0] ??
      productCourses.sort(
        (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
      )[0];

    result[productSlug] = {
      pct,
      completed,
      resumeHref: resumeCourse?.resumeHref ?? productPath(productSlug),
    };
  }

  return result;
}
