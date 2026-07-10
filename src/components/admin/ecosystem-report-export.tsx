"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportEcosystemReport } from "@/app/actions/ecosystem-analytics";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

export function EcosystemReportExport({
  rangePreset,
}: {
  rangePreset: AnalyticsRangePreset;
}) {
  const [busy, setBusy] = React.useState<"markdown" | "csv" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport(format: "markdown" | "csv") {
    setBusy(format);
    setError(null);
    const res = await exportEcosystemReport({ rangePreset, format });
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
        disabled={busy !== null}
        onClick={() => handleExport("markdown")}
      >
        {busy === "markdown" ? <Loader2 className="animate-spin" /> : <Download />}
        Report (Markdown)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => handleExport("csv")}
      >
        {busy === "csv" ? <Loader2 className="animate-spin" /> : <Download />}
        CSV
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
