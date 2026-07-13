import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { AnalyticsBackfillGate } from "@/components/partner-console/analytics/analytics-backfill-gate";
import { AnalyticsQuestionDrilldownView } from "@/components/partner-console/analytics/analytics-question-drilldown-view";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";
import { getQuestionDrilldown } from "@/lib/question-intelligence";

export const metadata = { title: "Question detail" };

export default async function PartnerAnalyticsQuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string; questionId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { productId, questionId } = await params;
  const { range: rangeParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const range = resolveAnalyticsDateRange(preset);
  const basePath = `/partner-console/${productId}/analytics/assessments/${questionId}`;

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
    const question = await getQuestionDrilldown(productId, questionId, range);
    if (!question) notFound();

    return (
      <>
        <div className="flex justify-end">
          <Suspense fallback={null}>
            <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
          </Suspense>
        </div>
        <div className="mt-4">
          <AnalyticsQuestionDrilldownView
            productId={productId}
            question={question}
          />
        </div>
      </>
    );
  } catch {
    return (
      <HomeSectionLoadError
        title="Question detail did not load"
        description="Try refreshing the page."
      />
    );
  }
}
