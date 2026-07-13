"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { exportAnalyticsReport } from "@/app/actions/analytics-v2";
import { Button } from "@/components/ui/button";

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsExportAction({
  productId,
  rangePreset,
  compareBaseline,
}: {
  productId: string;
  rangePreset: string;
  compareBaseline: string;
}) {
  const [busy, setBusy] = React.useState<"html" | "markdown" | "csv" | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  async function run(format: "html" | "markdown" | "csv") {
    setBusy(format);
    setError(null);
    const res = await exportAnalyticsReport({
      productId,
      rangePreset: rangePreset as "7d" | "30d" | "90d" | "all",
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
    downloadBlob(res.content, res.filename, res.mimeType);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["html", "markdown", "csv"] as const).map((format) => (
        <Button
          key={format}
          type="button"
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => run(format)}
          className="gap-1 capitalize"
        >
          {busy === format ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {format === "markdown" ? "Markdown" : format.toUpperCase()}
        </Button>
      ))}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
