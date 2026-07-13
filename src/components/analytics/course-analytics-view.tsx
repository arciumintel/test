import {
  PlayCircle,
  GraduationCap,
  Target,
  Gauge,
  TrendingDown,
  Award,
  Timer,
  Repeat2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseAnalytics } from "@/lib/analytics";
import type {
  AttemptsBeforePassBucket,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics-shared";
import { formatQuizDuration } from "@/lib/quiz-diagnostics-shared";
import { QuizDiagnosticsPanel } from "@/components/analytics/quiz-diagnostics-panel";
import { MetricHelpLabel } from "@/components/partner-console/analytics/analytics-info-tip";
import type { AnalyticsHelpKey } from "@/lib/analytics-help";

function formatOptionalPercent(value: number | null): string {
  return value === null ? "n/a" : `${value}%`;
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "n/a" : String(value);
}

type CompactStat = {
  label: string;
  value: string | number;
  detail?: string;
  helpKey?: AnalyticsHelpKey;
};

const COURSE_STAT_HELP: Record<string, AnalyticsHelpKey> = {
  "Course starts": "course_starts",
  Completions: "course_completions",
  "Quiz pass rate": "quiz_pass_rate",
  "Within-2-attempt pass rate": "within_2_attempt_pass_rate",
  "Avg time to complete": "avg_time_to_complete",
  "Avg quiz score": "avg_quiz_score",
  "Avg attempts to pass": "avg_attempts_to_pass",
  "Badge awards": "badges_awarded",
  "Drop-off lesson": "drop_off_lesson",
  "badge verification views": "badge_verification_views",
};

function CourseAnalyticsCompactSummary({
  data,
  compactExtra,
}: {
  data: CourseAnalytics;
  compactExtra?: string;
}) {
  const completionRate =
    data.starts > 0 ? Math.round((data.completions / data.starts) * 100) : 0;

  const stats: CompactStat[] = [
    {
      label: "Course starts",
      value: data.starts,
      helpKey: "course_starts",
    },
    {
      label: "Completions",
      value: data.completions,
      detail: `${completionRate}% of starts`,
      helpKey: "course_completions",
    },
    {
      label: "Quiz pass rate",
      value: formatOptionalPercent(data.quizPassRate),
      detail: `${data.attempts} attempts`,
      helpKey: "quiz_pass_rate",
    },
    {
      label: "Within-2-attempt pass rate",
      value: formatOptionalPercent(data.withinTwoAttemptPassRate),
      helpKey: "within_2_attempt_pass_rate",
    },
    {
      label: "Avg time to complete",
      value: formatQuizDuration(data.averageQuizDurationSeconds),
      helpKey: "avg_time_to_complete",
    },
    {
      label: "Avg quiz score",
      value: formatOptionalPercent(data.averageQuizScore),
      helpKey: "avg_quiz_score",
    },
    {
      label: "Avg attempts to pass",
      value: formatOptionalNumber(data.averageAttemptsBeforePass),
      helpKey: "avg_attempts_to_pass",
    },
    {
      label: "Badge awards",
      value: data.badgeAwards,
      helpKey: "badges_awarded",
    },
    {
      label: "Drop-off lesson",
      value: data.dropOff ? `Lesson ${data.dropOff.order + 1}` : "n/a",
      detail: data.dropOff?.lessonTitle,
      helpKey: "drop_off_lesson",
    },
  ];

  if (compactExtra) {
    const [value, ...labelParts] = compactExtra.split(" ");
    const label = labelParts.join(" ") || "Additional metric";
    stats.push({
      label,
      value: value ?? compactExtra,
      helpKey: COURSE_STAT_HELP[label],
    });
  }

  return (
    <section
      aria-labelledby="course-analytics-summary-heading"
      className="rounded-lg border border-border bg-muted/25 px-4 py-4 sm:px-5 sm:py-5"
    >
      <h2
        id="course-analytics-summary-heading"
        className="text-sm font-semibold text-foreground"
      >
        Course summary
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-xs font-medium leading-snug text-muted-foreground">
              <MetricHelpLabel helpKey={stat.helpKey}>{stat.label}</MetricHelpLabel>
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {stat.value}
            </dd>
            {stat.detail && (
              <dd className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {stat.detail}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CourseAnalyticsView({
  data,
  variant = "default",
  compactExtra,
  quizDiagnostics,
  attemptsBeforePass,
}: {
  data: CourseAnalytics;
  variant?: "default" | "compact";
  compactExtra?: string;
  quizDiagnostics?: QuizQuestionDiagnostic[];
  attemptsBeforePass?: AttemptsBeforePassBucket[];
}) {
  const completionRate =
    data.starts > 0 ? Math.round((data.completions / data.starts) * 100) : 0;

  const metrics: Array<{
    label: string;
    value: string | number;
    hint?: string;
    icon: typeof PlayCircle;
    helpKey?: AnalyticsHelpKey;
  }> = [
    {
      label: "Course starts",
      value: data.starts,
      icon: PlayCircle,
      helpKey: "course_starts",
    },
    {
      label: "Completions",
      value: data.completions,
      hint: `${completionRate}% of starts`,
      icon: GraduationCap,
      helpKey: "course_completions",
    },
    {
      label: "Quiz pass rate",
      value: formatOptionalPercent(data.quizPassRate),
      hint: `${data.attempts} attempts`,
      icon: Target,
      helpKey: "quiz_pass_rate",
    },
    {
      label: "Within-2-attempt pass rate",
      value: formatOptionalPercent(data.withinTwoAttemptPassRate),
      hint:
        data.quizAbandonmentRate != null
          ? `${data.quizAbandonmentRate}% abandonment before submit`
          : undefined,
      icon: Repeat2,
      helpKey: "within_2_attempt_pass_rate",
    },
    {
      label: "Avg time to complete",
      value: formatQuizDuration(data.averageQuizDurationSeconds),
      icon: Timer,
      helpKey: "avg_time_to_complete",
    },
    {
      label: "Avg quiz score",
      value: formatOptionalPercent(data.averageQuizScore),
      icon: Gauge,
      helpKey: "avg_quiz_score",
    },
    {
      label: "Avg attempts to pass",
      value: formatOptionalNumber(data.averageAttemptsBeforePass),
      icon: Target,
      helpKey: "avg_attempts_to_pass",
    },
    {
      label: "Drop-off lesson",
      value: data.dropOff ? `Lesson ${data.dropOff.order + 1}` : "n/a",
      hint: data.dropOff?.lessonTitle,
      icon: TrendingDown,
      helpKey: "drop_off_lesson",
    },
    {
      label: "Badge awards",
      value: data.badgeAwards,
      icon: Award,
      helpKey: "badges_awarded",
    },
  ];

  return (
    <div className="space-y-6">
      {variant === "compact" ? (
        <CourseAnalyticsCompactSummary
          data={data}
          compactExtra={compactExtra}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <Card key={m.label}>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <m.icon className="size-4" />
                  <MetricHelpLabel helpKey={m.helpKey}>{m.label}</MetricHelpLabel>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{m.value}</p>
                {m.hint && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {m.hint}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.lessonFunnel.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-base font-semibold text-foreground">
              Lesson completion funnel
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Share of starters who completed each lesson in this period.
            </p>
            <div className="mt-4 space-y-3">
              {data.lessonFunnel.map((step) => {
                const pct =
                  data.starts > 0
                    ? Math.round((step.completed / data.starts) * 100)
                    : 0;
                return (
                  <div key={step.order}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="line-clamp-1 font-medium text-foreground">
                        {step.order + 1}. {step.title}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {step.completed} learner{step.completed === 1 ? "" : "s"}
                        <span className="sr-only"> completed</span>
                        <span aria-hidden className="text-foreground/80">
                          {" "}
                          · {pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {quizDiagnostics && (
        <QuizDiagnosticsPanel
          diagnostics={quizDiagnostics}
          attemptsBeforePass={attemptsBeforePass}
          averageQuizDurationSeconds={data.averageQuizDurationSeconds}
          withinTwoAttemptPassRate={data.withinTwoAttemptPassRate}
        />
      )}
    </div>
  );
}
