import {
  PlayCircle,
  GraduationCap,
  Target,
  Gauge,
  TrendingDown,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseAnalytics } from "@/lib/analytics";

export function AnalyticsPanel({ data }: { data: CourseAnalytics }) {
  const completionRate =
    data.starts > 0 ? Math.round((data.completions / data.starts) * 100) : 0;

  const metrics = [
    {
      label: "Course starts",
      value: data.starts,
      icon: PlayCircle,
    },
    {
      label: "Completions",
      value: data.completions,
      hint: `${completionRate}% of starts`,
      icon: GraduationCap,
    },
    {
      label: "Quiz pass rate",
      value: data.quizPassRate === null ? "—" : `${data.quizPassRate}%`,
      hint: `${data.attempts} attempts`,
      icon: Target,
    },
    {
      label: "Avg quiz score",
      value:
        data.averageQuizScore === null ? "—" : `${data.averageQuizScore}%`,
      icon: Gauge,
    },
    {
      label: "Drop-off lesson",
      value: data.dropOff ? `Lesson ${data.dropOff.order + 1}` : "—",
      hint: data.dropOff?.lessonTitle,
      icon: TrendingDown,
    },
    {
      label: "Badge awards",
      value: data.badgeAwards,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <m.icon className="size-4" />
                {m.label}
              </div>
              <p className="mt-2 text-2xl font-semibold">{m.value}</p>
              {m.hint && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {m.hint}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.lessonFunnel.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold">Lesson completion funnel</h3>
            <div className="mt-4 space-y-3">
              {data.lessonFunnel.map((step) => {
                const pct =
                  data.starts > 0
                    ? Math.round((step.completed / data.starts) * 100)
                    : 0;
                return (
                  <div key={step.order}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="line-clamp-1 pr-2">
                        {step.order + 1}. {step.title}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {step.completed} learner{step.completed === 1 ? "" : "s"}
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
    </div>
  );
}
