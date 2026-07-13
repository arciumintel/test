/**
 * Start-week cohorts + completion retention (partner-safe aggregates).
 */

import "server-only";

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

export type CohortRow = {
  weekStart: string;
  starters: number;
  completers: number;
  completionRatePct: number;
};

export type CohortAnalytics = {
  cohorts: CohortRow[];
  overallCompletionRatePct: number | null;
};

function weekStartKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-start
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export async function getCohortAnalytics(
  productId: string,
  range: AnalyticsDateRange
): Promise<CohortAnalytics> {
  const firstProgress = await prisma.progress.findMany({
    where: {
      course: { productId },
      createdAt: {
        ...(range.from ? { gte: range.from } : {}),
        lte: range.to,
      },
    },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const firstByUser = new Map<string, Date>();
  for (const row of firstProgress) {
    if (!firstByUser.has(row.userId)) {
      firstByUser.set(row.userId, row.createdAt);
    }
  }

  const awards = await prisma.badgeAward.findMany({
    where: {
      course: { productId },
      awardedAt: {
        ...(range.from ? { gte: range.from } : {}),
        lte: range.to,
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  const completers = new Set(awards.map((a) => a.userId));

  const buckets = new Map<string, { starters: number; completers: number }>();
  for (const [userId, startedAt] of firstByUser) {
    const key = weekStartKey(startedAt);
    const cur = buckets.get(key) ?? { starters: 0, completers: 0 };
    cur.starters += 1;
    if (completers.has(userId)) cur.completers += 1;
    buckets.set(key, cur);
  }

  const cohorts = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, v]) => ({
      weekStart,
      starters: v.starters,
      completers: v.completers,
      completionRatePct:
        v.starters > 0 ? Math.round((v.completers / v.starters) * 100) : 0,
    }));

  const totalStarters = firstByUser.size;
  const totalCompleters = [...firstByUser.keys()].filter((id) =>
    completers.has(id)
  ).length;

  return {
    cohorts: cohorts.slice(-12),
    overallCompletionRatePct:
      totalStarters > 0
        ? Math.round((totalCompleters / totalStarters) * 100)
        : null,
  };
}
