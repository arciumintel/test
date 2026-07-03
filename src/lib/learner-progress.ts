import { prisma } from "@/lib/prisma";
import { coursePath, lessonPath, productPath, quizPath } from "@/lib/paths";
import type { ProductProgressState } from "@/lib/product-catalog";

export type LearnerCourseProgress = {
  courseId: string;
  slug: string;
  productSlug: string;
  title: string;
  productName: string;
  totalLessons: number;
  completedLessons: number;
  pct: number;
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
  totalLessons: number;
  completedLessonIds: Set<string>;
  finalQuizId: string | null;
  lessonIds: string[];
  completed: boolean;
  lastActivityAt: Date;
};

export async function getLearnerCourseProgressList(
  userId: string
): Promise<LearnerCourseProgress[]> {
  const [progressRows, passedAttempts, awards] = await Promise.all([
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
              select: { id: true },
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
    prisma.badgeAward.findMany({
      where: { userId },
      select: { courseId: true },
    }),
  ]);

  const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
  const awardedCourseIds = new Set(awards.map((a) => a.courseId));

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
        totalLessons: c.lessons.length,
        completedLessonIds: new Set(),
        finalQuizId: c.quizzes[0]?.id ?? null,
        lessonIds: c.lessons.map((l) => l.id),
        completed: awardedCourseIds.has(c.id),
        lastActivityAt: row.updatedAt,
      };
      byCourse.set(c.id, agg);
    }

    if (row.completed) agg.completedLessonIds.add(row.lessonId);
    if (row.updatedAt > agg.lastActivityAt) agg.lastActivityAt = row.updatedAt;
  }

  return [...byCourse.values()].map((agg) => {
    const completedLessons = agg.completedLessonIds.size;
    const quizDone = agg.finalQuizId ? passedQuizIds.has(agg.finalQuizId) : true;
    const totalSteps = agg.totalLessons + (agg.finalQuizId ? 1 : 0);
    const doneSteps = completedLessons + (agg.finalQuizId && quizDone ? 1 : 0);
    const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

    const nextLessonId = agg.lessonIds.find(
      (id) => !agg.completedLessonIds.has(id)
    );
    let resumeHref = coursePath(agg.productSlug, agg.slug);
    if (nextLessonId) {
      resumeHref = lessonPath(agg.productSlug, agg.slug, nextLessonId);
    } else if (agg.finalQuizId && !quizDone) {
      resumeHref = quizPath(agg.productSlug, agg.slug);
    }

    return {
      courseId: agg.courseId,
      slug: agg.slug,
      productSlug: agg.productSlug,
      title: agg.title,
      productName: agg.productName,
      totalLessons: agg.totalLessons,
      completedLessons,
      pct,
      completed: agg.completed,
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
