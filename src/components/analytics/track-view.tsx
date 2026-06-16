"use client";

import * as React from "react";
import { trackClientEvent } from "@/app/actions/tracking";
import {
  getBrowserReferrer,
  getTrackingAnonymousId,
  getTrackingSessionId,
  getUtmParams,
} from "@/lib/tracking-client";
import type { AnalyticsEventName } from "@/lib/analytics-events";

type Props = {
  eventName: AnalyticsEventName;
  path: string;
  ecosystemProjectId?: string;
  ecosystemProjectSlug?: string;
  courseId?: string;
  courseSlug?: string;
  lessonId?: string;
  quizId?: string;
  badgeId?: string;
  badgeAwardId?: string;
  verificationSlug?: string;
  metadata?: Record<string, unknown>;
};

export function TrackView({
  eventName,
  path,
  ecosystemProjectId,
  ecosystemProjectSlug,
  courseId,
  courseSlug,
  lessonId,
  quizId,
  badgeId,
  badgeAwardId,
  verificationSlug,
  metadata,
}: Props) {
  React.useEffect(() => {
    void trackClientEvent({
      eventName,
      path,
      sessionId: getTrackingSessionId(),
      anonymousId: getTrackingAnonymousId(),
      referrer: getBrowserReferrer(),
      ...getUtmParams(),
      ecosystemProjectId,
      ecosystemProjectSlug,
      courseId,
      courseSlug,
      lessonId,
      quizId,
      badgeId,
      badgeAwardId,
      verificationSlug,
      metadata,
    });
    // Track once per mount; metadata is intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eventName,
    path,
    ecosystemProjectId,
    ecosystemProjectSlug,
    courseId,
    courseSlug,
    lessonId,
    quizId,
    badgeId,
    badgeAwardId,
    verificationSlug,
  ]);

  return null;
}
