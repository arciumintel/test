import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsCertificationsView } from "@/components/partner-console/analytics/analytics-certifications-view";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { getCertificationAnalytics } from "@/lib/certifications";

export const metadata = { title: "Analytics certifications" };

export default async function PartnerAnalyticsCertificationsPage({
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
  const basePath = `/partner-console/${productId}/analytics/certifications`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  try {
    const data = await getCertificationAnalytics(productId, range);
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Certifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Credential funnel and attainment — distinct from badges.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Suspense fallback={null}>
              <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
            </Suspense>
            <AnalyticsExportAction
              productId={productId}
              rangePreset={preset}
              compareBaseline="none"
              scope="certifications"
            />
          </div>
        </div>
        <div className="mt-8">
          <AnalyticsCertificationsView productId={productId} data={data} />
        </div>
      </>
    );
  } catch {
    return (
      <HomeSectionLoadError
        title="Certifications did not load"
        description="Try refreshing the page."
      />
    );
  }
}
