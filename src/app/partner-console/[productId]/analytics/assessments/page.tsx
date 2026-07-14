import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsAssessmentsView } from "@/components/partner-console/analytics/analytics-assessments-view";
import { AnalyticsBackfillGate } from "@/components/partner-console/analytics/analytics-backfill-gate";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { getConceptCoverage } from "@/lib/concept-mastery";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";
import { getQuestionIntelligenceRows } from "@/lib/question-intelligence";

export const metadata = { title: "Analytics assessments" };

export default async function PartnerAnalyticsAssessmentsPage({
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
  const basePath = `/partner-console/${productId}/analytics/assessments`;

  if (!(await isAnalyticsV2Enabled(productId))) {
    redirect(`/partner-console/${productId}/analytics`);
  }

  const backfill = await getQuestionAttemptBackfillStatus();
  if (!backfill.complete) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Question intelligence and quiz quality from normalized attempts.
          </p>
        </div>
        <div className="mt-8">
          <AnalyticsBackfillGate productId={productId} status={backfill} />
        </div>
      </>
    );
  }

  try {
    const [coverage, questions] = await Promise.all([
      getConceptCoverage(productId),
      getQuestionIntelligenceRows(productId, range),
    ]);

    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Assessments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Question intelligence and quiz quality from normalized attempts.
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
              scope="assessments"
            />
          </div>
        </div>

        <div className="mt-8">
          <AnalyticsAssessmentsView
            productId={productId}
            coverage={coverage}
            questions={questions}
          />
        </div>
      </>
    );
  } catch {
    return (
      <HomeSectionLoadError
        title="Assessment analytics did not load"
        description="Try refreshing the page."
      />
    );
  }
}
