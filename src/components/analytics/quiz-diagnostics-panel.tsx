import { Card, CardContent } from "@/components/ui/card";
import type {
  AttemptsBeforePassBucket,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics";

export function QuizDiagnosticsPanel({
  diagnostics,
  attemptsBeforePass = [],
}: {
  diagnostics: QuizQuestionDiagnostic[];
  attemptsBeforePass?: AttemptsBeforePassBucket[];
}) {
  if (diagnostics.length === 0 && attemptsBeforePass.length === 0) {
    return (
      <Card>
        <CardContent className="py-5 text-sm text-muted-foreground">
          No final quiz attempts yet. Per-question diagnostics appear after
          learners submit the quiz.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {diagnostics.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-base font-semibold">Quiz diagnostics</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Aggregated miss rates help identify confusing questions.
            </p>
            <div className="mt-4 space-y-6">
              {diagnostics.map((q) => (
                <div
                  key={q.questionId}
                  className="border-b border-border/50 pb-6 last:border-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      Q{q.order + 1}. {q.prompt}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {q.missRate}% miss rate · {q.attemptCount} attempts
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {q.optionDistribution.map((opt) => (
                      <li key={opt.label} className="text-xs">
                        <div className="mb-1 flex justify-between">
                          <span className="line-clamp-1 pr-2">{opt.label}</span>
                          <span className="text-muted-foreground">
                            {opt.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-muted-foreground/50"
                            style={{ width: `${opt.percent}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {attemptsBeforePass.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-base font-semibold">Attempts before pass</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {attemptsBeforePass.map((bucket) => (
                <li
                  key={bucket.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">{bucket.label}</span>
                  <span className="font-medium tabular-nums">{bucket.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
