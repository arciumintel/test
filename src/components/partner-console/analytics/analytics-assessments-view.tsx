import Link from "next/link";
import type { QuestionIntelligenceRow } from "@/lib/question-intelligence";
import type { ConceptCoverageSummary } from "@/lib/concept-mastery";
import { ConceptCoverageBanner } from "@/components/partner-console/analytics/analytics-concepts-view";

export function AnalyticsAssessmentsView({
  productId,
  coverage,
  questions,
}: {
  productId: string;
  coverage: ConceptCoverageSummary;
  questions: QuestionIntelligenceRow[];
}) {
  const untagged = questions.filter((q) => q.conceptNames.length === 0).length;

  return (
    <div className="space-y-8">
      <ConceptCoverageBanner productId={productId} coverage={coverage} />

      {untagged > 0 ? (
        <p className="text-sm text-muted-foreground">
          {untagged} question{untagged === 1 ? "" : "s"} in this list have no
          concept tags.{" "}
          <Link
            href={`/partner-console/${productId}/analytics/settings`}
            className="text-primary hover:underline"
          >
            Review tagging
          </Link>
          .
        </p>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold tracking-tight">
          Question intelligence
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Highest miss rates first. Aggregate-only — no learner identities.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Quiz</th>
                <th className="px-3 py-2 font-medium">Attempts</th>
                <th className="px-3 py-2 font-medium">Miss %</th>
                <th className="px-3 py-2 font-medium">Avg time</th>
                <th className="px-3 py-2 font-medium">Disc.</th>
                <th className="px-3 py-2 font-medium">Concepts</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.questionId} className="border-b last:border-0">
                  <td className="max-w-xs px-3 py-2">
                    <Link
                      href={`/partner-console/${productId}/analytics/assessments/${q.questionId}`}
                      className="line-clamp-2 font-medium text-primary hover:underline"
                    >
                      {q.prompt}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {q.courseTitle} · {q.quizTitle}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{q.attemptCount}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {q.missRatePct === null ? "—" : `${q.missRatePct}%`}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {q.avgDurationMs == null
                      ? "—"
                      : `${Math.round(q.avgDurationMs / 1000)}s`}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {q.discriminationProxy === null
                      ? "—"
                      : q.discriminationProxy}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {q.conceptNames.length > 0
                      ? q.conceptNames.join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No question attempts in this period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
