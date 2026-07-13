"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitQuiz, type QuizQuestionResult } from "@/app/actions/learn";
import {
  isAnswerComplete,
  QuestionInput,
  type QuestionAnswerState,
} from "@/components/quiz/question-input";
import { QuestionReview } from "@/components/quiz/question-review";
import type { LearnerQuestion, QuizSubmissionAnswer } from "@/lib/question-types";

type SubmitResult = {
  score: number;
  passed: boolean;
  results: QuizQuestionResult[];
};

type KnowledgeCheckRunnerProps = {
  quizId: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  ecosystemProjectId: string;
  ecosystemProjectSlug: string;
  passThreshold: number;
  questions: LearnerQuestion[];
  lessonPath: string;
};

export function KnowledgeCheckRunner({
  quizId,
  passThreshold,
  questions,
}: KnowledgeCheckRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<QuestionAnswerState[]>(() =>
    questions.map(() => null)
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const answeredCount = answers.filter((answer, index) =>
    isAnswerComplete(questions[index], answer)
  ).length;
  const allAnswered = answeredCount === questions.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setBusy(true);
    setError(null);
    const res = await submitQuiz(quizId, answers as QuizSubmissionAnswer[]);
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
            if (!r) return null;
            return (
              <Card key={q.id}>
                <CardContent className="py-4">
                  <QuestionReview
                    question={q}
                    answer={answers[i]}
                    result={r}
                  />
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
            {q.type !== "fill_blank" && (
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">{i + 1}. </span>
                {q.prompt}
              </p>
            )}
            <QuestionInput
              question={q}
              value={answers[i]}
              onChange={(value) =>
                setAnswers((prev) => {
                  const next = [...prev];
                  next[i] = value;
                  return next;
                })
              }
            />
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
