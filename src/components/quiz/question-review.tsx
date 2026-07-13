"use client";

import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestionResult } from "@/app/actions/learn";
import {
  isSingleSelectFamily,
  normalizeFillBlankAnswer,
  QUESTION_TYPE_LABELS,
  type LearnerQuestion,
  type QuizSubmissionAnswer,
} from "@/lib/question-types";

type QuestionReviewProps = {
  question: LearnerQuestion;
  answer: QuizSubmissionAnswer | null;
  result: QuizQuestionResult;
  showPrompt?: boolean;
};

export function QuestionReview({
  question,
  answer,
  result,
  showPrompt = true,
}: QuestionReviewProps) {
  return (
    <div className="space-y-3">
      {showPrompt && (
        <div className="flex items-start gap-2">
          {result.correct ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          )}
          <div className="space-y-1">
            <p className="font-medium">{question.prompt}</p>
            <p className="text-xs text-muted-foreground">
              {QUESTION_TYPE_LABELS[question.type]}
            </p>
          </div>
        </div>
      )}

      {question.type === "image_select" && question.mediaUrl && (
        <div className="relative ml-7 aspect-video overflow-hidden rounded-lg border bg-muted/30">
          <Image
            src={question.mediaUrl}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        </div>
      )}

      <div className="pl-7">
        {isSingleSelectFamily(question.type) && (
          <SingleSelectReview
            question={question}
            answer={typeof answer === "number" ? answer : null}
            result={result}
          />
        )}
        {question.type === "multi_select" && (
          <MultiSelectReview
            question={question}
            answer={Array.isArray(answer) ? answer.filter((v) => typeof v === "number") : []}
            result={result}
          />
        )}
        {question.type === "ordering" && (
          <OrderingReview
            question={question}
            answer={Array.isArray(answer) ? answer.filter((v) => typeof v === "number") : []}
            result={result}
          />
        )}
        {question.type === "matching" && (
          <MatchingReview
            question={question}
            answer={Array.isArray(answer) ? answer.filter((v) => typeof v === "number") : []}
            result={result}
          />
        )}
        {question.type === "fill_blank" && (
          <FillBlankReview
            answer={typeof answer === "string" ? answer : ""}
            result={result}
          />
        )}
      </div>

      {result.explanation && (
        <p className="pl-7 text-sm text-muted-foreground">{result.explanation}</p>
      )}
    </div>
  );
}

function SingleSelectReview({
  question,
  answer,
  result,
}: {
  question: LearnerQuestion;
  answer: number | null;
  result: QuizQuestionResult;
}) {
  return (
    <ul className="space-y-1.5">
      {question.answerOptions.map((opt, oi) => {
        const isCorrect = result.correctAnswer === oi;
        const isChosen = answer === oi;
        return (
          <li
            key={oi}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              isCorrect && "bg-success/10 font-medium text-success",
              isChosen && !isCorrect && "bg-destructive/10 text-destructive"
            )}
          >
            {opt}
            {isCorrect && " ✓"}
            {isChosen && !isCorrect && " (your answer)"}
          </li>
        );
      })}
    </ul>
  );
}

function MultiSelectReview({
  question,
  answer,
  result,
}: {
  question: LearnerQuestion;
  answer: number[];
  result: QuizQuestionResult;
}) {
  const correctSet = new Set(result.correctAnswers ?? []);
  return (
    <ul className="space-y-1.5">
      {question.answerOptions.map((opt, oi) => {
        const shouldSelect = correctSet.has(oi);
        const didSelect = answer.includes(oi);
        const wrongChoice = didSelect && !shouldSelect;
        const missed = !didSelect && shouldSelect;
        return (
          <li
            key={oi}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              shouldSelect && "bg-success/10 font-medium text-success",
              wrongChoice && "bg-destructive/10 text-destructive",
              missed && "ring-1 ring-success/30"
            )}
          >
            {opt}
            {shouldSelect && " ✓"}
            {wrongChoice && " (your answer)"}
            {missed && " (missed)"}
          </li>
        );
      })}
    </ul>
  );
}

function OrderingReview({
  question,
  answer,
  result,
}: {
  question: LearnerQuestion;
  answer: number[];
  result: QuizQuestionResult;
}) {
  const correctOrder = result.correctOrder ?? [];
  return (
    <ol className="space-y-1.5">
      {answer.map((originalIndex, position) => {
        const correctHere = correctOrder[position] === originalIndex;
        return (
          <li
            key={`${position}-${originalIndex}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              correctHere
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {position + 1}. {question.answerOptions[originalIndex]}
          </li>
        );
      })}
    </ol>
  );
}

function MatchingReview({
  question,
  answer,
  result,
}: {
  question: LearnerQuestion;
  answer: number[];
  result: QuizQuestionResult;
}) {
  const leftItems = question.leftItems ?? [];
  const correctMatches = result.correctMatches ?? [];
  return (
    <ul className="space-y-2">
      {leftItems.map((left, index) => {
        const chosen = answer[index];
        const correct = correctMatches[index];
        const isCorrect = chosen === correct;
        return (
          <li
            key={index}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            <span className="font-medium">{left}</span>
            <span className="mx-2 text-muted-foreground">→</span>
            {chosen >= 0
              ? question.answerOptions[chosen]
              : "No answer"}
            {!isCorrect && correct >= 0 && (
              <span className="mt-1 block text-xs">
                Correct: {question.answerOptions[correct]}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FillBlankReview({
  answer,
  result,
}: {
  answer: string;
  result: QuizQuestionResult;
}) {
  const normalized = normalizeFillBlankAnswer(answer);
  const acceptable = (result.acceptableAnswers ?? []).map(normalizeFillBlankAnswer);
  const isCorrect = acceptable.includes(normalized);
  return (
    <p
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      )}
    >
      Your answer: {answer || "—"}
      {!isCorrect && result.acceptableAnswers && result.acceptableAnswers.length > 0 && (
        <span className="mt-1 block text-xs">
          Accepted: {result.acceptableAnswers.join(", ")}
        </span>
      )}
    </p>
  );
}
