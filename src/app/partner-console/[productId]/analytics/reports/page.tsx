import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { PartnerAnalyticsExportPanel } from "@/components/partner-console/analytics/partner-analytics-export-panel";
import {
  PartnerAnalyticsDateRange,
  PartnerAnalyticsPrivacyNote,
} from "@/components/partner-console/analytics/partner-analytics-shared";
import { parseAnalyticsRangePreset } from "@/lib/analytics-date-range";

export const metadata = { title: "Export analytics report" };

export default async function PartnerAnalyticsReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { productId } = await params;
  const { range: rangeParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const basePath = `/partner-console/${productId}/analytics/reports`;

  return (
    <>
      <Link
        href={`/partner-console/${productId}/analytics?range=${preset}`}
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Project analytics
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Export report</h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Download analytics for your team or partner review meetings.
      </p>

      <div className="mt-4">
        <Suspense fallback={null}>
          <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
        </Suspense>
      </div>

      <div className="mt-6 max-w-lg space-y-4">
        <PartnerAnalyticsPrivacyNote />
        <PartnerAnalyticsExportPanel productId={productId} rangePreset={preset} />
      </div>
    </>
  );
}
