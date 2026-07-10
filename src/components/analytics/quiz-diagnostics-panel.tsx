import { Card, CardContent } from "@/components/ui/card";
import type {
  AttemptsBeforePassBucket,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics";
import {
  formatQuizDuration,
  summarizeWithinTwoAttempts,
} from "@/lib/quiz-diagnostics";

export function QuizDiagnosticsPanel({
  diagnostics,
  attemptsBeforePass = [],
  averageQuizDurationSeconds = null,
  withinTwoAttemptPassRate = null,
}: {
  diagnostics: QuizQuestionDiagnostic[];
  attemptsBeforePass?: AttemptsBeforePassBucket[];
  averageQuizDurationSeconds?: number | null;
  withinTwoAttemptPassRate?: number | null;
}) {
  const withinTwoSummary = summarizeWithinTwoAttempts(attemptsBeforePass);
  const resolvedWithinTwoRate =
    withinTwoAttemptPassRate ?? withinTwoSummary.withinTwoAttemptPassRate;

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
      {(resolvedWithinTwoRate != null || averageQuizDurationSeconds != null) && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-base font-semibold">Quiz engagement</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Duration is measured from quiz start to submission. Per-question
              timing is not tracked in V1.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Within-2-attempt pass rate
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {resolvedWithinTwoRate == null
                    ? "n/a"
                    : `${resolvedWithinTwoRate}%`}
                </dd>
                {withinTwoSummary.learnersAttempted > 0 && (
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {withinTwoSummary.withinTwoAttemptCount} of{" "}
                    {withinTwoSummary.learnersAttempted} learners passed on
                    attempt 1 or 2
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Average time to complete
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatQuizDuration(averageQuizDurationSeconds)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

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
            <p className="mt-1 text-xs text-muted-foreground">
              Trajectory of learners who eventually passed versus those still
              trying.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {attemptsBeforePass.map((bucket) => {
                const isWithinTwo =
                  bucket.label === "Passed on attempt 1" ||
                  bucket.label === "Passed on attempt 2";
                return (
                  <li
                    key={bucket.label}
                    className="flex items-center justify-between rounded-md px-2 py-1"
                  >
                    <span
                      className={
                        isWithinTwo
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {bucket.label}
                      {isWithinTwo && (
                        <span className="ml-2 text-xs text-primary">
                          counts toward within-2 rate
                        </span>
                      )}
                    </span>
                    <span className="font-medium tabular-nums">{bucket.count}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
