/**
 * Conversion analytics depth — keyed by ConversionDefinition.
 *
 * Partner conversion metrics (conversionKey panels, event instrumentation,
 * pack stubs) are deferred to Analytics V2. This module and the Prisma
 * `ConversionDefinition` model are kept as schema stubs only.
 */

import "server-only";

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

export type ConversionAnalyticsRow = {
  key: string;
  label: string;
  eventName: string;
  description: string | null;
  count: number;
  uniqueUsers: number;
  /** Events / learners started × 100. */
  ratePct: number | null;
};

export type ConversionAnalytics = {
  rows: ConversionAnalyticsRow[];
  totalEvents: number;
  learnersStarted: number;
  setupNeeded: boolean;
  setupMessage: string | null;
};

export async function getConversionAnalytics(
  productId: string,
  range: AnalyticsDateRange
): Promise<ConversionAnalytics> {
  const defs = await prisma.conversionDefinition.findMany({
    where: { productId },
    orderBy: { label: "asc" },
  });

  const starters = await prisma.progress.groupBy({
    by: ["userId"],
    where: {
      course: { productId },
      createdAt: {
        ...(range.from ? { gte: range.from } : {}),
        lte: range.to,
      },
    },
  });
  const learnersStarted = starters.length;
  const occurredAt = occurredAtFilter(range);

  if (defs.length === 0) {
    return {
      rows: [],
      totalEvents: 0,
      learnersStarted,
      setupNeeded: true,
      setupMessage:
        "Define conversion keys in Analytics settings to track partner outcomes.",
    };
  }

  const rows: ConversionAnalyticsRow[] = [];
  let totalEvents = 0;

  for (const def of defs) {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        ecosystemProjectId: productId,
        eventName: def.eventName,
        ...(occurredAt ? { occurredAt } : {}),
      },
      select: { userId: true, metadata: true },
    });

    // Prefer events tagged with this conversionKey when metadata is present.
    const keyed = events.filter((e) => {
      const meta = e.metadata;
      if (!meta || typeof meta !== "object" || Array.isArray(meta)) return true;
      const key = (meta as { conversionKey?: unknown }).conversionKey;
      if (key == null) return true;
      return key === def.key;
    });

    const uniqueUsers = new Set(
      keyed.map((e) => e.userId).filter((id): id is string => Boolean(id))
    ).size;

    totalEvents += keyed.length;
    rows.push({
      key: def.key,
      label: def.label,
      eventName: def.eventName,
      description: def.description,
      count: keyed.length,
      uniqueUsers,
      ratePct:
        learnersStarted > 0
          ? Math.round((keyed.length / learnersStarted) * 100)
          : null,
    });
  }

  return {
    rows,
    totalEvents,
    learnersStarted,
    setupNeeded: false,
    setupMessage: null,
  };
}
