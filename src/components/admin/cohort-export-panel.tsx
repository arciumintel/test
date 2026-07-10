"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCohort } from "@/app/actions/cohorts";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

export function CohortExportPanel({
  courseId,
  minScore,
  rangePreset,
  disabled,
}: {
  courseId: string | null;
  minScore: number | null;
  rangePreset: AnalyticsRangePreset;
  disabled?: boolean;
}) {
  const [busy, setBusy] = React.useState<"csv" | "json" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport(format: "csv" | "json") {
    setBusy(format);
    setError(null);
    const res = await exportCohort({
      courseId: courseId ?? undefined,
      minScore,
      rangePreset,
      format,
    });
    setBusy(null);
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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || busy !== null}
        onClick={() => handleExport("csv")}
      >
        {busy === "csv" ? <Loader2 className="animate-spin" /> : <Download />}
        Export CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || busy !== null}
        onClick={() => handleExport("json")}
      >
        {busy === "json" ? <Loader2 className="animate-spin" /> : <Download />}
        Export JSON
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
