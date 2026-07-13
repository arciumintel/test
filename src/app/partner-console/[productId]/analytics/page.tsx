import Link from "next/link";
import { Suspense } from "react";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { AnalyticsOverviewView } from "@/components/partner-console/analytics/analytics-overview-view";
import { HistoricalCompareControls } from "@/components/partner-console/analytics/historical-compare-controls";
import {
  PartnerAnalyticsDateRange,
  PartnerAnalyticsPrivacyNote,
} from "@/components/partner-console/analytics/partner-analytics-shared";
import { PartnerAnalyticsOverview } from "@/components/partner-console/analytics/partner-analytics-overview";
import { SnapshotStatusChip } from "@/components/partner-console/analytics/snapshot-status-chip";
import {
  parseAnalyticsCompareBaseline,
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { ensureAnalyticsProfileForProduct } from "@/lib/analytics-profile";
import { getPartnerPlusAnalytics } from "@/lib/partner-analytics";
import { getAnalyticsEngineView } from "@/lib/analytics-snapshots";
import { getProjectAdminAccess } from "@/lib/project-admin";

export const metadata = { title: "Analytics" };

export default async function PartnerAnalyticsPage({
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
  const range = resolveAnalyticsDateRange(preset);
  const basePath = `/partner-console/${productId}/analytics`;

  try {
    await ensureAnalyticsProfileForProduct(productId);
  } catch {
    // best-effort
  }

  const v2 = await isAnalyticsV2Enabled(productId);
  const access = await getProjectAdminAccess(productId);
  const canRefresh =
    access.isStaff || access.projectRole === "owner";

  if (!v2) {
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
            <p className="mt-2 text-xs text-muted-foreground">
              Classic Partner Analytics Plus is active. Enable Analytics V2 in{" "}
              <Link
                href={`${basePath}/settings`}
                className="text-primary hover:underline"
              >
                Analytics settings
              </Link>
              .
            </p>
          </div>
          <Suspense fallback={null}>
            <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
          </Suspense>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <PartnerAnalyticsPrivacyNote />
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`${basePath}/settings`}
              className="text-sm text-primary hover:underline"
            >
              Analytics settings
            </Link>
            <AnalyticsExportAction
              productId={productId}
              rangePreset={preset}
              compareBaseline={compare}
            />
          </div>
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
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <div className="mt-8">
          <HomeSectionLoadError
            title="Analytics did not load"
            description="Try refreshing the page, or check back in a few minutes."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Educational intelligence for {view.data?.productName ?? "this project"}.
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
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <PartnerAnalyticsPrivacyNote />
        <AnalyticsExportAction
          productId={productId}
          rangePreset={preset}
          compareBaseline={compare}
        />
      </div>

      <div className="mt-8">
        {!view.data ? (
          <p className="text-sm text-muted-foreground">Project not found.</p>
        ) : (
          <AnalyticsOverviewView productId={productId} data={view.data} />
        )}
      </div>
    </>
  );
}
