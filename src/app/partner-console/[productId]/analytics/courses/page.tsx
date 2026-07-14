import { Suspense } from "react";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsCoursesView } from "@/components/partner-console/analytics/analytics-courses-view";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { HistoricalCompareControls } from "@/components/partner-console/analytics/historical-compare-controls";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import { SnapshotStatusChip } from "@/components/partner-console/analytics/snapshot-status-chip";
import {
  parseAnalyticsCompareBaseline,
  parseAnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { getAnalyticsEngineView } from "@/lib/analytics-snapshots";
import { getProjectAdminAccess } from "@/lib/project-admin";
import { redirect } from "next/navigation";

export const metadata = { title: "Analytics courses" };

export default async function PartnerAnalyticsCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ range?: string; compare?: string }>;
}) {
  const { productId } = await params;
  const { range: rangeParam, compare: compareParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const compare = parseAnalyticsCompareBaseline(compareParam);
  const basePath = `/partner-console/${productId}/analytics/courses`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  const access = await getProjectAdminAccess(productId);
  const canRefresh = access.isStaff || access.projectRole === "owner";

  let view: Awaited<ReturnType<typeof getAnalyticsEngineView>>;
  try {
    view = await getAnalyticsEngineView({
      productId,
      preset,
      compare,
      allowLiveFallback: true,
    });
  } catch {
    return (
      <HomeSectionLoadError
        title="Course analytics did not load"
        description="Try refreshing the page."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Portfolio performance for published courses.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Suspense fallback={null}>
              <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
            </Suspense>
            <Suspense fallback={null}>
              <HistoricalCompareControls current={compare} />
            </Suspense>
          </div>
          <SnapshotStatusChip
            productId={productId}
            rangePreset={preset}
            compareBaseline={compare}
            displayStatus={view.freshness.displayStatus}
            label={view.freshness.label}
            canRefresh={canRefresh}
          />
          <AnalyticsExportAction
            productId={productId}
            rangePreset={preset}
            compareBaseline={compare}
            scope="courses"
          />
        </div>
      </div>

      <div className="mt-8">
        <AnalyticsCoursesView
          productId={productId}
          courses={view.data?.courses ?? []}
        />
      </div>
    </>
  );
}
