import { prisma } from "@/lib/prisma";

/** Catalog cards: published courses with light counts. */
export async function getPublishedCourses() {
  return prisma.course.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "asc" },
    include: {
      badge: true,
      _count: { select: { lessons: { where: { status: "published" } } } },
    },
  });
}

export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      badge: true,
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

/** The course-level final quiz (lessonId = null), if any. */
export function getFinalQuiz<T extends { lessonId: string | null }>(
  quizzes: T[]
): T | null {
  return quizzes.find((q) => q.lessonId === null) ?? null;
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
