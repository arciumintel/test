"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CourseAnalyticsView } from "@/components/analytics/course-analytics-view";
import { QuizDiagnosticQuestion } from "@/components/analytics/quiz-diagnostic-question";
import type { PartnerPlusCourseAnalytics } from "@/lib/partner-analytics";

export function PartnerAnalyticsCourseDetail({
  data,
}: {
  data: PartnerPlusCourseAnalytics;
}) {
  return (
    <div className="space-y-8">
      <CourseAnalyticsView
        data={data}
        variant="compact"
        compactExtra={`${data.badgeVerificationViews} badge verification views`}
      />

      {data.attemptsBeforePass.some((b) => b.count > 0) && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">Attempts before pass</h2>
            <div className="mt-4 space-y-3">
              {data.attemptsBeforePass.map((bucket) => {
                const max = Math.max(
                  ...data.attemptsBeforePass.map((b) => b.count),
                  1
                );
                return (
                  <div key={bucket.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{bucket.label}</span>
                      <span className="text-muted-foreground">
                        {bucket.count} learners
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round((bucket.count / max) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.quizDiagnostics.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">Quiz diagnostics</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Aggregated miss rates help identify confusing questions. Individual
              answers are not shown.
            </p>
            <div className="mt-4 space-y-6">
              {data.quizDiagnostics.map((q) => (
                <QuizDiagnosticQuestion key={q.questionId} diagnostic={q} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
