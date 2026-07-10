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
} from "@/lib/quiz-diagnostics";
import { formatQuizDuration } from "@/lib/quiz-diagnostics";
import { QuizDiagnosticsPanel } from "@/components/analytics/quiz-diagnostics-panel";

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
    { label: "Course starts", value: data.starts },
    {
      label: "Completions",
      value: data.completions,
      detail: `${completionRate}% of starts`,
    },
    {
      label: "Quiz pass rate",
      value: formatOptionalPercent(data.quizPassRate),
      detail: `${data.attempts} attempts`,
    },
    {
      label: "Within-2-attempt pass rate",
      value: formatOptionalPercent(data.withinTwoAttemptPassRate),
    },
    {
      label: "Avg time to complete",
      value: formatQuizDuration(data.averageQuizDurationSeconds),
    },
    {
      label: "Avg quiz score",
      value: formatOptionalPercent(data.averageQuizScore),
    },
    {
      label: "Avg attempts to pass",
      value: formatOptionalNumber(data.averageAttemptsBeforePass),
    },
    { label: "Badge awards", value: data.badgeAwards },
    {
      label: "Drop-off lesson",
      value: data.dropOff ? `Lesson ${data.dropOff.order + 1}` : "n/a",
      detail: data.dropOff?.lessonTitle,
    },
  ];

  if (compactExtra) {
    const [value, ...labelParts] = compactExtra.split(" ");
    stats.push({
      label: labelParts.join(" ") || "Additional metric",
      value: value ?? compactExtra,
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
              {stat.label}
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

  const metrics = [
    { label: "Course starts", value: data.starts, icon: PlayCircle },
    {
      label: "Completions",
      value: data.completions,
      hint: `${completionRate}% of starts`,
      icon: GraduationCap,
    },
    {
      label: "Quiz pass rate",
      value: formatOptionalPercent(data.quizPassRate),
      hint: `${data.attempts} attempts`,
      icon: Target,
    },
    {
      label: "Within-2-attempt pass rate",
      value: formatOptionalPercent(data.withinTwoAttemptPassRate),
      hint:
        data.quizAbandonmentRate != null
          ? `${data.quizAbandonmentRate}% abandonment before submit`
          : undefined,
      icon: Repeat2,
    },
    {
      label: "Avg time to complete",
      value: formatQuizDuration(data.averageQuizDurationSeconds),
      icon: Timer,
    },
    {
      label: "Avg quiz score",
      value: formatOptionalPercent(data.averageQuizScore),
      icon: Gauge,
    },
    {
      label: "Avg attempts to pass",
      value: formatOptionalNumber(data.averageAttemptsBeforePass),
      icon: Target,
    },
    {
      label: "Drop-off lesson",
      value: data.dropOff ? `Lesson ${data.dropOff.order + 1}` : "n/a",
      hint: data.dropOff?.lessonTitle,
      icon: TrendingDown,
    },
    { label: "Badge awards", value: data.badgeAwards, icon: Award },
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
                  {m.label}
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
