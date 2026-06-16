"use server";

import { z } from "zod";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics-events";
import { getCurrentUser } from "@/lib/session";

const clientEventSchema = z.object({
  eventName: z.string().min(1).max(80),
  path: z.string().min(1).max(500),
  sessionId: z.string().max(80).optional().nullable(),
  anonymousId: z.string().max(80).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
  utmContent: z.string().max(120).optional().nullable(),
  ecosystemProjectId: z.string().optional().nullable(),
  ecosystemProjectSlug: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  courseSlug: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  quizId: z.string().optional().nullable(),
  badgeId: z.string().optional().nullable(),
  badgeAwardId: z.string().optional().nullable(),
  verificationSlug: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function trackClientEvent(
  raw: z.input<typeof clientEventSchema>
): Promise<void> {
  const parsed = clientEventSchema.safeParse(raw);
  if (!parsed.success) return;

  const user = await getCurrentUser();
  await trackEvent({
    eventName: parsed.data.eventName as AnalyticsEventName,
    source: "client",
    path: parsed.data.path,
    sessionId: parsed.data.sessionId,
    anonymousId: parsed.data.anonymousId,
    referrer: parsed.data.referrer,
    utmSource: parsed.data.utmSource,
    utmMedium: parsed.data.utmMedium,
    utmCampaign: parsed.data.utmCampaign,
    utmContent: parsed.data.utmContent,
    ecosystemProjectId: parsed.data.ecosystemProjectId,
    ecosystemProjectSlug: parsed.data.ecosystemProjectSlug,
    courseId: parsed.data.courseId,
    courseSlug: parsed.data.courseSlug,
    lessonId: parsed.data.lessonId,
    quizId: parsed.data.quizId,
    badgeId: parsed.data.badgeId,
    badgeAwardId: parsed.data.badgeAwardId,
    verificationSlug: parsed.data.verificationSlug,
    metadata: parsed.data.metadata ?? undefined,
    userId: user?.id,
  });
}
