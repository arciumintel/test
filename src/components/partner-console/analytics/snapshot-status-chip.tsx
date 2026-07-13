"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { refreshAnalyticsSnapshot } from "@/app/actions/analytics-v2";
import { Button } from "@/components/ui/button";
import { AnalyticsInfoTip } from "@/components/partner-console/analytics/analytics-info-tip";
import type { AnalyticsHelpKey } from "@/lib/analytics-help";
import { cn } from "@/lib/utils";

export type SnapshotChipProps = {
  productId: string;
  rangePreset: string;
  compareBaseline: string;
  displayStatus: "fresh" | "building" | "queued" | "stale" | "error";
  label: string;
  canRefresh: boolean;
};

const STATUS_HELP: Record<SnapshotChipProps["displayStatus"], AnalyticsHelpKey> =
  {
    fresh: "snapshot_fresh",
    stale: "snapshot_stale",
    building: "snapshot_building",
    queued: "snapshot_queued",
    error: "snapshot_error",
  };

export function SnapshotStatusChip({
  productId,
  rangePreset,
  compareBaseline,
  displayStatus,
  label,
  canRefresh,
}: SnapshotChipProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    const res = await refreshAnalyticsSnapshot(
      productId,
      rangePreset,
      compareBaseline
    );
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const statusHelpKey = STATUS_HELP[displayStatus];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
          displayStatus === "fresh" &&
            "border-emerald-600/30 text-emerald-800 dark:text-emerald-300",
          displayStatus === "stale" &&
            "border-amber-600/30 text-amber-800 dark:text-amber-300",
          displayStatus === "building" &&
            "border-sky-600/30 text-sky-800 dark:text-sky-300",
          displayStatus === "queued" &&
            "border-sky-600/30 text-sky-800 dark:text-sky-300",
          displayStatus === "error" &&
            "border-destructive/40 text-destructive"
        )}
      >
        {displayStatus === "building" || busy ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : null}
        {busy ? "Building…" : label}
        <AnalyticsInfoTip helpKey={statusHelpKey} />
      </span>
      {canRefresh && (
        <span className="inline-flex items-center gap-0.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={refresh}
            className="h-7 gap-1 px-2 text-xs"
          >
            <RefreshCw className="size-3" aria-hidden />
            Refresh
          </Button>
          <AnalyticsInfoTip helpKey="snapshot_refresh" />
        </span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
