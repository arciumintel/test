"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { exportAnalyticsReport } from "@/app/actions/analytics-v2";
import { Button } from "@/components/ui/button";
import type { AnalyticsExportScope } from "@/lib/analytics-export-types";

type ExportFormat = "html" | "markdown" | "csv";

const FORMAT_ORDER: ExportFormat[] = ["html", "markdown", "csv"];

function formatLabel(format: ExportFormat): string {
  if (format === "html") return "HTML report";
  if (format === "markdown") return "Markdown";
  return "CSV";
}

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
  scope = "full",
  courseId,
  showFullPack = false,
}: {
  productId: string;
  rangePreset: string;
  compareBaseline: string;
  scope?: AnalyticsExportScope;
  courseId?: string;
  /** Overview only: offer Complete pack (scope=full) beside this-view export */
  showFullPack?: boolean;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(format: ExportFormat, exportScope: AnalyticsExportScope) {
    const key = `${exportScope}:${format}`;
    setBusy(key);
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
      scope: exportScope,
      courseId: exportScope === "course" ? courseId : undefined,
    });
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    downloadBlob(res.content, res.filename, res.mimeType);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-xs text-right text-xs text-muted-foreground">
        Share a readable report, or open CSV in a spreadsheet.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          This view
        </span>
        {FORMAT_ORDER.map((format) => {
          const key = `${scope}:${format}`;
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={format === "csv" ? "outline" : "default"}
              disabled={busy !== null}
              onClick={() => run(format, scope)}
              className="gap-1"
            >
              {busy === key ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              {formatLabel(format)}
            </Button>
          );
        })}
      </div>
      {showFullPack && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Complete pack
          </span>
          {FORMAT_ORDER.map((format) => {
            const key = `full:${format}`;
            return (
              <Button
                key={key}
                type="button"
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => run(format, "full")}
                className="gap-1"
              >
                {busy === key ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {formatLabel(format)}
              </Button>
            );
          })}
        </div>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
