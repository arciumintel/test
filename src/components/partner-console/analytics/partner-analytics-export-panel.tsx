"use client";

import * as React from "react";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";

/**
 * Thin wrapper kept for any legacy imports — prefer AnalyticsExportAction directly.
 */
export function PartnerAnalyticsExportPanel({
  productId,
  rangePreset,
  compareBaseline = "none",
}: {
  productId: string;
  rangePreset: AnalyticsRangePreset;
  compareBaseline?: string;
}) {
  return (
    <AnalyticsExportAction
      productId={productId}
      rangePreset={rangePreset}
      compareBaseline={compareBaseline}
      scope="full"
      showFullPack={false}
    />
  );
}
