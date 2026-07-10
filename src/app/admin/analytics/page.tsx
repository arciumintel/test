import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatMetric } from "@/components/ui/stat-metric";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  EcosystemTrendChart,
  type EcosystemTrendChartPoint,
} from "@/components/admin/ecosystem-trend-chart";
import { EcosystemReportExport } from "@/components/admin/ecosystem-report-export";
import { getEcosystemOverview } from "@/lib/ecosystem-analytics";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { productPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Ecosystem analytics · Admin" };

function FunnelBar({
  label,
  value,
  max,
  rate,
}: {
  label: string;
  value: number;
  max: number;
  rate: number | null;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {value}
          {rate != null && (
            <span className="ml-2 text-xs">({rate}% of previous)</span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScorecardStatus({ met }: { met: boolean | null }) {
  if (met === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CircleDashed className="size-3.5" />
        No data yet
      </span>
    );
  }
  if (met) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        On target
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
      <XCircle className="size-3.5" />
      Below target
    </span>
  );
}

function trendChartData(
  trends: Awaited<ReturnType<typeof getEcosystemOverview>>["trends"]
): EcosystemTrendChartPoint[] {
  const started = trends.find((t) => t.eventName === "course_started");
  const completed = trends.find((t) => t.eventName === "course_completed");
  const dates = started?.points ?? completed?.points ?? [];

  return dates.map((point, i) => ({
    date: point.date,
    label: formatShortDate(point.date),
    started: started?.points[i]?.count ?? 0,
    completed: completed?.points[i]?.count ?? 0,
  }));
}

function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function EcosystemAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const preset = parseAnalyticsRangePreset(params.range);
  const range = resolveAnalyticsDateRange(preset);

  const overview = await getEcosystemOverview(range);
  const funnelMax = Math.max(...overview.funnel.map((s) => s.count), 1);
  const chartData = trendChartData(overview.trends);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ecosystem overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Onboarding health across the Arcium ecosystem · {range.label}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <PartnerAnalyticsDateRange basePath="/admin/analytics" current={preset} />
          <EcosystemReportExport rangePreset={preset} />
        </div>
      </div>

      {/* Scorecard against PRD targets */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {overview.scorecard.map((entry) => (
          <div
            key={entry.key}
            className="rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {entry.value}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                target {entry.target}
              </span>
            </p>
            <div className="mt-1.5">
              <ScorecardStatus met={entry.met} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onboarding funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.funnel.map((step) => (
              <FunnelBar
                key={step.key}
                label={step.label}
                value={step.count}
                max={funnelMax}
                rate={step.rateFromPrevious}
              />
            ))}
          </CardContent>
        </Card>

        <EcosystemTrendChart data={chartData} rangeLabel={range.label} />
      </div>

      {/* Learner cohorts */}
      <h2 className="mt-10 text-lg font-semibold tracking-tight">
        Learner cohorts
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMetric
          label="Wallet-connected learners"
          value={overview.cohorts.walletConnectedLearners}
        />
        <StatMetric
          label="Active in a course"
          value={overview.cohorts.learnersWithProgress}
          hint={`${overview.cohorts.learnersWithBadge} hold at least one badge`}
        />
        <StatMetric
          label="Return rate"
          value={
            overview.cohorts.returnRate != null
              ? `${overview.cohorts.returnRate}%`
              : "—"
          }
          hint={`${overview.cohorts.multiCourseLearners} learners in more than one course`}
        />
        <StatMetric
          label="Median time to completion"
          value={
            overview.cohorts.medianDaysToCompletion != null
              ? `${overview.cohorts.medianDaysToCompletion}d`
              : "—"
          }
          hint="First lesson activity to badge award"
        />
      </div>

      {/* Cross-product comparison */}
      <h2 className="mt-10 text-lg font-semibold tracking-tight">
        Ecosystem projects
      </h2>
      <Card className="mt-4">
        <CardContent className="pt-4">
          {overview.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published projects yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Project</th>
                    <th className="py-2 pr-4 text-right font-medium">Courses</th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Learners started
                    </th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Badges awarded
                    </th>
                    <th className="py-2 text-right font-medium">
                      Completion rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.products.map((product) => (
                    <tr key={product.productId} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={productPath(product.productSlug)}
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          {product.productName}
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {product.publishedCourses}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {product.starts}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {product.badgeAwards}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {product.completionRate != null
                          ? `${product.completionRate}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz hotspots */}
      <h2 className="mt-10 text-lg font-semibold tracking-tight">
        Where learners struggle
      </h2>
      <Card className="mt-4">
        <CardContent className="pt-4">
          {overview.quizHotspots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No frequently missed quiz questions in this period. Hotspots appear
              once a question has at least three recorded answers.
            </p>
          ) : (
            <ul className="space-y-3">
              {overview.quizHotspots.map((hotspot) => (
                <li
                  key={`${hotspot.courseId}-${hotspot.prompt}`}
                  className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {hotspot.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hotspot.courseTitle}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {hotspot.missRate}%
                    </span>{" "}
                    missed · {hotspot.attemptCount} answers
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground">
        Aggregate metrics only — no individual wallet addresses are shown.
        Referral attribution lives in{" "}
        <Link href="/admin/analytics/referrals" className="underline">
          Referrals
        </Link>
        . Use the export above to share a report with the Arcium team.
      </p>
    </>
  );
}
