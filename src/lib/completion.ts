import { prisma } from "@/lib/prisma";
import {
  backfillBadgeAwardMetadata,
  generateVerificationSlug,
} from "@/lib/badges";

export type CompletionResult = {
  completed: boolean;
  newlyAwarded: boolean;
  verificationSlug?: string;
};

/**
 * Evaluates Arcademy's course completion rule for a learner and awards a
 * badge when met. A course is complete when:
 *   1. Every required published lesson is marked complete (optional lessons
 *      do not block completion).
 *   2. The course-level final quiz is passed (if one exists).
 *   3. The learner has a connected wallet (guaranteed by having a User row).
 */
export async function evaluateCourseCompletion(
  userId: string,
  courseId: string
): Promise<CompletionResult> {
  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { status: "published", required: true },
          select: { id: true },
        },
        quizzes: { where: { lessonId: null }, select: { id: true } },
        badge: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    }),
  ]);

  if (!course || !user) return { completed: false, newlyAwarded: false };

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
  if (!course.badge || course.badge.status !== "published") {
    return { completed: true, newlyAwarded: false };
  }

  const existing = await prisma.badgeAward.findFirst({
    where: { userId, badgeId: course.badge.id },
  });
  if (existing) {
    const slug = await backfillBadgeAwardMetadata(existing.id, user.walletAddress);
    return {
      completed: true,
      newlyAwarded: false,
      verificationSlug: slug ?? existing.verificationSlug ?? undefined,
    };
  }

  const slug = generateVerificationSlug();
  const created = await prisma.badgeAward.createMany({
    data: [
      {
        userId,
        badgeId: course.badge.id,
        courseId,
        walletAddress: user.walletAddress,
        verificationSlug: slug,
      },
    ],
    skipDuplicates: true,
  });

  if (created.count === 0) {
    const award = await prisma.badgeAward.findFirst({
      where: { userId, badgeId: course.badge.id },
      select: { verificationSlug: true },
    });
    return {
      completed: true,
      newlyAwarded: false,
      verificationSlug: award?.verificationSlug ?? undefined,
    };
  }

  return { completed: true, newlyAwarded: true, verificationSlug: slug };
}
