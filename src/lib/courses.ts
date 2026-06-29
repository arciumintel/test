import { prisma } from "@/lib/prisma";
import type { CourseCatalogFilters } from "@/lib/course-catalog";
import type { CourseLevel } from "@prisma/client";
import { normalizeLinks } from "@/lib/products";

/** Catalog cards: published courses with light counts. */
export async function getPublishedCourses(filters?: CourseCatalogFilters) {
  const orderBy =
    filters?.sort === "newest"
      ? { createdAt: "desc" as const }
      : filters?.sort === "duration"
        ? { estimatedDuration: "asc" as const }
        : { createdAt: "asc" as const };

  return prisma.course.findMany({
    where: {
      status: "published",
      product: {
        status: "published",
        ...(filters?.productSlug ? { slug: filters.productSlug } : {}),
      },
      ...(filters?.level ? { level: filters.level } : {}),
      ...(filters?.courseType ? { courseType: filters.courseType } : {}),
    },
    orderBy,
    include: {
      product: true,
      badge: true,
      _count: { select: { lessons: { where: { status: "published" } } } },
    },
  });
}

export async function getPublishedCourseFilterOptions() {
  const [products, levels, types] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "published",
        courses: { some: { status: "published" } },
      },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.course.groupBy({
      by: ["level"],
      where: { status: "published", product: { status: "published" } },
    }),
    prisma.course.groupBy({
      by: ["courseType"],
      where: { status: "published", product: { status: "published" } },
    }),
  ]);

  return {
    products,
    levels: levels.map((row) => row.level),
    types: types.map((row) => row.courseType),
  };
}

export async function getCourseBySlugs(productSlug: string, courseSlug: string) {
  return prisma.course.findFirst({
    where: {
      slug: courseSlug,
      product: { slug: productSlug, status: "published" },
    },
    include: {
      product: true,
      badge: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { status: "published" },
            orderBy: { order: "asc" },
          },
        },
      },
      lessons: {
        where: { status: "published" },
        orderBy: { order: "asc" },
      },
      quizzes: {
        include: { _count: { select: { questions: true } } },
      },
    },
  });
}

export type CourseLessonOutlineItem = {
  id: string;
  title: string;
  order: number;
};

export type CourseModuleOutlineGroup = {
  id: string | null;
  title: string;
  lessons: CourseLessonOutlineItem[];
};

/** Groups published lessons by module when modules exist; otherwise one flat group. */
export function buildCourseModuleOutline(course: {
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: CourseLessonOutlineItem[];
  }[];
  lessons: (CourseLessonOutlineItem & { moduleId: string | null })[];
}): CourseModuleOutlineGroup[] {
  if (course.modules.length === 0) {
    return [
      {
        id: null,
        title: "Lessons",
        lessons: course.lessons.map(({ id, title, order }) => ({
          id,
          title,
          order,
        })),
      },
    ];
  }

  const groups: CourseModuleOutlineGroup[] = course.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    lessons: mod.lessons.map(({ id, title, order }) => ({ id, title, order })),
  }));

  const ungrouped = course.lessons.filter((l) => !l.moduleId);
  if (ungrouped.length > 0) {
    groups.push({
      id: null,
      title: "Additional lessons",
      lessons: ungrouped.map(({ id, title, order }) => ({ id, title, order })),
    });
  }

  return groups;
}

/** The course-level final quiz (lessonId = null), if any. */
export function getFinalQuiz<T extends { lessonId: string | null }>(
  quizzes: T[]
): T | null {
  return quizzes.find((q) => q.lessonId === null) ?? null;
}

/** Published optional knowledge check for a lesson, if any. */
export function getLessonKnowledgeCheck<
  T extends { lessonId: string | null; status: string },
>(quizzes: T[], lessonId: string): T | null {
  return (
    quizzes.find(
      (q) => q.lessonId === lessonId && q.status === "published"
    ) ?? null
  );
}

export type LearnerCourseState = {
  startedAt: Date | null;
  completedLessonIds: Set<string>;
  finalQuizPassed: boolean;
  badgeAwarded: boolean;
};

/** Resolves a learner's progress signals for a single course. */
export async function getLearnerCourseState(
  userId: string,
  courseId: string,
  finalQuizId: string | null
): Promise<LearnerCourseState> {
  const [progress, passedAttempt, award] = await Promise.all([
    prisma.progress.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: "asc" },
    }),
    finalQuizId
      ? prisma.quizAttempt.findFirst({
          where: { userId, quizId: finalQuizId, passed: true },
        })
      : Promise.resolve(null),
    prisma.badgeAward.findFirst({ where: { userId, courseId } }),
  ]);

  return {
    startedAt: progress[0]?.createdAt ?? null,
    completedLessonIds: new Set(
      progress.filter((p) => p.completed).map((p) => p.lessonId)
    ),
    finalQuizPassed: Boolean(passedAttempt),
    badgeAwarded: Boolean(award),
  };
}

export type CoursePrerequisite = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  level: CourseLevel;
  product: { slug: string; name: string };
};

export async function getPublishedCoursePrerequisites(
  prerequisiteCourseIds: string[]
): Promise<CoursePrerequisite[]> {
  if (prerequisiteCourseIds.length === 0) return [];

  const courses = await prisma.course.findMany({
    where: {
      id: { in: prerequisiteCourseIds },
      status: "published",
      product: { status: "published" },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      level: true,
      product: { select: { slug: true, name: true } },
    },
  });

  const byId = new Map(courses.map((course) => [course.id, course]));
  return prerequisiteCourseIds
    .map((id) => byId.get(id))
    .filter((course): course is CoursePrerequisite => Boolean(course));
}

export type PostCompletionRecommendations = {
  courses: {
    slug: string;
    title: string;
    summary: string;
    level: CourseLevel;
    product: { slug: string; name: string };
  }[];
  productLinks: ReturnType<typeof normalizeLinks>;
  productName: string;
  productSlug: string;
};

export async function getPostCompletionRecommendations(
  courseId: string,
  productId: string,
  limit = 3
): Promise<PostCompletionRecommendations> {
  const [siblingCourses, product] = await Promise.all([
    prisma.course.findMany({
      where: {
        productId,
        status: "published",
        id: { not: courseId },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        slug: true,
        title: true,
        summary: true,
        level: true,
        product: { select: { slug: true, name: true } },
      },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, slug: true, links: true },
    }),
  ]);

  let moreCourses = siblingCourses;
  if (moreCourses.length < limit) {
    const extras = await prisma.course.findMany({
      where: {
        status: "published",
        id: { not: courseId },
        productId: { not: productId },
        product: { status: "published" },
      },
      orderBy: { createdAt: "asc" },
      take: limit - moreCourses.length,
      select: {
        slug: true,
        title: true,
        summary: true,
        level: true,
        product: { select: { slug: true, name: true } },
      },
    });
    moreCourses = [...moreCourses, ...extras];
  }

  return {
    courses: moreCourses,
    productLinks: normalizeLinks(product?.links),
    productName: product?.name ?? "",
    productSlug: product?.slug ?? "",
  };
}
