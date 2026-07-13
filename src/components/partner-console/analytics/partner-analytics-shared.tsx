"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { AnalyticsInfoTip } from "@/components/partner-console/analytics/analytics-info-tip";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

const OPTIONS: { value: AnalyticsRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export function PartnerAnalyticsDateRange({
  basePath,
  current,
}: {
  basePath: string;
  current: AnalyticsRangePreset;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: AnalyticsRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label
        htmlFor="analytics-range"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        Period
        <AnalyticsInfoTip helpKey="period" />
      </Label>
      <select
        id="analytics-range"
        value={current}
        onChange={(e) => onChange(e.target.value as AnalyticsRangePreset)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PartnerAnalyticsPrivacyNote() {
  return (
    <p className="text-pretty text-xs text-muted-foreground">
      Metrics reflect published course activity for your project. Individual
      learner identities and wallet addresses are never shown.
    </p>
  );
}
