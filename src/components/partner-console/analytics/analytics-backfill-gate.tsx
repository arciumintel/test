import Link from "next/link";
import type { QuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";

export function AnalyticsBackfillGate({
  productId,
  status,
}: {
  productId: string;
  status: QuestionAttemptBackfillStatus;
}) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-5">
      <h2 className="text-lg font-semibold tracking-tight">
        Question data not ready yet
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Concepts and Assessments need normalized question attempts.{" "}
        {status.message}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Coverage: {status.attemptsWithRows} / {status.quizAttemptCount} quiz
        attempts ({Math.round(status.coverageRatio * 100)}%).{" "}
        {status.questionAttemptCount} question rows stored.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-md bg-muted/60 px-3 py-2 text-xs">
        pnpm db:backfill-question-attempts
      </pre>
      <p className="mt-4 text-sm">
        <Link
          href={`/partner-console/${productId}/analytics`}
          className="text-primary hover:underline"
        >
          Back to Overview
        </Link>
      </p>
    </div>
  );
}
