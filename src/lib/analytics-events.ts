import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const ANALYTICS_EVENT_NAMES = [
  "course_catalog_viewed",
  "ecosystem_project_viewed",
  "ecosystem_project_referral_clicked",
  "course_detail_viewed",
  "start_course_clicked",
  "wallet_connect_started",
  "wallet_connected",
  "wallet_connect_failed",
  "course_started",
  "lesson_viewed",
  "lesson_completed",
  "quiz_started",
  "quiz_submitted",
  "quiz_passed",
  "quiz_failed",
  "lesson_knowledge_check_submitted",
  "lesson_knowledge_check_passed",
  "course_completed",
  "badge_awarded",
  "badge_verification_viewed",
  "profile_viewed",
  "partner_report_generated",
  "admin_ecosystem_project_created",
  "admin_ecosystem_project_published",
  "admin_course_created",
  "admin_course_published",
  "admin_quiz_created",
  "admin_badge_created",
  "discord_connect_started",
  "discord_connected",
  "discord_connect_failed",
  "discord_disconnected",
  "discord_role_rule_created",
  "discord_role_rule_activated",
  "discord_role_grant_queued",
  "discord_role_granted",
  "discord_role_grant_failed",
  "discord_role_grant_retried",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type TrackEventInput = {
  eventName: AnalyticsEventName | string;
  source: "client" | "server_action" | "route_handler" | "admin";
  path?: string | null;
  occurredAt?: Date;
  anonymousId?: string | null;
  userId?: string | null;
  walletAddress?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  ecosystemProjectId?: string | null;
  ecosystemProjectSlug?: string | null;
  courseId?: string | null;
  courseSlug?: string | null;
  lessonId?: string | null;
  quizId?: string | null;
  badgeId?: string | null;
  badgeAwardId?: string | null;
  verificationSlug?: string | null;
  metadata?: Record<string, unknown> | null;
};

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  const delegate = (prisma as { analyticsEvent?: { create?: unknown } })
    .analyticsEvent;
  if (!delegate || typeof delegate.create !== "function") {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[analytics] Prisma client missing analyticsEvent — run pnpm db:generate and restart dev."
      );
    }
    return;
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        eventName: input.eventName,
        occurredAt: input.occurredAt ?? new Date(),
        source: input.source,
        path: clean(input.path),
        anonymousId: clean(input.anonymousId),
        userId: clean(input.userId),
        walletAddress: clean(input.walletAddress),
        sessionId: clean(input.sessionId),
        referrer: clean(input.referrer),
        utmSource: clean(input.utmSource),
        utmMedium: clean(input.utmMedium),
        utmCampaign: clean(input.utmCampaign),
        utmContent: clean(input.utmContent),
        ecosystemProjectId: clean(input.ecosystemProjectId),
        ecosystemProjectSlug: clean(input.ecosystemProjectSlug),
        courseId: clean(input.courseId),
        courseSlug: clean(input.courseSlug),
        lessonId: clean(input.lessonId),
        quizId: clean(input.quizId),
        badgeId: clean(input.badgeId),
        badgeAwardId: clean(input.badgeAwardId),
        verificationSlug: clean(input.verificationSlug),
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics]", input.eventName, error);
    }
  }
}

/** Non-blocking server-side tracking — never throws to callers. */
export function trackEventFireAndForget(input: TrackEventInput): void {
  void trackEvent(input);
}

export async function hasAnalyticsEvent(
  eventName: string,
  filters: { userId?: string; courseId?: string }
): Promise<boolean> {
  const delegate = (prisma as { analyticsEvent?: { findFirst?: unknown } })
    .analyticsEvent;
  if (!delegate || typeof delegate.findFirst !== "function") return false;

  const row = await prisma.analyticsEvent.findFirst({
    where: {
      eventName,
      userId: filters.userId,
      courseId: filters.courseId,
    },
    select: { id: true },
  });
  return Boolean(row);
}
