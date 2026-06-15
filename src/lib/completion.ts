import { prisma } from "@/lib/prisma";

/**
 * Evaluates Arcademy's course completion rule for a learner and awards a
 * badge when met. A course is complete when:
 *   1. Every required published lesson is marked complete (optional lessons
 *      do not block completion).
 *   2. The course-level final quiz is passed (if one exists).
 *   3. The learner has a connected wallet (guaranteed by having a User row).
 *
 * Returns whether a badge was newly awarded.
 */
export async function evaluateCourseCompletion(
  userId: string,
  courseId: string
): Promise<{ completed: boolean; newlyAwarded: boolean }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        where: { status: "published", required: true },
        select: { id: true },
      },
      quizzes: { where: { lessonId: null }, select: { id: true } },
      badge: true,
    },
  });

  if (!course) return { completed: false, newlyAwarded: false };

  const requiredLessonIds = course.lessons.map((l) => l.id);
  const finalQuiz = course.quizzes[0] ?? null;

  // Guard against an empty course (no required lessons and no quiz) so a
  // contentless course can never auto-award a badge.
  if (requiredLessonIds.length === 0 && !finalQuiz) {
    return { completed: false, newlyAwarded: false };
  }

  // 1. All required published lessons complete (vacuously true when none).
  const completedCount =
    requiredLessonIds.length === 0
      ? 0
      : await prisma.progress.count({
          where: { userId, lessonId: { in: requiredLessonIds }, completed: true },
        });
  const allRequiredDone = completedCount === requiredLessonIds.length;

  // 2. Final quiz passed (only required if a final quiz exists).
  let finalQuizPassed = true;
  if (finalQuiz) {
    const passed = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: finalQuiz.id, passed: true },
    });
    finalQuizPassed = Boolean(passed);
  }

  const completed = allRequiredDone && finalQuizPassed;
  if (!completed) return { completed: false, newlyAwarded: false };

  // 3. Award the badge (idempotent).
  if (!course.badge) return { completed: true, newlyAwarded: false };

  const existing = await prisma.badgeAward.findFirst({
    where: { userId, badgeId: course.badge.id },
  });
  if (existing) return { completed: true, newlyAwarded: false };

  await prisma.badgeAward.create({
    data: { userId, badgeId: course.badge.id, courseId },
  });

  return { completed: true, newlyAwarded: true };
}
