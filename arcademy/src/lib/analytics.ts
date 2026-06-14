import { prisma } from "@/lib/prisma";

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
