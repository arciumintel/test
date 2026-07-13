import Link from "next/link";
import type {
  ConceptCoverageSummary,
  ConceptMasteryRow,
} from "@/lib/concept-mastery";

export function ConceptCoverageBanner({
  productId,
  coverage,
}: {
  productId: string;
  coverage: ConceptCoverageSummary;
}) {
  if (coverage.complete) return null;

  return (
    <div className="rounded-lg border border-dashed px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            Concept coverage {coverage.coveragePct}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {coverage.lessonTagged}/{coverage.lessonTotal} lessons and{" "}
            {coverage.questionTagged}/{coverage.questionTotal} questions tagged.
            Tag content to unlock accurate mastery and gap scores.
          </p>
        </div>
        <Link
          href={`/partner-console/${productId}/analytics/settings`}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Manage concepts & tagging
        </Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: `${Math.min(100, coverage.coveragePct)}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsConceptsView({
  productId,
  coverage,
  concepts,
  gaps,
}: {
  productId: string;
  coverage: ConceptCoverageSummary;
  concepts: ConceptMasteryRow[];
  gaps: ConceptMasteryRow[];
}) {
  const settingsHref = `/partner-console/${productId}/analytics/settings`;

  return (
    <div className="space-y-10">
      <ConceptCoverageBanner productId={productId} coverage={coverage} />

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Knowledge gaps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Highest gap scores first — importance × (1 − mastery).
        </p>
        {gaps.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {concepts.length === 0 ? (
              <>
                No concepts yet.{" "}
                <Link href={settingsHref} className="text-primary hover:underline">
                  Add concepts in Analytics settings
                </Link>
                , then tag lessons and questions.
              </>
            ) : (
              "Not enough tagged question attempts in this period to rank gaps."
            )}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {gaps.map((g) => (
              <li
                key={g.conceptId}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Link
                  href={`/partner-console/${productId}/analytics/concepts/${g.conceptId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {g.name}
                </Link>
                <span className="tabular-nums text-muted-foreground">
                  Gap {g.gapScore} · Mastery {g.masteryPct}% · {g.attemptCount}{" "}
                  attempts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Concept mastery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Weighted correct rate on tagged questions.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Concept</th>
                <th className="px-3 py-2 font-medium">Importance</th>
                <th className="px-3 py-2 font-medium">Tags</th>
                <th className="px-3 py-2 font-medium">Attempts</th>
                <th className="px-3 py-2 font-medium">Mastery</th>
                <th className="px-3 py-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.conceptId} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/partner-console/${productId}/analytics/concepts/${c.conceptId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">
                    {c.importance}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {c.taggedQuestionCount}q · {c.taggedLessonCount}l
                  </td>
                  <td className="px-3 py-2 tabular-nums">{c.attemptCount}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {c.masteryPct === null ? "—" : `${c.masteryPct}%`}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {c.gapScore === null ? "—" : c.gapScore}
                  </td>
                </tr>
              ))}
              {concepts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No concepts defined.{" "}
                    <Link
                      href={settingsHref}
                      className="text-primary hover:underline"
                    >
                      Create concepts in settings
                    </Link>
                    .
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
