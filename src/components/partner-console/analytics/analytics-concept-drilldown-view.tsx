import Link from "next/link";
import type { ConceptDrilldown } from "@/lib/concept-mastery";
import type { ConceptCoverageSummary } from "@/lib/concept-mastery";
import { ConceptCoverageBanner } from "@/components/partner-console/analytics/analytics-concepts-view";

export function AnalyticsConceptDrilldownView({
  productId,
  coverage,
  concept,
}: {
  productId: string;
  coverage: ConceptCoverageSummary;
  concept: ConceptDrilldown;
}) {
  return (
    <div className="space-y-8">
      <ConceptCoverageBanner productId={productId} coverage={coverage} />

      <div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/partner-console/${productId}/analytics/concepts`}
            className="text-primary hover:underline"
          >
            Concepts
          </Link>
          <span className="mx-1.5">/</span>
          {concept.name}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          {concept.name}
        </h2>
        {concept.description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {concept.description}
          </p>
        ) : null}
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Mastery</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {concept.masteryPct === null ? "—" : `${concept.masteryPct}%`}
            </dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Gap score</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {concept.gapScore === null ? "—" : concept.gapScore}
            </dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Attempts</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {concept.attemptCount}
            </dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Importance</dt>
            <dd className="mt-0.5 text-lg font-semibold capitalize">
              {concept.importance}
            </dd>
          </div>
        </dl>
      </div>

      <section>
        <h3 className="text-base font-semibold tracking-tight">
          Tagged lessons
        </h3>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Lesson</th>
                <th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {concept.lessons.map((l) => (
                <tr key={l.lessonId} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{l.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {l.courseTitle}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{l.weight}</td>
                </tr>
              ))}
              {concept.lessons.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No lessons tagged to this concept yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold tracking-tight">
          Tagged questions
        </h3>
        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Course / quiz</th>
                <th className="px-3 py-2 font-medium">Attempts</th>
                <th className="px-3 py-2 font-medium">Miss %</th>
              </tr>
            </thead>
            <tbody>
              {concept.questions.map((q) => (
                <tr key={q.questionId} className="border-b last:border-0">
                  <td className="max-w-sm px-3 py-2">
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
                </tr>
              ))}
              {concept.questions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No questions tagged to this concept yet. Tag questions in
                    the course editor.
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
