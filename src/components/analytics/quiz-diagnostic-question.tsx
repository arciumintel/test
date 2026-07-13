import type { QuizQuestionDiagnostic } from "@/lib/quiz-diagnostics-shared";
import { questionTypeBadgeClass } from "@/lib/question-types";
import { cn } from "@/lib/utils";

export function QuizDiagnosticQuestion({
  diagnostic: q,
}: {
  diagnostic: QuizQuestionDiagnostic;
}) {
  return (
    <div className="border-b border-border/50 pb-6 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Q{q.order + 1}. {q.prompt}
          </p>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              questionTypeBadgeClass(q.type)
            )}
          >
            {q.typeLabel}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {q.missRate}% miss rate · {q.attemptCount} attempts
        </span>
      </div>

      {q.optionDistribution && q.optionDistribution.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.optionDistribution.map((opt) => (
            <li key={opt.label} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="line-clamp-1 pr-2">{opt.label}</span>
                <span className="text-muted-foreground">{opt.percent}%</span>
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
      )}

      {q.positionAccuracy && q.positionAccuracy.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.positionAccuracy.map((position) => (
            <li key={position.label} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="line-clamp-1 pr-2">{position.label}</span>
                <span className="text-muted-foreground">
                  {position.correctPercent}% placed correctly
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-muted-foreground/50"
                  style={{ width: `${position.correctPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {q.pairMissRates && q.pairMissRates.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.pairMissRates.map((pair) => (
            <li key={pair.left} className="flex justify-between text-xs">
              <span className="line-clamp-1 pr-2">{pair.left}</span>
              <span className="text-muted-foreground">
                {pair.missRate}% miss rate
              </span>
            </li>
          ))}
        </ul>
      )}

      {q.commonWrongAnswers && q.commonWrongAnswers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.commonWrongAnswers.map((entry) => (
            <li key={entry.answer} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="line-clamp-1 pr-2">
                  Wrong answer: {entry.answer}
                </span>
                <span className="text-muted-foreground">{entry.percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-destructive/40"
                  style={{ width: `${entry.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
