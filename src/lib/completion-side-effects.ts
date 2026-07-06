import {
  hasAnalyticsEvent,
  trackEventFireAndForget,
} from "@/lib/analytics-events";

export type CourseCompletedSideEffectContext = {
  userId: string;
  courseId: string;
  courseSlug: string;
  path: string;
  productId: string;
  productSlug: string;
  completedLessonCount: number;
  totalRequiredLessonCount: number;
  finalQuizId: string | null;
};

export type BadgeAwardedSideEffectContext = {
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  badgeId: string;
  badgeName: string;
  badgeAwardId: string;
  verificationSlug: string;
  path: string;
  productId: string;
  productSlug: string;
};

/** Idempotent course_completed analytics when requirements are first met. */
export async function emitCourseCompletedSideEffects(
  ctx: CourseCompletedSideEffectContext
): Promise<void> {
  const alreadyLogged = await hasAnalyticsEvent("course_completed", {
    userId: ctx.userId,
    courseId: ctx.courseId,
  });
  if (alreadyLogged) return;

  trackEventFireAndForget({
    eventName: "course_completed",
    source: "server_action",
    path: ctx.path,
    userId: ctx.userId,
    courseId: ctx.courseId,
    courseSlug: ctx.courseSlug,
    ecosystemProjectId: ctx.productId,
    ecosystemProjectSlug: ctx.productSlug,
    metadata: {
      completedLessonCount: ctx.completedLessonCount,
      totalRequiredLessonCount: ctx.totalRequiredLessonCount,
      quizId: ctx.finalQuizId,
    },
  });
}

/** Fire-and-forget side effects after a new badge award is persisted. */
export function emitBadgeAwardedSideEffects(
  ctx: BadgeAwardedSideEffectContext
): void {
  trackEventFireAndForget({
    eventName: "badge_awarded",
    source: "server_action",
    path: ctx.path,
    userId: ctx.userId,
    courseId: ctx.courseId,
    courseSlug: ctx.courseSlug,
    badgeId: ctx.badgeId,
    badgeAwardId: ctx.badgeAwardId,
    verificationSlug: ctx.verificationSlug,
    ecosystemProjectId: ctx.productId,
    ecosystemProjectSlug: ctx.productSlug,
  });

  void import("@/lib/notifications").then(({ createNotification }) =>
    createNotification({
      userId: ctx.userId,
      type: "badge_awarded",
      title: `Badge earned: ${ctx.badgeName}`,
      body: `You completed ${ctx.courseTitle}.`,
      actionUrl: `/verify/${ctx.verificationSlug}`,
    })
  );

  void import("@/lib/discord-role-grants").then(
    ({ queueDiscordRoleGrantsForBadgeAward }) =>
      queueDiscordRoleGrantsForBadgeAward(ctx.badgeAwardId)
  );
}
