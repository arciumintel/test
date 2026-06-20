import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import {
  PartnerAnalyticsDateRange,
  PartnerAnalyticsPrivacyNote,
} from "@/components/partner-console/analytics/partner-analytics-shared";
import { PartnerAnalyticsOverview } from "@/components/partner-console/analytics/partner-analytics-overview";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { getPartnerPlusAnalytics } from "@/lib/partner-analytics";

export const metadata = { title: "Analytics" };

export default async function PartnerAnalyticsPage({
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
  const basePath = `/partner-console/${productId}/analytics`;

  let data: Awaited<ReturnType<typeof getPartnerPlusAnalytics>> = null;
  let loadError = false;
  try {
    data = await getPartnerPlusAnalytics(productId, range);
  } catch {
    loadError = true;
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            How your published courses are performing on Arcademy.
          </p>
        </div>
        <Suspense fallback={null}>
          <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
        </Suspense>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <PartnerAnalyticsPrivacyNote />
        <Link
          href={`${basePath}/reports?range=${preset}`}
          className="text-sm text-primary hover:underline"
        >
          Export report
        </Link>
      </div>

      <div className="mt-8">
        {loadError ? (
          <HomeSectionLoadError
            title="Analytics did not load"
            description="Try refreshing the page, or check back in a few minutes."
          />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Project not found.</p>
        ) : (
          <PartnerAnalyticsOverview
            productId={productId}
            data={data}
            rangePreset={preset}
          />
        )}
      </div>
    </>
  );
}
