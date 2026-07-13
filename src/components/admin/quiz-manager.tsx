"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizStatus } from "@prisma/client";
import { LearnerVisibilityField } from "@/components/admin/learner-visibility-field";
import {
  isVisibleToLearners,
  visibilityToStatus,
} from "@/lib/learner-visibility";
import {
  upsertFinalQuiz,
  upsertLessonKnowledgeCheck,
  deleteQuestion,
} from "@/app/actions/course-editing";
import { courseEditorContext } from "@/lib/course-editor-context";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import {
  QuestionForm,
  QuestionPreviewCard,
  type AdminQuestion,
} from "@/components/admin/question-form";

export type { AdminQuestion };

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
  variant = "admin",
  partnerProductId,
  productId,
  readOnly = false,
  scope = "final",
  lessonId,
}: {
  courseId: string;
  quiz: AdminQuiz;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  productId?: string;
  readOnly?: boolean;
  scope?: "final" | "lesson";
  lessonId?: string;
}) {
  const isLessonScope = scope === "lesson";
  const router = useRouter();
  const [title, setTitle] = React.useState(
    quiz?.title ?? (isLessonScope ? "Knowledge check" : "Course Quiz")
  );
  const [description, setDescription] = React.useState(quiz?.description ?? "");
  const editorCtx = courseEditorContext(variant, partnerProductId);
  const [visibleToLearners, setVisibleToLearners] = React.useState(
    isVisibleToLearners(quiz?.status ?? "published")
  );
  const [threshold, setThreshold] = React.useState(
    String(quiz?.passThreshold ?? 70)
  );
  const [savingQuiz, setSavingQuiz] = React.useState(false);
  const [quizError, setQuizError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | "new" | null>(null);

  async function saveQuiz() {
    setSavingQuiz(true);
    setQuizError(null);
    const payload = {
      title,
      passThreshold: Number(threshold),
      description: description || null,
      status: visibilityToStatus(visibleToLearners),
    };
    const res =
      isLessonScope && lessonId
        ? await upsertLessonKnowledgeCheck(editorCtx, courseId, lessonId, payload)
        : await upsertFinalQuiz(editorCtx, courseId, payload);
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
            {isLessonScope
              ? "Optional knowledge check for this lesson. It does not block course completion or badge awards."
              : "The final quiz must be passed to complete the course and earn the badge."}
          </p>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="grid gap-2">
              <Label htmlFor="quiz-title">Quiz title</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={L.quizTitle}
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
              maxLength={L.quizDescription}
              placeholder="Explain what this quiz checks."
            />
          </div>
          {!isLessonScope && (
            <LearnerVisibilityField
              id="quiz-visibility"
              visible={visibleToLearners}
              onChange={setVisibleToLearners}
              description={
                variant === "partner"
                  ? "Published quiz content goes live when staff publishes the course."
                  : "The final quiz goes live when you publish the course if it is still hidden."
              }
            />
          )}
          {variant === "admin" && isLessonScope && (
            <LearnerVisibilityField
              id="quiz-visibility"
              visible={visibleToLearners}
              onChange={setVisibleToLearners}
              description="Optional knowledge checks can stay hidden from learners."
            />
          )}
          <div className="flex items-center gap-3">
            {!readOnly && (
              <Button onClick={saveQuiz} disabled={savingQuiz} size="sm">
                {savingQuiz ? <Loader2 className="animate-spin" /> : <Save />}
                {quiz ? "Save quiz settings" : "Create quiz"}
              </Button>
            )}
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
            {editing !== "new" && !readOnly && (
              <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
                <Plus />
                Add question
              </Button>
            )}
          </div>

          {editing === "new" && (
            <QuestionForm
              quizId={quiz.id}
              variant={variant}
              partnerProductId={partnerProductId}
              productId={productId}
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
                variant={variant}
                partnerProductId={partnerProductId}
                productId={productId}
                onDone={() => {
                  setEditing(null);
                  router.refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <Card key={q.id}>
                <CardContent className="py-4">
                  <QuestionPreviewCard
                    question={q}
                    index={i}
                    readOnly={readOnly}
                    onEdit={readOnly ? undefined : () => setEditing(q.id)}
                    onDelete={
                      readOnly ? undefined : (
                        <DeleteQuestionButton
                          questionId={q.id}
                          variant={variant}
                          partnerProductId={partnerProductId}
                          onDeleted={() => router.refresh()}
                        />
                      )
                    }
                  />
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

function DeleteQuestionButton({
  questionId,
  variant = "admin",
  partnerProductId,
  onDeleted,
}: {
  questionId: string;
  variant?: "admin" | "partner";
  partnerProductId?: string;
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
        const editorCtx = courseEditorContext(variant, partnerProductId);
        await deleteQuestion(editorCtx, questionId);
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
