import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AnalyticsPageHeading } from "@/components/partner-console/analytics/analytics-icons";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsBackfillGate } from "@/components/partner-console/analytics/analytics-backfill-gate";
import { AnalyticsConceptsView } from "@/components/partner-console/analytics/analytics-concepts-view";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import {
  getConceptCoverage,
  getConceptMasteryRows,
  rankKnowledgeGaps,
} from "@/lib/concept-mastery";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";

export const metadata = { title: "Analytics concepts" };

export default async function PartnerAnalyticsConceptsPage({
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
  const basePath = `/partner-console/${productId}/analytics/concepts`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  const backfill = await getQuestionAttemptBackfillStatus();
  if (!backfill.complete) {
    return (
      <>
        <AnalyticsPageHeading
          tab="concepts"
          title="Concepts"
          description="Mastery and knowledge gaps from tagged assessment items."
        />
        <div className="mt-8">
          <AnalyticsBackfillGate productId={productId} status={backfill} />
        </div>
      </>
    );
  }

  let coverage: Awaited<ReturnType<typeof getConceptCoverage>>;
  let concepts: Awaited<ReturnType<typeof getConceptMasteryRows>>;
  try {
    [coverage, concepts] = await Promise.all([
      getConceptCoverage(productId),
      getConceptMasteryRows(productId, range),
    ]);
  } catch {
    return (
      <HomeSectionLoadError
        title="Concept analytics did not load"
        description="Try refreshing the page."
      />
    );
  }

  const gaps = rankKnowledgeGaps(concepts);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AnalyticsPageHeading
          tab="concepts"
          title="Concepts"
          description="Mastery and knowledge gaps from tagged assessment items."
        />
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <Suspense fallback={null}>
            <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
          </Suspense>
          <AnalyticsExportAction
            productId={productId}
            rangePreset={preset}
            compareBaseline="none"
            scope="concepts"
          />
        </div>
      </div>

      <div className="mt-8">
        <AnalyticsConceptsView
          productId={productId}
          coverage={coverage}
          concepts={concepts}
          gaps={gaps}
        />
      </div>
    </>
  );
}
