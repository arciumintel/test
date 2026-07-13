/**
 * Learning behaviour aggregates (partner-safe event counts).
 */

import "server-only";

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

export type BehaviourMetric = {
  id: string;
  label: string;
  eventName: string;
  count: number;
};

export type BehaviourAnalytics = {
  metrics: BehaviourMetric[];
  totalEngagementEvents: number;
};

const BEHAVIOUR_EVENTS: Array<{ id: string; label: string; eventName: string }> =
  [
    { id: "lesson_views", label: "Lesson views", eventName: "lesson_viewed" },
    {
      id: "lesson_completions",
      label: "Lesson completions",
      eventName: "lesson_completed",
    },
    { id: "quiz_starts", label: "Quiz starts", eventName: "quiz_started" },
    { id: "hints", label: "Hints viewed", eventName: "hint_viewed" },
    {
      id: "glossary",
      label: "Glossary lookups",
      eventName: "glossary_lookup",
    },
    {
      id: "search",
      label: "Searches",
      eventName: "search_performed",
    },
    {
      id: "docs",
      label: "Docs visits",
      eventName: "docs_visited",
    },
  ];

export async function getBehaviourAnalytics(
  productId: string,
  range: AnalyticsDateRange
): Promise<BehaviourAnalytics> {
  const occurredAt = occurredAtFilter(range);
  const metrics: BehaviourMetric[] = [];

  for (const def of BEHAVIOUR_EVENTS) {
    const count = await prisma.analyticsEvent.count({
      where: {
        ecosystemProjectId: productId,
        eventName: def.eventName,
        ...(occurredAt ? { occurredAt } : {}),
      },
    });
    metrics.push({ ...def, count });
  }

  return {
    metrics,
    totalEngagementEvents: metrics.reduce((s, m) => s + m.count, 0),
  };
}
