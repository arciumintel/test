"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { exportAnalyticsReport } from "@/app/actions/analytics-v2";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

type ExportFormat = "html" | "markdown" | "csv";

export function PartnerAnalyticsExportPanel({
  productId,
  rangePreset,
  compareBaseline = "none",
}: {
  productId: string;
  rangePreset: AnalyticsRangePreset;
  compareBaseline?: string;
}) {
  const [busy, setBusy] = React.useState<ExportFormat | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setBusy(format);
    setError(null);
    const res = await exportAnalyticsReport({
      productId,
      rangePreset,
      compareBaseline: compareBaseline as
        | "none"
        | "previous_week"
        | "previous_month"
        | "previous_quarter",
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
    <Card>
      <CardContent className="py-5">
        <h2 className="text-sm font-semibold">Export</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download analytics from the same engine as the dashboard. Aggregates
          only.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={() => handleExport("html")}
          >
            {busy === "html" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            HTML
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => handleExport("markdown")}
          >
            {busy === "markdown" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            Markdown
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
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
