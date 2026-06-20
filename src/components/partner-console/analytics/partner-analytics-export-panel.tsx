"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { exportPartnerPlusReport } from "@/app/actions/partner-analytics";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

export function PartnerAnalyticsExportPanel({
  productId,
  rangePreset,
}: {
  productId: string;
  rangePreset: AnalyticsRangePreset;
}) {
  const [busy, setBusy] = React.useState<"markdown" | "csv" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport(format: "markdown" | "csv") {
    setBusy(format);
    setError(null);
    const res = await exportPartnerPlusReport({
      productId,
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
    <Card>
      <CardContent className="py-5">
        <h2 className="text-sm font-semibold">Export report</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a summary for your team. Reports include aggregated metrics only.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
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
