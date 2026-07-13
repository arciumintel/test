import Link from "next/link";
import type { QuestionDrilldown } from "@/lib/question-intelligence";
import { MetricHelpLabel } from "@/components/partner-console/analytics/analytics-info-tip";

export function AnalyticsQuestionDrilldownView({
  productId,
  question,
}: {
  productId: string;
  question: QuestionDrilldown;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/partner-console/${productId}/analytics/assessments`}
            className="text-primary hover:underline"
          >
            Assessments
          </Link>
          <span className="mx-1.5">/</span>
          Question
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          {question.prompt}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {question.courseTitle} · {question.quizTitle} · {question.type}
        </p>
        {question.conceptLinks.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Concepts:{" "}
            {question.conceptLinks.map((c, i) => (
              <span key={c.conceptId}>
                {i > 0 ? ", " : null}
                <Link
                  href={`/partner-console/${productId}/analytics/concepts/${c.conceptId}`}
                  className="text-primary hover:underline"
                >
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No concept tags.{" "}
            <Link
              href={`/partner-console/${productId}/analytics/settings`}
              className="text-primary hover:underline"
            >
              Tag this question
            </Link>{" "}
            from the course editor for mastery linkage.
          </p>
        )}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">
            <MetricHelpLabel helpKey="miss_rate">Miss rate</MetricHelpLabel>
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {question.missRatePct === null ? "—" : `${question.missRatePct}%`}
          </dd>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Attempts</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {question.attemptCount}
          </dd>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">
            <MetricHelpLabel helpKey="avg_time_on_question">Avg time</MetricHelpLabel>
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {question.avgDurationMs == null
              ? "—"
              : `${Math.round(question.avgDurationMs / 1000)}s`}
          </dd>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">
            <MetricHelpLabel helpKey="discrimination">Discrimination</MetricHelpLabel>
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {question.discriminationProxy === null
              ? "—"
              : question.discriminationProxy}
          </dd>
        </div>
      </dl>

      <section>
        <h3 className="text-base font-semibold tracking-tight">
          Option distribution
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate selections only — no free-text answers shown.
        </p>
        {question.optionDistribution.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No option-level data for this question type or period.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {question.optionDistribution.map((opt) => (
              <li key={opt.label} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="line-clamp-1">{opt.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {opt.sharePct}% ({opt.count})
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${opt.sharePct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {question.hintUsedRatePct !== null ? (
        <p className="text-sm text-muted-foreground">
          Hint used on {question.hintUsedRatePct}% of attempts (
          {question.hintUsedCount}/{question.attemptCount}).
        </p>
      ) : null}
    </div>
  );
}
