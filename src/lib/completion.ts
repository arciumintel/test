import { prisma } from "@/lib/prisma";
import {
  backfillBadgeAwardMetadata,
  generateVerificationSlug,
} from "@/lib/badges";
import { coursePath } from "@/lib/paths";
import {
  buildCourseRequirementsSnapshot,
  buildLearnerCompletionSnapshot,
  evaluateCourseRequirements,
  isCompletableCourse,
} from "@/lib/course-completion";
import {
  emitBadgeAwardedSideEffects,
  emitCourseCompletedSideEffects,
} from "@/lib/completion-side-effects";

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
          where: { status: "published" },
          select: { id: true, required: true },
        },
        quizzes: {
          where: { lessonId: null, status: "published" },
          select: { id: true },
          take: 1,
        },
        badge: true,
        product: { select: { id: true, slug: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    }),
  ]);

  if (!course || !user) return { completed: false, newlyAwarded: false };

  const finalQuizId = course.quizzes[0]?.id ?? null;
  const requirements = buildCourseRequirementsSnapshot({
    lessons: course.lessons,
    finalQuizId,
  });

  if (!isCompletableCourse(requirements)) {
    return { completed: false, newlyAwarded: false };
  }

  const requiredLessonIds = requirements.requiredLessonIds;

  const [completedProgress, passedAttempt] = await Promise.all([
    requiredLessonIds.length === 0
      ? Promise.resolve([])
      : prisma.progress.findMany({
          where: {
            userId,
            lessonId: { in: requiredLessonIds },
            completed: true,
          },
          select: { lessonId: true },
        }),
    finalQuizId
      ? prisma.quizAttempt.findFirst({
          where: { userId, quizId: finalQuizId, passed: true },
        })
      : Promise.resolve(null),
  ]);

  const completedLessonIds = new Set(
    completedProgress.map((row) => row.lessonId)
  );
  const learner = buildLearnerCompletionSnapshot({
    completedLessonIds,
    finalQuizId,
    finalQuizPassed: Boolean(passedAttempt),
  });

  const completed = evaluateCourseRequirements(requirements, learner);
  if (!completed) return { completed: false, newlyAwarded: false };

  const path = coursePath(course.product.slug, course.slug);
  await emitCourseCompletedSideEffects({
    userId,
    courseId,
    courseSlug: course.slug,
    path,
    productId: course.product.id,
    productSlug: course.product.slug,
    completedLessonCount: completedLessonIds.size,
    totalRequiredLessonCount: requiredLessonIds.length,
    finalQuizId,
  });

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
      select: { id: true, verificationSlug: true },
    });
    return {
      completed: true,
      newlyAwarded: false,
      verificationSlug: award?.verificationSlug ?? undefined,
    };
  }

  const award = await prisma.badgeAward.findFirst({
    where: { userId, badgeId: course.badge.id },
    select: { id: true },
  });

  if (award?.id) {
    emitBadgeAwardedSideEffects({
      userId,
      courseId,
      courseSlug: course.slug,
      courseTitle: course.title,
      badgeId: course.badge.id,
      badgeName: course.badge.name,
      badgeAwardId: award.id,
      verificationSlug: slug,
      path,
      productId: course.product.id,
      productSlug: course.product.slug,
    });
  }

  return { completed: true, newlyAwarded: true, verificationSlug: slug };
}
