import { Prisma } from "../../generated/client";
import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";

/**
 * Daily analytics rollups.
 *
 * Raw AnalyticsEvent rows grow unbounded; trend charts should never scan them
 * at request time. A cron recomputes per-day aggregates idempotently
 * (delete + insert for each day in the lookback window), so re-running a day
 * is always safe and backfill is just a larger lookback.
 */

export type RollupRunResult = {
  daysProcessed: number;
  rowsWritten: number;
  from: string;
  to: string;
};

function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

type RollupSourceRow = {
  day: Date;
  eventName: string;
  ecosystemProjectId: string | null;
  courseId: string | null;
  eventCount: bigint;
  uniqueUsers: bigint;
  uniqueAnonymous: bigint;
};

/**
 * Recompute daily rollups for the past `lookbackDays` days (inclusive of today).
 * Idempotent: existing rollup rows in the window are replaced.
 */
export async function runAnalyticsRollup(options?: {
  lookbackDays?: number;
}): Promise<RollupRunResult> {
  const lookbackDays = Math.max(1, Math.min(options?.lookbackDays ?? 2, 3650));
  const today = startOfUtcDay(new Date());
  const from = addDays(today, -(lookbackDays - 1));
  const toExclusive = addDays(today, 1);

  const rows = await prisma.$queryRaw<RollupSourceRow[]>`
    SELECT
      date_trunc('day', "occurredAt" AT TIME ZONE 'UTC')::date AS "day",
      "eventName",
      "ecosystemProjectId",
      "courseId",
      COUNT(*)::bigint AS "eventCount",
      COUNT(DISTINCT "userId")::bigint AS "uniqueUsers",
      COUNT(DISTINCT "anonymousId")::bigint AS "uniqueAnonymous"
    FROM "AnalyticsEvent"
    WHERE "occurredAt" >= ${from} AND "occurredAt" < ${toExclusive}
    GROUP BY 1, 2, 3, 4
  `;

  const data = rows.map((row) => ({
    date: row.day,
    eventName: row.eventName,
    ecosystemProjectId: row.ecosystemProjectId,
    courseId: row.courseId,
    eventCount: Number(row.eventCount),
    uniqueUsers: Number(row.uniqueUsers),
    uniqueAnonymous: Number(row.uniqueAnonymous),
  }));

  await prisma.$transaction([
    prisma.analyticsDailyRollup.deleteMany({
      where: { date: { gte: from, lt: toExclusive } },
    }),
    prisma.analyticsDailyRollup.createMany({ data }),
  ]);

  return {
    daysProcessed: lookbackDays,
    rowsWritten: data.length,
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

export type DailyTrendPoint = {
  date: string; // YYYY-MM-DD
  count: number;
  uniqueUsers: number;
};

export type TrendSeries = {
  eventName: string;
  points: DailyTrendPoint[];
};

/**
 * Read daily trend series for the given events from rollups.
 * Today's point is computed live from raw events (rollups only cover through
 * the last cron run). Days without data are filled with zeros so charts
 * render continuous lines.
 */
export async function getDailyTrends(options: {
  eventNames: string[];
  range: AnalyticsDateRange;
  ecosystemProjectId?: string | null;
}): Promise<TrendSeries[]> {
  const { eventNames, range, ecosystemProjectId } = options;
  if (eventNames.length === 0) return [];

  const to = startOfUtcDay(range.to);
  const from = range.from
    ? startOfUtcDay(range.from)
    : addDays(to, -89); // "all time" trend charts cap at 90 days
  const today = startOfUtcDay(new Date());
  const includesToday = to >= today;

  const [grouped, liveToday] = await Promise.all([
    prisma.analyticsDailyRollup.groupBy({
      by: ["date", "eventName"],
      where: {
        eventName: { in: eventNames },
        date: { gte: from, lte: includesToday ? addDays(today, -1) : to },
        ...(ecosystemProjectId ? { ecosystemProjectId } : {}),
      },
      _sum: { eventCount: true, uniqueUsers: true },
    }),
    includesToday
      ? prisma.$queryRaw<
          { eventName: string; eventCount: bigint; uniqueUsers: bigint }[]
        >`
          SELECT
            "eventName",
            COUNT(*)::bigint AS "eventCount",
            COUNT(DISTINCT "userId")::bigint AS "uniqueUsers"
          FROM "AnalyticsEvent"
          WHERE "occurredAt" >= ${today}
            AND "eventName" = ANY(${eventNames})
            ${
              ecosystemProjectId
                ? Prisma.sql`AND "ecosystemProjectId" = ${ecosystemProjectId}`
                : Prisma.empty
            }
          GROUP BY 1
        `
      : Promise.resolve([]),
  ]);

  const byEvent = new Map<string, Map<string, DailyTrendPoint>>();
  for (const g of grouped) {
    const dateKey = g.date.toISOString().slice(0, 10);
    let series = byEvent.get(g.eventName);
    if (!series) {
      series = new Map();
      byEvent.set(g.eventName, series);
    }
    series.set(dateKey, {
      date: dateKey,
      count: g._sum.eventCount ?? 0,
      uniqueUsers: g._sum.uniqueUsers ?? 0,
    });
  }

  const todayKey = today.toISOString().slice(0, 10);
  for (const row of liveToday) {
    let series = byEvent.get(row.eventName);
    if (!series) {
      series = new Map();
      byEvent.set(row.eventName, series);
    }
    series.set(todayKey, {
      date: todayKey,
      count: Number(row.eventCount),
      uniqueUsers: Number(row.uniqueUsers),
    });
  }

  const allDates: string[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    allDates.push(d.toISOString().slice(0, 10));
  }

  return eventNames.map((eventName) => ({
    eventName,
    points: allDates.map(
      (date) =>
        byEvent.get(eventName)?.get(date) ?? {
          date,
          count: 0,
          uniqueUsers: 0,
        }
    ),
  }));
}

export type EventTotals = Record<
  string,
  { count: number; uniqueUsers: number }
>;

/** Sum rollup totals per event for a range (cheap alternative to counting raw events). */
export async function getEventTotals(options: {
  eventNames: string[];
  range: AnalyticsDateRange;
  ecosystemProjectId?: string | null;
}): Promise<EventTotals> {
  const { eventNames, range, ecosystemProjectId } = options;
  const grouped = await prisma.analyticsDailyRollup.groupBy({
    by: ["eventName"],
    where: {
      eventName: { in: eventNames },
      ...(range.from
        ? { date: { gte: startOfUtcDay(range.from), lte: startOfUtcDay(range.to) } }
        : {}),
      ...(ecosystemProjectId ? { ecosystemProjectId } : {}),
    },
    _sum: { eventCount: true, uniqueUsers: true },
  });

  const totals: EventTotals = {};
  for (const name of eventNames) {
    totals[name] = { count: 0, uniqueUsers: 0 };
  }
  for (const g of grouped) {
    totals[g.eventName] = {
      count: g._sum.eventCount ?? 0,
      uniqueUsers: g._sum.uniqueUsers ?? 0,
    };
  }
  return totals;
}

/** Guard for environments where the Prisma client predates the rollup model. */
export function isRollupAvailable(): boolean {
  const delegate = (
    prisma as unknown as { analyticsDailyRollup?: { groupBy?: unknown } }
  ).analyticsDailyRollup;
  return Boolean(delegate && typeof delegate.groupBy === "function");
}