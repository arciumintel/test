import Link from "next/link";
import type { AnalyticsEngineResult } from "@/lib/analytics-engine";
import { PartnerAnalyticsWeeklyChart } from "@/components/partner-console/analytics/partner-analytics-weekly-chart";
import {
  AnalyticsInfoTip,
  MetricHelpLabel,
} from "@/components/partner-console/analytics/analytics-info-tip";
import type { AnalyticsHelpKey } from "@/lib/analytics-help";

function MetricCard({
  label,
  value,
  deltaPct,
  suffix = "",
  helpKey,
}: {
  label: string;
  value: string;
  deltaPct?: number | null;
  suffix?: string;
  helpKey?: AnalyticsHelpKey;
}) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        <MetricHelpLabel helpKey={helpKey}>{label}</MetricHelpLabel>
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
        {suffix}
      </p>
      {deltaPct !== null && deltaPct !== undefined ? (
        <p
          className={
            deltaPct >= 0
              ? "mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"
              : "mt-1 inline-flex items-center gap-1 text-xs text-destructive"
          }
        >
          <span>
            {deltaPct >= 0 ? "↑" : "↓"} {Math.abs(deltaPct)}% vs comparison
          </span>
          <AnalyticsInfoTip helpKey="vs_comparison" />
        </p>
      ) : (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span>No prior period</span>
          <AnalyticsInfoTip helpKey="vs_comparison" />
        </p>
      )}
    </div>
  );
}

function formatMetric(
  data: AnalyticsEngineResult,
  id: string,
  fallback: string
): { value: string; deltaPct: number | null | undefined } {
  const m = data.metricsById[id];
  if (!m || m.value === null) return { value: fallback, deltaPct: null };
  if (m.unit === "percent" || m.unit === "score") {
    return { value: `${m.value}`, deltaPct: m.deltaPct };
  }
  return { value: String(m.value), deltaPct: m.deltaPct };
}

export function AnalyticsOverviewView({
  productId,
  data,
}: {
  productId: string;
  data: AnalyticsEngineResult;
}) {
  const starts = formatMetric(data, "active_learners", "0");
  const completion = formatMetric(data, "completion_rate", "—");
  const badges = formatMetric(data, "badges_awarded", "0");
  const quiz = formatMetric(data, "quiz_pass_rate", "—");
  const health = formatMetric(data, "health_score", "—");
  const startConv = formatMetric(data, "start_conversion_rate", "—");

  const topRecs = data.recommendations.slice(0, 3);
  const cohorts = data.overview.cohorts ?? {
    cohorts: [],
    overallCompletionRatePct: null,
  };
  const behaviour = data.overview.behaviour ?? {
    metrics: [],
    totalEngagementEvents: 0,
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Executive summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Are we healthy this period?
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Health score"
            value={health.value}
            deltaPct={health.deltaPct}
            helpKey="health_score"
          />
          <MetricCard
            label="Learners started"
            value={starts.value}
            deltaPct={starts.deltaPct}
            helpKey="learners_started"
          />
          <MetricCard
            label="Completion rate"
            value={completion.value}
            deltaPct={completion.deltaPct}
            suffix={completion.value === "—" ? "" : "%"}
            helpKey="completion_rate"
          />
          <MetricCard
            label="Badges awarded"
            value={badges.value}
            deltaPct={badges.deltaPct}
            helpKey="badges_awarded"
          />
          <MetricCard
            label="Quiz pass rate"
            value={quiz.value}
            deltaPct={quiz.deltaPct}
            suffix={quiz.value === "—" ? "" : "%"}
            helpKey="quiz_pass_rate"
          />
          <MetricCard
            label="Start conversion"
            value={startConv.value}
            deltaPct={startConv.deltaPct}
            suffix={startConv.value === "—" ? "" : "%"}
            helpKey="start_conversion"
          />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
              Top recommendations
              <AnalyticsInfoTip helpKey="recommendation_priority" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What should we improve next?
            </p>
          </div>
          <Link
            href={`/partner-console/${productId}/analytics/recommendations`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {topRecs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No recommendations for this period.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {topRecs.map((rec) => (
              <li key={rec.id} className="rounded-lg border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {rec.priority} · {rec.category}
                  </span>
                </div>
                <p className="mt-1 font-medium">{rec.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rec.rationale}</p>
                <Link
                  href={rec.href}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  {rec.evidenceLabel ?? "View evidence"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          Learning funnel
          <AnalyticsInfoTip helpKey="learning_funnel" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Where do learners drop?</p>
        <ol className="mt-4 space-y-2">
          {data.overview.funnel.map((step) => (
            <li
              key={step.label}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span>{step.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {step.count}
                {step.rateFromPrevious !== null
                  ? ` · ${step.rateFromPrevious}% from previous`
                  : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            Cohorts
            <AnalyticsInfoTip helpKey="cohorts" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start-week completion
            {cohorts.overallCompletionRatePct !== null
              ? ` · overall ${cohorts.overallCompletionRatePct}%`
              : ""}
          </p>
          {cohorts.cohorts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No cohort data in this period.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {cohorts.cohorts.slice(-6).map((c) => (
                <li
                  key={c.weekStart}
                  className="flex justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span className="text-muted-foreground">Week of {c.weekStart}</span>
                  <span className="tabular-nums">
                    {c.completers}/{c.starters} · {c.completionRatePct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            Learning behaviour
            <AnalyticsInfoTip helpKey="learning_behaviour" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregate engagement events
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {behaviour.metrics.map((m) => (
              <li
                key={m.id}
                className="flex justify-between gap-2 rounded-md border px-3 py-2"
              >
                <span>{m.label}</span>
                <span className="tabular-nums text-muted-foreground">{m.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Weekly trends</h2>
        <div className="mt-4">
          <PartnerAnalyticsWeeklyChart
            trends={data.overview.weeklyTrends}
            rangeLabel={data.range.label}
            range={data.range}
          />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Published course performance
            </p>
          </div>
          <Link
            href={`/partner-console/${productId}/analytics/courses`}
            className="text-sm text-primary hover:underline"
          >
            View courses
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Starts</th>
                <th className="px-3 py-2 font-medium">Completions</th>
                <th className="px-3 py-2 font-medium">Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.slice(0, 5).map((course) => (
                <tr key={course.courseId} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/partner-console/${productId}/analytics/courses/${course.courseId}`}
                      className="text-primary hover:underline"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{course.starts}</td>
                  <td className="px-3 py-2 tabular-nums">{course.completions}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {course.quizPassRate === null ? "—" : `${course.quizPassRate}%`}
                  </td>
                </tr>
              ))}
              {data.courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-muted-foreground">
                    No published courses in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {data.overview.staffNotes ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Staff notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {data.overview.staffNotes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
