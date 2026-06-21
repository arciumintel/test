import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import type { WeeklyTrendPoint } from "@/lib/partner-analytics";

function parseWeekStart(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekLabel(isoDate: string): string {
  return parseWeekStart(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function addWeeks(date: Date, weeks: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

function weekStartFromDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export type WeeklyTrendChartPoint = WeeklyTrendPoint & {
  label: string;
};

/** Fill missing weeks with zeros for a continuous line chart x-axis. */
export function prepareWeeklyTrendChartData(
  points: WeeklyTrendPoint[],
  range: AnalyticsDateRange,
  maxWeeks = 12
): WeeklyTrendChartPoint[] {
  const byWeek = new Map(points.map((p) => [p.weekStart, p]));

  const rangeEnd = range.to;
  const rangeStart =
    range.from ??
    (points.length > 0
      ? parseWeekStart(points[0].weekStart)
      : addWeeks(rangeEnd, -(maxWeeks - 1)));

  let cursor = parseWeekStart(weekStartFromDate(rangeStart));
  const end = parseWeekStart(weekStartFromDate(rangeEnd));
  const weeks: WeeklyTrendChartPoint[] = [];

  while (cursor <= end) {
    const weekStart = cursor.toISOString().slice(0, 10);
    const existing = byWeek.get(weekStart);
    weeks.push({
      weekStart,
      label: formatWeekLabel(weekStart),
      starts: existing?.starts ?? 0,
      completions: existing?.completions ?? 0,
    });
    cursor = addWeeks(cursor, 1);
  }

  if (weeks.length <= maxWeeks) return weeks;
  return weeks.slice(-maxWeeks);
}
