"use client";

import * as React from "react";
import Image from "next/image";
import type { QuestionType } from "@prisma/client";
import { Plus, Loader2, Save, Trash2, X, CheckCircle2, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { cn } from "@/lib/utils";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import {
  QUESTION_TYPE_GROUPS,
  QUESTION_TYPE_LABELS,
  TRUE_FALSE_OPTIONS,
  defaultCorrectOrder,
  isSingleSelectFamily,
} from "@/lib/question-types";
import {
  createQuestion,
  updateQuestion,
} from "@/app/actions/course-editing";
import { courseEditorContext } from "@/lib/course-editor-context";

export type AdminQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  mediaUrl: string | null;
  answerOptions: string[];
  leftItems: string[];
  correctAnswer: number;
  correctAnswers: number[];
  correctOrder: number[];
  correctMatches: number[];
  acceptableAnswers: string[];
  explanation: string | null;
};

type QuestionFormProps = {
  quizId: string;
  question?: AdminQuestion;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  onDone: () => void;
  onCancel: () => void;
};

export function QuestionForm({
  quizId,
  question,
  variant = "admin",
  partnerProductId,
  onDone,
  onCancel,
}: QuestionFormProps) {
  const [type, setType] = React.useState<QuestionType>(
    question?.type ?? "single_select"
  );
  const [prompt, setPrompt] = React.useState(question?.prompt ?? "");
  const [mediaUrl, setMediaUrl] = React.useState(question?.mediaUrl ?? "");
  const [options, setOptions] = React.useState<string[]>(
    question?.answerOptions?.length
      ? question.answerOptions
      : type === "true_false"
        ? [...TRUE_FALSE_OPTIONS]
        : ["", ""]
  );
  const [leftItems, setLeftItems] = React.useState<string[]>(
    question?.leftItems?.length ? question.leftItems : ["", ""]
  );
  const [correct, setCorrect] = React.useState(question?.correctAnswer ?? 0);
  const [correctAnswers, setCorrectAnswers] = React.useState<number[]>(
    question?.correctAnswers ?? []
  );
  const [correctMatches, setCorrectMatches] = React.useState<number[]>(
    question?.correctMatches?.length
      ? question.correctMatches
      : [0, 0]
  );
  const [acceptableAnswers, setAcceptableAnswers] = React.useState<string[]>(
    question?.acceptableAnswers?.length ? question.acceptableAnswers : [""]
  );
  const [explanation, setExplanation] = React.useState(
    question?.explanation ?? ""
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (type === "true_false") {
      setOptions([...TRUE_FALSE_OPTIONS]);
      if (correct > 1) setCorrect(0);
    }
    if (type === "matching" && correctMatches.length !== leftItems.length) {
      setCorrectMatches(leftItems.map((_, index) => correctMatches[index] ?? 0));
    }
  }, [type, leftItems.length, correct, correctMatches, leftItems]);

  function handleTypeChange(nextType: QuestionType) {
    setType(nextType);
    setError(null);
    if (nextType === "true_false") {
      setOptions([...TRUE_FALSE_OPTIONS]);
      setCorrect((prev) => (prev > 1 ? 0 : prev));
    } else if (nextType === "fill_blank") {
      setOptions([]);
      if (acceptableAnswers.length === 0) setAcceptableAnswers([""]);
    } else if (options.length < 2) {
      setOptions(["", ""]);
    }
    if (nextType === "matching" && leftItems.length < 2) {
      setLeftItems(["", ""]);
      setCorrectMatches([0, 0]);
    }
    if (nextType === "multi_select" && correctAnswers.length === 0) {
      setCorrectAnswers(correct >= 0 ? [correct] : []);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    const cleanLeftItems = leftItems.map((o) => o.trim()).filter(Boolean);
    const cleanAcceptable = acceptableAnswers.map((o) => o.trim()).filter(Boolean);

    const payload = {
      type,
      prompt: prompt.trim(),
      mediaUrl: type === "image_select" ? mediaUrl || null : null,
      answerOptions:
        type === "true_false"
          ? [...TRUE_FALSE_OPTIONS]
          : type === "fill_blank"
            ? []
            : cleanOptions,
      leftItems: type === "matching" ? cleanLeftItems : [],
      correctAnswer: isSingleSelectFamily(type) ? correct : 0,
      correctAnswers: type === "multi_select" ? correctAnswers : [],
      correctOrder:
        type === "ordering" ? defaultCorrectOrder(cleanOptions.length) : [],
      correctMatches:
        type === "matching"
          ? correctMatches.slice(0, cleanLeftItems.length)
          : [],
      acceptableAnswers: type === "fill_blank" ? cleanAcceptable : [],
      explanation: explanation || null,
    };

    const editorCtx = courseEditorContext(variant, partnerProductId);
    const res = question
      ? await updateQuestion(editorCtx, question.id, payload)
      : await createQuestion(editorCtx, quizId, payload);
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
        <Label htmlFor="q-type">Question type</Label>
        <select
          id="q-type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <optgroup label="Tier 1 — Multiple choice variants">
            {QUESTION_TYPE_GROUPS.tier1.map((value) => (
              <option key={value} value={value}>
                {QUESTION_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Tier 2 — Structured questions">
            {QUESTION_TYPE_GROUPS.tier2.map((value) => (
              <option key={value} value={value}>
                {QUESTION_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-prompt">
          {type === "fill_blank" ? "Prompt (use ___ for the blank)" : "Question"}
        </Label>
        <Textarea
          id="q-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={type === "scenario_select" ? 4 : 2}
          maxLength={L.questionPrompt}
          required
          placeholder={
            type === "scenario_select"
              ? "Describe a short scenario, then ask what the learner should do."
              : type === "fill_blank"
                ? "Arcium enables ___ for decentralized applications."
                : undefined
          }
        />
      </div>

      {type === "image_select" && (
        <CloudinaryUpload
          label="Question image"
          value={mediaUrl}
          onChange={setMediaUrl}
          productId={partnerProductId}
        />
      )}

      {type === "scenario_select" && (
        <p className="text-xs text-muted-foreground">
          Scenario questions use the same single-answer grading as multiple choice.
          Write a realistic beginner situation in the prompt above.
        </p>
      )}

      {isSingleSelectFamily(type) && type !== "true_false" && (
        <OptionListEditor
          options={options}
          setOptions={setOptions}
          correct={correct}
          setCorrect={setCorrect}
          multiCorrect={false}
          label="Answer options (select the correct one)"
        />
      )}

      {type === "true_false" && (
        <div className="grid gap-2">
          <Label>Correct answer</Label>
          <div className="flex gap-3">
            {TRUE_FALSE_OPTIONS.map((opt, index) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCorrect(index)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm",
                  correct === index
                    ? "border-success bg-success/10 font-medium text-success"
                    : "hover:bg-muted/50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "multi_select" && (
        <OptionListEditor
          options={options}
          setOptions={setOptions}
          correct={correct}
          setCorrect={setCorrect}
          multiCorrect
          correctAnswers={correctAnswers}
          setCorrectAnswers={setCorrectAnswers}
          label="Answer options (select all correct answers)"
        />
      )}

      {type === "ordering" && (
        <OptionListEditor
          options={options}
          setOptions={setOptions}
          correct={0}
          setCorrect={() => {}}
          multiCorrect={false}
          label="Steps in correct order (learners will reorder a shuffled list)"
          hideCorrectSelector
        />
      )}

      {type === "matching" && (
        <div className="space-y-4">
          <OptionListEditor
            options={options}
            setOptions={setOptions}
            correct={0}
            setCorrect={() => {}}
            multiCorrect={false}
            label="Right-side options"
            hideCorrectSelector
          />
          <div className="grid gap-2">
            <Label>Left-side prompts and correct matches</Label>
            <div className="space-y-2">
              {leftItems.map((left, leftIndex) => (
                <div key={leftIndex} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                  <Input
                    value={left}
                    onChange={(e) =>
                      setLeftItems((prev) =>
                        prev.map((item, idx) =>
                          idx === leftIndex ? e.target.value : item
                        )
                      )
                    }
                    placeholder={`Left item ${leftIndex + 1}`}
                    maxLength={L.questionOption}
                    required
                  />
                  <select
                    value={correctMatches[leftIndex] ?? 0}
                    onChange={(e) =>
                      setCorrectMatches((prev) => {
                        const next = [...prev];
                        next[leftIndex] = Number(e.target.value);
                        return next;
                      })
                    }
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    {options.map((opt, optIndex) => (
                      <option key={optIndex} value={optIndex}>
                        {opt.trim() || `Option ${optIndex + 1}`}
                      </option>
                    ))}
                  </select>
                  {leftItems.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setLeftItems((prev) =>
                          prev.filter((_, idx) => idx !== leftIndex)
                        );
                        setCorrectMatches((prev) =>
                          prev.filter((_, idx) => idx !== leftIndex)
                        );
                      }}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {leftItems.length < 8 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setLeftItems((prev) => [...prev, ""]);
                  setCorrectMatches((prev) => [...prev, 0]);
                }}
              >
                <Plus />
                Add left item
              </Button>
            )}
          </div>
        </div>
      )}

      {type === "fill_blank" && (
        <div className="grid gap-2">
          <Label>Acceptable answers</Label>
          <div className="space-y-2">
            {acceptableAnswers.map((answer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={answer}
                  onChange={(e) =>
                    setAcceptableAnswers((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? e.target.value : item
                      )
                    )
                  }
                  placeholder="Accepted response"
                  maxLength={L.questionOption}
                  required
                />
                {acceptableAnswers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAcceptableAnswers((prev) =>
                        prev.filter((_, idx) => idx !== index)
                      )
                    }
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {acceptableAnswers.length < 8 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setAcceptableAnswers((prev) => [...prev, ""])}
            >
              <Plus />
              Add acceptable answer
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="q-explanation">
          Explanation <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="q-explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          maxLength={L.questionExplanation}
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

function OptionListEditor({
  options,
  setOptions,
  correct,
  setCorrect,
  multiCorrect,
  correctAnswers = [],
  setCorrectAnswers,
  label,
  hideCorrectSelector = false,
}: {
  options: string[];
  setOptions: React.Dispatch<React.SetStateAction<string[]>>;
  correct: number;
  setCorrect: (value: number) => void;
  multiCorrect: boolean;
  correctAnswers?: number[];
  setCorrectAnswers?: React.Dispatch<React.SetStateAction<number[]>>;
  label: string;
  hideCorrectSelector?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2">
            {!hideCorrectSelector && (
              <button
                type="button"
                onClick={() => {
                  if (multiCorrect && setCorrectAnswers) {
                    setCorrectAnswers((prev) =>
                      prev.includes(i)
                        ? prev.filter((v) => v !== i)
                        : [...prev, i].sort((a, b) => a - b)
                    );
                  } else {
                    setCorrect(i);
                  }
                }}
                className="shrink-0 cursor-pointer"
                aria-label="Mark as correct"
              >
                {multiCorrect ? (
                  correctAnswers.includes(i) ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )
                ) : correct === i ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" />
                )}
              </button>
            )}
            {hideCorrectSelector && (
              <span className="w-6 shrink-0 text-sm text-muted-foreground">
                {i + 1}.
              </span>
            )}
            <Input
              value={opt}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((o, idx) => (idx === i ? e.target.value : o))
                )
              }
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              maxLength={L.questionOption}
              required
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setOptions((prev) => prev.filter((_, idx) => idx !== i));
                  if (!multiCorrect && correct >= i && correct > 0) {
                    setCorrect(correct - 1);
                  }
                  if (multiCorrect && setCorrectAnswers) {
                    setCorrectAnswers((prev) =>
                      prev
                        .filter((v) => v !== i)
                        .map((v) => (v > i ? v - 1 : v))
                    );
                  }
                }}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {options.length < 8 && (
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
  );
}

export function QuestionPreviewCard({
  question,
  index,
  readOnly,
  onEdit,
  onDelete,
}: {
  question: AdminQuestion;
  index: number;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium">
          <span className="text-muted-foreground">{index + 1}. </span>
          {question.prompt}
        </p>
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
        {question.type === "image_select" && question.mediaUrl && (
          <div className="relative mt-2 aspect-video max-w-sm overflow-hidden rounded-lg border bg-muted/30">
            <Image
              src={question.mediaUrl}
              alt=""
              fill
              className="object-contain"
              sizes="320px"
            />
          </div>
        )}
        {question.type === "fill_blank" ? (
          <p className="text-sm text-muted-foreground">
            Accepts: {question.acceptableAnswers.join(", ")}
          </p>
        ) : question.type === "matching" ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {question.leftItems.map((left, leftIndex) => (
              <li key={leftIndex}>
                {left} → {question.answerOptions[question.correctMatches[leftIndex]]}
              </li>
            ))}
          </ul>
        ) : question.type === "ordering" ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {question.answerOptions.map((opt) => (
              <li key={opt}>{opt}</li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-1 pl-5 text-sm">
            {question.answerOptions.map((opt, oi) => {
              const isCorrect = question.type === "multi_select"
                ? question.correctAnswers.includes(oi)
                : oi === question.correctAnswer;
              return (
                <li
                  key={oi}
                  className={cn(
                    "flex items-center gap-2",
                    isCorrect
                      ? "font-medium text-success"
                      : "text-muted-foreground"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                  {opt}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil />
            </Button>
          )}
          {onDelete}
        </div>
      )}
    </div>
  );
}
