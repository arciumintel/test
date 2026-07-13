"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportPlatformAnalyticsHtmlReport } from "@/app/actions/admin-analytics";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

const RANGE_OPTIONS: { value: AnalyticsRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export function AdminAnalyticsExportButton() {
  const [rangePreset, setRangePreset] =
    React.useState<AnalyticsRangePreset>("30d");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setError(null);
    const res = await exportPlatformAnalyticsHtmlReport({ rangePreset });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    const blob = new Blob([res.content], { type: res.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="admin-analytics-range"
          aria-label="Report period"
          value={rangePreset}
          onChange={(e) =>
            setRangePreset(e.target.value as AnalyticsRangePreset)
          }
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          Download analytics
        </Button>
      </div>
      {error && (
        <p className="max-w-xs text-right text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
