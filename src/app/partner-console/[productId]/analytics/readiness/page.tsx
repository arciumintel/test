import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AnalyticsPageHeading } from "@/components/partner-console/analytics/analytics-icons";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { AnalyticsReadinessView } from "@/components/partner-console/analytics/analytics-readiness-view";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { evaluateReadinessModels } from "@/lib/readiness-eval";

export const metadata = { title: "Analytics readiness" };

export default async function PartnerAnalyticsReadinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { productId } = await params;
  const { range: rangeParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const range = resolveAnalyticsDateRange(preset);
  const basePath = `/partner-console/${productId}/analytics/readiness`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  try {
    const models = await evaluateReadinessModels(productId, range);
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <AnalyticsPageHeading
            tab="readiness"
            title="Readiness"
            description="Learning Readiness and custom models — pipeline quality."
          />
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Suspense fallback={null}>
              <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
            </Suspense>
            <AnalyticsExportAction
              productId={productId}
              rangePreset={preset}
              compareBaseline="none"
              scope="readiness"
            />
          </div>
        </div>
        <div className="mt-8">
          <AnalyticsReadinessView productId={productId} models={models} />
        </div>
      </>
    );
  } catch {
    return (
      <HomeSectionLoadError
        title="Readiness did not load"
        description="Try refreshing the page."
      />
    );
  }
}
