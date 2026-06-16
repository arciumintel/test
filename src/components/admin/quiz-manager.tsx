"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Save,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  upsertFinalQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/app/actions/admin";

export type AdminQuestion = {
  id: string;
  prompt: string;
  answerOptions: string[];
  correctAnswer: number;
  explanation: string | null;
};

export type AdminQuiz = {
  id: string;
  title: string;
  passThreshold: number;
  description: string | null;
  status: QuizStatus;
  questions: AdminQuestion[];
} | null;

export function QuizManager({
  courseId,
  quiz,
}: {
  courseId: string;
  quiz: AdminQuiz;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(quiz?.title ?? "Course Quiz");
  const [description, setDescription] = React.useState(quiz?.description ?? "");
  const [status, setStatus] = React.useState<QuizStatus>(quiz?.status ?? "published");
  const [threshold, setThreshold] = React.useState(
    String(quiz?.passThreshold ?? 70)
  );
  const [savingQuiz, setSavingQuiz] = React.useState(false);
  const [quizError, setQuizError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | "new" | null>(null);

  async function saveQuiz() {
    setSavingQuiz(true);
    setQuizError(null);
    const res = await upsertFinalQuiz(courseId, {
      title,
      passThreshold: Number(threshold),
      description: description || null,
      status,
    });
    setSavingQuiz(false);
    if ("error" in res) {
      setQuizError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-5">
          <p className="text-sm text-muted-foreground">
            The final quiz must be passed to complete the course and earn the
            badge.
          </p>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="grid gap-2">
              <Label htmlFor="quiz-title">Quiz title</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quiz-threshold">Pass threshold (%)</Label>
              <Input
                id="quiz-threshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quiz-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Explain what this quiz checks."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quiz-status">Status</Label>
            <Select
              id="quiz-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as QuizStatus)}
              className="max-w-xs"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveQuiz} disabled={savingQuiz} size="sm">
              {savingQuiz ? <Loader2 className="animate-spin" /> : <Save />}
              {quiz ? "Save quiz settings" : "Create quiz"}
            </Button>
            {quizError && (
              <span className="text-sm text-destructive">{quizError}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {quiz ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Questions{" "}
              <span className="text-muted-foreground">
                ({quiz.questions.length})
              </span>
            </h3>
            {editing !== "new" && (
              <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
                <Plus />
                Add question
              </Button>
            )}
          </div>

          {editing === "new" && (
            <QuestionForm
              quizId={quiz.id}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          )}

          {quiz.questions.map((q, i) =>
            editing === q.id ? (
              <QuestionForm
                key={q.id}
                quizId={quiz.id}
                question={q}
                onDone={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <Card key={q.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      <span className="text-muted-foreground">{i + 1}. </span>
                      {q.prompt}
                    </p>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(q.id)}
                      >
                        <Pencil />
                      </Button>
                      <DeleteQuestionButton
                        questionId={q.id}
                        onDeleted={() => router.refresh()}
                      />
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 pl-5 text-sm">
                    {q.answerOptions.map((opt, oi) => (
                      <li
                        key={oi}
                        className={cn(
                          "flex items-center gap-2",
                          oi === q.correctAnswer
                            ? "text-success font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {oi === q.correctAnswer ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <Circle className="size-3.5" />
                        )}
                        {opt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          )}
          {quiz.questions.length === 0 && editing !== "new" && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No questions yet. Add the first one.
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Create the quiz above to start adding questions.
        </p>
      )}
    </div>
  );
}

function QuestionForm({
  quizId,
  question,
  onDone,
  onCancel,
}: {
  quizId: string;
  question?: AdminQuestion;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [prompt, setPrompt] = React.useState(question?.prompt ?? "");
  const [options, setOptions] = React.useState<string[]>(
    question?.answerOptions ?? ["", ""]
  );
  const [correct, setCorrect] = React.useState(question?.correctAnswer ?? 0);
  const [explanation, setExplanation] = React.useState(
    question?.explanation ?? ""
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    const payload = {
      prompt,
      answerOptions: cleanOptions,
      correctAnswer: correct,
      explanation: explanation || null,
    };
    const res = question
      ? await updateQuestion(question.id, payload)
      : await createQuestion(quizId, payload);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-2">
        <Label htmlFor="q-prompt">Question</Label>
        <Textarea
          id="q-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label>Answer options (select the correct one)</Label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(i)}
                className="shrink-0 cursor-pointer"
                aria-label="Mark as correct"
              >
                {correct === i ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" />
                )}
              </button>
              <Input
                value={opt}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, idx) => (idx === i ? e.target.value : o))
                  )
                }
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                required
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setOptions((prev) => prev.filter((_, idx) => idx !== i));
                    if (correct >= i && correct > 0) setCorrect((c) => c - 1);
                  }}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            <Plus />
            Add option
          </Button>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-explanation">
          Explanation <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="q-explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Shown after the learner answers."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {question ? "Save question" : "Add question"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X />
          Cancel
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}

function DeleteQuestionButton({
  questionId,
  onDeleted,
}: {
  questionId: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await deleteQuestion(questionId);
        setBusy(false);
        onDeleted();
      }}
      aria-label="Delete question"
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Trash2 className="text-muted-foreground" />
      )}
    </Button>
  );
}
