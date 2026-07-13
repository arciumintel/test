"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildMatchingDisplayOptions,
  isSingleSelectFamily,
  shuffleWithSeed,
  type LearnerQuestion,
  type QuizSubmissionAnswer,
} from "@/lib/question-types";

export type QuestionAnswerState = QuizSubmissionAnswer | null;

type QuestionInputProps = {
  question: LearnerQuestion;
  value: QuestionAnswerState;
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
};

export function QuestionInput({
  question,
  value,
  onChange,
  disabled = false,
}: QuestionInputProps) {
  if (isSingleSelectFamily(question.type)) {
    return (
      <SingleSelectInput
        question={question}
        value={typeof value === "number" ? value : null}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (question.type === "multi_select") {
    return (
      <MultiSelectInput
        question={question}
        value={Array.isArray(value) ? value.filter((v) => typeof v === "number") : []}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (question.type === "ordering") {
    return (
      <OrderingInput
        question={question}
        value={Array.isArray(value) ? value.filter((v) => typeof v === "number") : null}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (question.type === "matching") {
    return (
      <MatchingInput
        question={question}
        value={Array.isArray(value) ? value.filter((v) => typeof v === "number") : null}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  return (
    <FillBlankInput
      question={question}
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

function QuestionMedia({ mediaUrl }: { mediaUrl: string }) {
  return (
    <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg border bg-muted/30">
      <Image
        src={mediaUrl}
        alt=""
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 640px"
      />
    </div>
  );
}

function SingleSelectInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: LearnerQuestion;
  value: number | null;
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {question.type === "image_select" && question.mediaUrl && (
        <QuestionMedia mediaUrl={question.mediaUrl} />
      )}
      {question.type === "scenario_select" && (
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Read the scenario, then choose the best answer.
        </p>
      )}
      <div className="grid gap-2">
        {question.answerOptions.map((opt, oi) => {
          const selected = value === oi;
          return (
            <button
              key={oi}
              type="button"
              disabled={disabled}
              onClick={() => onChange(oi)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                disabled ? "cursor-default opacity-80" : "cursor-pointer",
                selected
                  ? "border-info bg-info/5 ring-1 ring-info"
                  : !disabled && "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  selected
                    ? "border-info bg-info text-info-foreground"
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
    </div>
  );
}

function MultiSelectInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: LearnerQuestion;
  value: number[];
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Select all that apply.</p>
      <div className="grid gap-2">
        {question.answerOptions.map((opt, oi) => {
          const selected = value.includes(oi);
          return (
            <button
              key={oi}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = selected
                  ? value.filter((v) => v !== oi)
                  : [...value, oi].sort((a, b) => a - b);
                onChange(next);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                disabled ? "cursor-default opacity-80" : "cursor-pointer",
                selected
                  ? "border-info bg-info/5 ring-1 ring-info"
                  : !disabled && "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border text-xs",
                  selected
                    ? "border-info bg-info text-info-foreground"
                    : "text-muted-foreground"
                )}
              >
                {selected ? "✓" : ""}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderingInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: LearnerQuestion;
  value: number[] | null;
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
}) {
  const initialOrder = React.useMemo(
    () =>
      shuffleWithSeed(
        question.answerOptions.map((_, index) => index),
        question.id
      ),
    [question.answerOptions, question.id]
  );

  const [order, setOrder] = React.useState<number[]>(value ?? initialOrder);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (value) {
      setOrder(value);
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      onChange(initialOrder);
    }
  }, [value, initialOrder, onChange]);

  function updateOrder(next: number[]) {
    setOrder(next);
    onChange(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    updateOrder(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Put the steps in the correct order.
      </p>
      <div className="space-y-2">
        {order.map((originalIndex, position) => (
          <div
            key={originalIndex}
            className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
          >
            <span className="w-6 text-sm font-medium text-muted-foreground">
              {position + 1}.
            </span>
            <span className="flex-1 text-sm">
              {question.answerOptions[originalIndex]}
            </span>
            {!disabled && (
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={position === 0}
                  onClick={() => move(position, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={position === order.length - 1}
                  onClick={() => move(position, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchingInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: LearnerQuestion;
  value: number[] | null;
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
}) {
  const leftItems = question.leftItems ?? [];
  const displayOptions = React.useMemo(
    () => buildMatchingDisplayOptions(question.answerOptions, question.id),
    [question.answerOptions, question.id]
  );

  const [matches, setMatches] = React.useState<number[]>(
    value ?? leftItems.map(() => -1)
  );

  function setMatch(leftIndex: number, originalRightIndex: number) {
    const next = [...matches];
    next[leftIndex] = originalRightIndex;
    setMatches(next);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Match each item on the left to the correct option on the right.
      </p>
      <div className="space-y-3">
        {leftItems.map((left, leftIndex) => (
          <div
            key={leftIndex}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr] sm:items-center"
          >
            <p className="text-sm font-medium">{left}</p>
            <select
              disabled={disabled}
              value={matches[leftIndex] ?? -1}
              onChange={(e) => setMatch(leftIndex, Number(e.target.value))}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value={-1} disabled>
                Select a match
              </option>
              {displayOptions.map((option) => (
                <option key={option.originalIndex} value={option.originalIndex}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function FillBlankInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: LearnerQuestion;
  value: string;
  onChange: (value: QuestionAnswerState) => void;
  disabled?: boolean;
}) {
  const parts = question.prompt.split(/(___+|____+)/);

  return (
    <div className="space-y-3">
      <div className="text-sm leading-relaxed">
        {parts.map((part, index) =>
          /___+|____+/.test(part) ? (
            <Input
              key={index}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              className="mx-1 inline-block h-9 w-40 align-middle"
              placeholder="Your answer"
              aria-label="Fill in the blank"
            />
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </div>
    </div>
  );
}

export function isAnswerComplete(
  question: LearnerQuestion,
  value: QuestionAnswerState
): boolean {
  if (value == null) return false;
  if (isSingleSelectFamily(question.type)) {
    return typeof value === "number";
  }
  if (question.type === "multi_select") {
    return Array.isArray(value) && value.length > 0;
  }
  if (question.type === "ordering") {
    return (
      Array.isArray(value) &&
      value.length === question.answerOptions.length
    );
  }
  if (question.type === "matching") {
    return (
      Array.isArray(value) &&
      value.length === (question.leftItems?.length ?? 0) &&
      value.every((v) => v >= 0)
    );
  }
  if (question.type === "fill_blank") {
    return typeof value === "string" && value.trim().length > 0;
  }
  return false;
}
