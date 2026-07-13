import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsBackfillGate } from "@/components/partner-console/analytics/analytics-backfill-gate";
import { AnalyticsConceptDrilldownView } from "@/components/partner-console/analytics/analytics-concept-drilldown-view";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import {
  getConceptCoverage,
  getConceptDrilldown,
} from "@/lib/concept-mastery";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";

export const metadata = { title: "Concept detail" };

export default async function PartnerAnalyticsConceptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string; conceptId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { productId, conceptId } = await params;
  const { range: rangeParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const range = resolveAnalyticsDateRange(preset);
  const basePath = `/partner-console/${productId}/analytics/concepts/${conceptId}`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  const backfill = await getQuestionAttemptBackfillStatus();
  if (!backfill.complete) {
    return (
      <div className="mt-2">
        <AnalyticsBackfillGate productId={productId} status={backfill} />
      </div>
    );
  }

  try {
    const [coverage, concept] = await Promise.all([
      getConceptCoverage(productId),
      getConceptDrilldown(productId, conceptId, range),
    ]);
    if (!concept) notFound();

    return (
      <>
        <div className="flex justify-end">
          <Suspense fallback={null}>
            <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
          </Suspense>
        </div>
        <div className="mt-4">
          <AnalyticsConceptDrilldownView
            productId={productId}
            coverage={coverage}
            concept={concept}
          />
        </div>
      </>
    );
  } catch {
    return (
      <HomeSectionLoadError
        title="Concept detail did not load"
        description="Try refreshing the page."
      />
    );
  }
}
