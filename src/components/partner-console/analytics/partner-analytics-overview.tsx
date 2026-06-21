"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsRangePreset } from "@/lib/analytics-date-range";
import { resolveAnalyticsDateRange } from "@/lib/analytics-date-range";
import type { PartnerPlusAnalytics } from "@/lib/partner-analytics";
import { PartnerAnalyticsWeeklyChart } from "@/components/partner-console/analytics/partner-analytics-weekly-chart";

function formatOptionalPercent(value: number | null): string {
  return value === null ? "n/a" : `${value}%`;
}

export function PartnerAnalyticsOverview({
  productId,
  data,
  rangePreset,
}: {
  productId: string;
  data: PartnerPlusAnalytics;
  rangePreset: AnalyticsRangePreset;
}) {
  const range = resolveAnalyticsDateRange(rangePreset);
  const { summary, discovery } = data;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{data.rangeLabel}:</span>{" "}
        {summary.starts} starts · {summary.completions} completions (
        {summary.completionRate}% of starts) ·{" "}
        {formatOptionalPercent(summary.quizPassRate)} quiz pass rate ·{" "}
        {summary.badgeAwards} badge awards · {discovery.projectPageViews}{" "}
        project page views · {discovery.courseDetailViews} course page views
        {discovery.startConversionRate === null
          ? ""
          : ` · ${discovery.startConversionRate}% start conversion`}
      </p>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Published courses</h2>
          <Link
            href={`/partner-console/${productId}/analytics/reports?range=${rangePreset}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Export report
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {data.courses.length > 0 ? (
          <Card className="mt-4">
            <CardContent className="py-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Course</th>
                      <th className="pb-2 pr-4 text-right font-medium">Starts</th>
                      <th className="pb-2 pr-4 text-right font-medium">Done</th>
                      <th className="pb-2 pr-4 text-right font-medium">Badges</th>
                      <th className="pb-2 pr-4 text-right font-medium">Quiz pass</th>
                      <th className="pb-2 text-right font-medium">Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((c) => (
                      <tr key={c.courseId} className="border-b border-border/50">
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/partner-console/${productId}/analytics/courses/${c.courseId}`}
                            className="font-medium hover:underline"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-right">{c.starts}</td>
                        <td className="py-2.5 pr-4 text-right">{c.completions}</td>
                        <td className="py-2.5 pr-4 text-right">{c.badgeAwards}</td>
                        <td className="py-2.5 pr-4 text-right">
                          {c.quizPassRate === null ? "n/a" : `${c.quizPassRate}%`}
                        </td>
                        <td className="py-2.5 text-right">
                          {c.averageQuizScore === null
                            ? "n/a"
                            : `${c.averageQuizScore}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No published courses yet. Metrics will appear after your first course goes live.
          </p>
        )}
      </section>

      {data.insights.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">Insights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {data.insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.staffNotes && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">Notes from Arcademy staff</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {data.staffNotes}
            </p>
          </CardContent>
        </Card>
      )}

      <PartnerAnalyticsFunnel funnel={data.funnel} />
      <PartnerAnalyticsWeeklyChart
        trends={data.weeklyTrends}
        rangeLabel={data.rangeLabel}
        range={range}
      />
    </div>
  );
}

function PartnerAnalyticsFunnel({
  funnel,
}: {
  funnel: PartnerPlusAnalytics["funnel"];
}) {
  const max = Math.max(...funnel.map((s) => s.count), 1);
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="text-sm font-semibold">Learner funnel</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Steps from course page view through badge award in this period.
        </p>
        <div className="mt-4 space-y-3">
          {funnel.map((step) => (
            <div key={step.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{step.label}</span>
                <span className="text-muted-foreground">
                  {step.count}
                  {step.rateFromPrevious !== null && step.rateFromPrevious > 0
                    ? ` · ${step.rateFromPrevious}% of previous`
                    : ""}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((step.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
