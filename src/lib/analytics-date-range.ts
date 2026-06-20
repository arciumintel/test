export type AnalyticsRangePreset = "7d" | "30d" | "90d" | "all";

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
