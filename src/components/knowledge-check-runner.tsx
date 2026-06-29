"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/app/actions/learn";

type Question = { id: string; prompt: string; answerOptions: string[] };

type SubmitResult = {
  score: number;
  passed: boolean;
  results: {
    questionId: string;
    correct: boolean;
    correctAnswer: number;
    explanation: string | null;
  }[];
};

type KnowledgeCheckRunnerProps = {
  quizId: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  ecosystemProjectId: string;
  ecosystemProjectSlug: string;
  passThreshold: number;
  questions: Question[];
  lessonPath: string;
};

export function KnowledgeCheckRunner({
  quizId,
  courseId,
  courseSlug,
  lessonId,
  ecosystemProjectId,
  ecosystemProjectSlug,
  passThreshold,
  questions,
  lessonPath,
}: KnowledgeCheckRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<(number | null)[]>(
    () => questions.map(() => null)
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === questions.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setBusy(true);
    setError(null);
    const res = await submitQuiz(quizId, answers as number[]);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult(res);
    router.refresh();
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setResult(null);
    setError(null);
  }

  if (result) {
    const resultMap = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-4">
        <Card
          className={cn(
            "border",
            result.passed ? "border-success/40 bg-success/5" : "border-border"
          )}
        >
          <CardContent className="py-5 text-center">
            <p className="text-lg font-semibold">
              {result.passed ? "Nice work" : "Review and try again"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You scored {result.score}% (passing is {passThreshold}%).
            </p>
            {!result.passed && (
              <Button className="mt-4" variant="outline" onClick={retry}>
                <RotateCcw />
                Try again
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const r = resultMap.get(q.id);
            const chosen = answers[i];
            return (
              <Card key={q.id}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-start gap-2">
                    {r?.correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <p className="text-sm font-medium">{q.prompt}</p>
                  </div>
                  {r?.explanation && (
                    <p className="pl-6 text-sm text-muted-foreground">
                      {r.explanation}
                    </p>
                  )}
                  {!r?.correct && chosen != null && (
                    <p className="pl-6 text-xs text-muted-foreground">
                      Correct answer: {q.answerOptions[r?.correctAnswer ?? 0]}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 py-4">
            <p className="text-sm font-medium">
              <span className="text-muted-foreground">{i + 1}. </span>
              {q.prompt}
            </p>
            <div className="grid gap-2">
              {q.answerOptions.map((opt, oi) => {
                const selected = answers[i] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[i] = oi;
                        return next;
                      })
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-info bg-info/5 ring-1 ring-info"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </p>
        <Button onClick={handleSubmit} disabled={!allAnswered || busy} size="sm">
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Check answers
        </Button>
      </div>
    </div>
  );
}
