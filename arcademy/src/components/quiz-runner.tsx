"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  courseCompleted: boolean;
  newBadge: boolean;
};

type Props = {
  quizId: string;
  passThreshold: number;
  questions: Question[];
  courseSlug: string;
};

export function QuizRunner({
  quizId,
  passThreshold,
  questions,
  courseSlug,
}: Props) {
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
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setResult(null);
    setError(null);
  }

  // ── Result view ──────────────────────────────────────────────────────────
  if (result) {
    const resultMap = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-6">
        <Card
          className={cn(
            "border-2",
            result.passed ? "border-success/40" : "border-destructive/40"
          )}
        >
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            {result.passed ? (
              <Trophy className="size-12 text-success" />
            ) : (
              <RotateCcw className="size-12 text-destructive" />
            )}
            <div>
              <h2 className="text-2xl font-semibold">
                {result.passed ? "You passed!" : "Not quite yet"}
              </h2>
              <p className="mt-1 text-muted-foreground">
                You scored {result.score}% — passing is {passThreshold}%.
              </p>
            </div>
            {result.newBadge && (
              <Alert variant="success" className="mt-2 text-left">
                <Award />
                <AlertTitle>Badge earned</AlertTitle>
                <AlertDescription>
                  You&apos;ve completed the course. Your new badge is in your
                  profile.
                </AlertDescription>
              </Alert>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {result.passed ? (
                <>
                  <Button asChild>
                    <Link href="/profile">
                      View my profile
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/courses/${courseSlug}`}>Back to course</Link>
                  </Button>
                </>
              ) : (
                <Button onClick={retry}>
                  <RotateCcw />
                  Try again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold">Review your answers</h3>
          {questions.map((q, i) => {
            const r = resultMap.get(q.id);
            const chosen = answers[i];
            return (
              <Card key={q.id}>
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-start gap-2">
                    {r?.correct ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    )}
                    <p className="font-medium">{q.prompt}</p>
                  </div>
                  <ul className="space-y-1.5 pl-7">
                    {q.answerOptions.map((opt, oi) => {
                      const isCorrect = r?.correctAnswer === oi;
                      const isChosen = chosen === oi;
                      return (
                        <li
                          key={oi}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-sm",
                            isCorrect && "bg-success/10 text-success font-medium",
                            isChosen &&
                              !isCorrect &&
                              "bg-destructive/10 text-destructive"
                          )}
                        >
                          {opt}
                          {isCorrect && " ✓"}
                          {isChosen && !isCorrect && " (your answer)"}
                        </li>
                      );
                    })}
                  </ul>
                  {r?.explanation && (
                    <p className="pl-7 text-sm text-muted-foreground">
                      {r.explanation}
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

  // ── Quiz view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="space-y-4 py-6">
            <p className="font-medium">
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
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors cursor-pointer",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </p>
        <Button onClick={handleSubmit} disabled={!allAnswered || busy} size="lg">
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Submit quiz
        </Button>
      </div>
    </div>
  );
}
