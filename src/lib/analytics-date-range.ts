export type AnalyticsRangePreset = "7d" | "30d" | "90d" | "all";

export type AnalyticsCompareBaseline =
  | "none"
  | "previous_week"
  | "previous_month"
  | "previous_quarter";

export type AnalyticsDateRange = {
  preset: AnalyticsRangePreset;
  from: Date | null;
  to: Date;
  label: string;
};

const PRESET_LABELS: Record<AnalyticsRangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const COMPARE_LABELS: Record<AnalyticsCompareBaseline, string> = {
  none: "No comparison",
  previous_week: "Previous week",
  previous_month: "Previous month",
  previous_quarter: "Previous quarter",
};

export function resolveAnalyticsDateRange(
  preset: AnalyticsRangePreset = "30d"
): AnalyticsDateRange {
  const to = new Date();
  if (preset === "all") {
    return { preset, from: null, to, label: PRESET_LABELS.all };
  }
  const from = new Date(to);
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { preset, from, to, label: PRESET_LABELS[preset] };
}

export function parseAnalyticsRangePreset(
  value: string | undefined | null
): AnalyticsRangePreset {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") {
    return value;
  }
  return "30d";
}

export function parseAnalyticsCompareBaseline(
  value: string | undefined | null
): AnalyticsCompareBaseline {
  if (
    value === "none" ||
    value === "previous_week" ||
    value === "previous_month" ||
    value === "previous_quarter"
  ) {
    return value;
  }
  return "none";
}

export function compareBaselineLabel(
  baseline: AnalyticsCompareBaseline
): string {
  return COMPARE_LABELS[baseline];
}

/**
 * Historical self-compare window immediately before the current range.
 * Never cross-project. Returns null when baseline is none.
 */
export function resolvePriorPeriod(
  range: AnalyticsDateRange,
  baseline: AnalyticsCompareBaseline
): AnalyticsDateRange | null {
  if (baseline === "none") return null;

  const days =
    baseline === "previous_week" ? 7 : baseline === "previous_quarter" ? 90 : 30;

  const end = range.from ? new Date(range.from) : new Date(range.to);
  if (range.from) {
    end.setMilliseconds(end.getMilliseconds() - 1);
  } else {
    end.setDate(end.getDate() - days);
  }

  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    preset: range.preset,
    from: start,
    to: end,
    label: COMPARE_LABELS[baseline],
  };
}

export function analyticsRangeKey(
  preset: AnalyticsRangePreset,
  compare: AnalyticsCompareBaseline = "none"
): { rangeKey: string; compareKey: string } {
  return { rangeKey: preset, compareKey: compare };
}

export function occurredAtFilter(range: AnalyticsDateRange) {
  if (!range.from) return undefined;
  return { gte: range.from, lte: range.to };
}

export function awardedAtFilter(range: AnalyticsDateRange) {
  if (!range.from) return undefined;
  return { gte: range.from, lte: range.to };
}

export function progressCreatedAtFilter(range: AnalyticsDateRange) {
  if (!range.from) return undefined;
  return { gte: range.from, lte: range.to };
}

export function progressCompletedAtFilter(range: AnalyticsDateRange) {
  if (!range.from) return undefined;
  return { gte: range.from, lte: range.to };
}

export function submittedAtFilter(range: AnalyticsDateRange) {
  if (!range.from) return undefined;
  return { gte: range.from, lte: range.to };
}
