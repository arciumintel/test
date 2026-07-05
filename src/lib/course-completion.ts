import { prisma } from "@/lib/prisma";
import { coursePath, lessonPath, quizPath } from "@/lib/paths";

/** Published course structure needed to evaluate completion rules. */
export type CourseRequirementsSnapshot = {
  requiredLessonIds: string[];
  finalQuizId: string | null;
};

/** Learner signals needed to evaluate completion rules. */
export type LearnerCompletionSnapshot = {
  completedLessonIds: Set<string>;
  finalQuizPassed: boolean;
};

export type CourseCompletionProgress = {
  completedRequiredLessons: number;
  totalRequiredLessons: number;
  finalQuizPassed: boolean;
  hasFinalQuiz: boolean;
  pct: number;
};

export type CourseCompletionState = {
  startedAt: Date | null;
  requirementsMet: boolean;
  /** Learner-facing completion (requirements met; badge is separate). */
  completed: boolean;
  badgeAwarded: boolean;
  completedLessonIds: Set<string>;
  progress: CourseCompletionProgress;
  resumeHref: string;
};

/** A course with no required lessons and no final quiz cannot be completed. */
export function isCompletableCourse(course: CourseRequirementsSnapshot): boolean {
  return course.requiredLessonIds.length > 0 || course.finalQuizId !== null;
}

/**
 * Pure completion predicate from CONTEXT.md:
 * required published lessons done + final quiz passed (when present).
 */
export function evaluateCourseRequirements(
  course: CourseRequirementsSnapshot,
  learner: LearnerCompletionSnapshot
): boolean {
  if (!isCompletableCourse(course)) return false;

  const allRequiredDone = course.requiredLessonIds.every((id) =>
    learner.completedLessonIds.has(id)
  );
  const quizSatisfied = course.finalQuizId ? learner.finalQuizPassed : true;

  return allRequiredDone && quizSatisfied;
}

/** Progress toward completion: required lessons + final quiz only. */
export function computeCourseCompletionProgress(
  course: CourseRequirementsSnapshot,
  learner: LearnerCompletionSnapshot
): CourseCompletionProgress {
  const totalRequiredLessons = course.requiredLessonIds.length;
  const completedRequiredLessons = course.requiredLessonIds.filter((id) =>
    learner.completedLessonIds.has(id)
  ).length;
  const hasFinalQuiz = course.finalQuizId !== null;
  const finalQuizPassed = learner.finalQuizPassed;

  const totalSteps = totalRequiredLessons + (hasFinalQuiz ? 1 : 0);
  const doneSteps =
    completedRequiredLessons + (hasFinalQuiz && finalQuizPassed ? 1 : 0);
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return {
    completedRequiredLessons,
    totalRequiredLessons,
    finalQuizPassed,
    hasFinalQuiz,
    pct,
  };
}

export function computeResumeHref(params: {
  productSlug: string;
  courseSlug: string;
  publishedLessonIds: string[];
  completedLessonIds: Set<string>;
  finalQuizId: string | null;
  finalQuizPassed: boolean;
}): string {
  const {
    productSlug,
    courseSlug,
    publishedLessonIds,
    completedLessonIds,
    finalQuizId,
    finalQuizPassed,
  } = params;

  const nextLessonId = publishedLessonIds.find(
    (id) => !completedLessonIds.has(id)
  );
  if (nextLessonId) return lessonPath(productSlug, courseSlug, nextLessonId);
  if (finalQuizId && !finalQuizPassed) return quizPath(productSlug, courseSlug);
  return coursePath(productSlug, courseSlug);
}

export function buildCourseRequirementsSnapshot(input: {
  lessons: Array<{ id: string; required: boolean }>;
  finalQuizId: string | null;
}): CourseRequirementsSnapshot {
  return {
    requiredLessonIds: input.lessons.filter((l) => l.required).map((l) => l.id),
    finalQuizId: input.finalQuizId,
  };
}

export function buildLearnerCompletionSnapshot(input: {
  completedLessonIds: Set<string>;
  finalQuizId: string | null;
  finalQuizPassed: boolean;
}): LearnerCompletionSnapshot {
  return {
    completedLessonIds: input.completedLessonIds,
    finalQuizPassed: input.finalQuizId ? input.finalQuizPassed : false,
  };
}

function resolveCompletionState(params: {
  productSlug: string;
  courseSlug: string;
  publishedLessonIds: string[];
  requirements: CourseRequirementsSnapshot;
  learner: LearnerCompletionSnapshot;
  startedAt: Date | null;
  badgeAwarded: boolean;
}): CourseCompletionState {
  const requirementsMet = evaluateCourseRequirements(
    params.requirements,
    params.learner
  );
  const progress = computeCourseCompletionProgress(
    params.requirements,
    params.learner
  );

  return {
    startedAt: params.startedAt,
    requirementsMet,
    completed: requirementsMet,
    badgeAwarded: params.badgeAwarded,
    completedLessonIds: params.learner.completedLessonIds,
    progress,
    resumeHref: computeResumeHref({
      productSlug: params.productSlug,
      courseSlug: params.courseSlug,
      publishedLessonIds: params.publishedLessonIds,
      completedLessonIds: params.learner.completedLessonIds,
      finalQuizId: params.requirements.finalQuizId,
      finalQuizPassed: params.learner.finalQuizPassed,
    }),
  };
}

/** Resolves a learner's completion state for a single course. */
export async function getCourseCompletionState(
  userId: string,
  courseId: string
): Promise<CourseCompletionState | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      slug: true,
      product: { select: { slug: true } },
      lessons: {
        where: { status: "published" },
        orderBy: { order: "asc" },
        select: { id: true, required: true },
      },
      quizzes: {
        where: { lessonId: null, status: "published" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!course) return null;

  const publishedLessonIds = course.lessons.map((l) => l.id);
  const finalQuizId = course.quizzes[0]?.id ?? null;
  const requirements = buildCourseRequirementsSnapshot({
    lessons: course.lessons,
    finalQuizId,
  });

  const [progressRows, passedAttempt, award] = await Promise.all([
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

  const completedLessonIds = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.lessonId)
  );
  const learner = buildLearnerCompletionSnapshot({
    completedLessonIds,
    finalQuizId,
    finalQuizPassed: Boolean(passedAttempt),
  });

  return resolveCompletionState({
    productSlug: course.product.slug,
    courseSlug: course.slug,
    publishedLessonIds,
    requirements,
    learner,
    startedAt: progressRows[0]?.createdAt ?? null,
    badgeAwarded: Boolean(award),
  });
}
