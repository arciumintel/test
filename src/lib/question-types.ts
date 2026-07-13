import type { QuestionType } from "@prisma/client";

export type { QuestionType };

export type QuizSubmissionAnswer = number | number[] | string;

export type LearnerQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  mediaUrl?: string | null;
  answerOptions: string[];
  leftItems?: string[];
};

export type QuestionGradingResult = {
  correct: boolean;
  explanation: string | null;
  correctAnswer?: number;
  correctAnswers?: number[];
  correctOrder?: number[];
  correctMatches?: number[];
  acceptableAnswers?: string[];
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_select: "Multiple choice",
  true_false: "True / False",
  image_select: "Image + multiple choice",
  scenario_select: "Scenario multiple choice",
  multi_select: "Select all that apply",
  ordering: "Put in order",
  matching: "Match pairs",
  fill_blank: "Fill in the blank",
};

export const QUESTION_TYPE_GROUPS = {
  tier1: [
    "single_select",
    "true_false",
    "image_select",
    "scenario_select",
  ] as const satisfies readonly QuestionType[],
  tier2: [
    "multi_select",
    "ordering",
    "matching",
    "fill_blank",
  ] as const satisfies readonly QuestionType[],
};

export const TRUE_FALSE_OPTIONS = ["True", "False"] as const;

export function isSingleSelectFamily(type: QuestionType): boolean {
  return (
    type === "single_select" ||
    type === "true_false" ||
    type === "image_select" ||
    type === "scenario_select"
  );
}

export function normalizeFillBlankAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function sameNumberSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function sameNumberArray(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export type QuestionForGrading = {
  id: string;
  type: QuestionType;
  answerOptions: string[];
  leftItems: string[];
  correctAnswer: number;
  correctAnswers: number[];
  correctOrder: number[];
  correctMatches: number[];
  acceptableAnswers: string[];
  explanation: string | null;
};

export function toLearnerQuestion(question: {
  id: string;
  type: QuestionType;
  prompt: string;
  mediaUrl: string | null;
  answerOptions: string[];
  leftItems: string[];
}): LearnerQuestion {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    mediaUrl: question.mediaUrl,
    answerOptions: question.answerOptions,
    leftItems: question.leftItems,
  };
}

export function toAdminQuestion(question: {
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
}) {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    mediaUrl: question.mediaUrl,
    answerOptions: question.answerOptions,
    leftItems: question.leftItems,
    correctAnswer: question.correctAnswer,
    correctAnswers: question.correctAnswers,
    correctOrder: question.correctOrder,
    correctMatches: question.correctMatches,
    acceptableAnswers: question.acceptableAnswers,
    explanation: question.explanation,
  };
}

export function gradeQuestion(
  question: QuestionForGrading,
  rawAnswer: unknown
): QuestionGradingResult {
  const base = { explanation: question.explanation };

  if (isSingleSelectFamily(question.type)) {
    const answer = typeof rawAnswer === "number" ? rawAnswer : null;
    const valid =
      answer != null &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < question.answerOptions.length;
    return {
      ...base,
      correct: valid && answer === question.correctAnswer,
      correctAnswer: question.correctAnswer,
    };
  }

  if (question.type === "multi_select") {
    const answer = Array.isArray(rawAnswer)
      ? rawAnswer.filter((v): v is number => Number.isInteger(v))
      : [];
    const valid =
      answer.length > 0 &&
      answer.every((v) => v >= 0 && v < question.answerOptions.length);
    return {
      ...base,
      correct:
        valid && sameNumberSet(answer, question.correctAnswers),
      correctAnswers: question.correctAnswers,
    };
  }

  if (question.type === "ordering") {
    const answer = Array.isArray(rawAnswer)
      ? rawAnswer.filter((v): v is number => Number.isInteger(v))
      : [];
    const valid =
      answer.length === question.answerOptions.length &&
      answer.every((v) => v >= 0 && v < question.answerOptions.length) &&
      new Set(answer).size === answer.length;
    return {
      ...base,
      correct: valid && sameNumberArray(answer, question.correctOrder),
      correctOrder: question.correctOrder,
    };
  }

  if (question.type === "matching") {
    const answer = Array.isArray(rawAnswer)
      ? rawAnswer.filter((v): v is number => Number.isInteger(v))
      : [];
    const valid =
      answer.length === question.leftItems.length &&
      answer.every((v) => v >= 0 && v < question.answerOptions.length);
    return {
      ...base,
      correct: valid && sameNumberArray(answer, question.correctMatches),
      correctMatches: question.correctMatches,
    };
  }

  if (question.type === "fill_blank") {
    const answer =
      typeof rawAnswer === "string" ? normalizeFillBlankAnswer(rawAnswer) : "";
    const acceptable = question.acceptableAnswers.map(normalizeFillBlankAnswer);
    return {
      ...base,
      correct: answer.length > 0 && acceptable.includes(answer),
      acceptableAnswers: question.acceptableAnswers,
    };
  }

  return { ...base, correct: false };
}

export function isQuestionAnswered(
  type: QuestionType,
  optionCount: number,
  leftItemCount: number,
  rawAnswer: unknown
): boolean {
  if (isSingleSelectFamily(type)) {
    return (
      typeof rawAnswer === "number" &&
      Number.isInteger(rawAnswer) &&
      rawAnswer >= 0 &&
      rawAnswer < optionCount
    );
  }

  if (type === "multi_select") {
    return (
      Array.isArray(rawAnswer) &&
      rawAnswer.some(
        (v) =>
          Number.isInteger(v) && typeof v === "number" && v >= 0 && v < optionCount
      )
    );
  }

  if (type === "ordering") {
    return (
      Array.isArray(rawAnswer) &&
      rawAnswer.length === optionCount &&
      rawAnswer.every(
        (v) =>
          Number.isInteger(v) && typeof v === "number" && v >= 0 && v < optionCount
      ) &&
      new Set(rawAnswer).size === optionCount
    );
  }

  if (type === "matching") {
    return (
      Array.isArray(rawAnswer) &&
      rawAnswer.length === leftItemCount &&
      rawAnswer.every(
        (v) =>
          Number.isInteger(v) && typeof v === "number" && v >= 0 && v < optionCount
      )
    );
  }

  if (type === "fill_blank") {
    return typeof rawAnswer === "string" && rawAnswer.trim().length > 0;
  }

  return false;
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type MatchingDisplayOption = {
  label: string;
  originalIndex: number;
};

export function buildMatchingDisplayOptions(
  answerOptions: string[],
  questionId: string
): MatchingDisplayOption[] {
  const indexed = answerOptions.map((label, originalIndex) => ({
    label,
    originalIndex,
  }));
  return shuffleWithSeed(indexed, questionId);
}

export function defaultCorrectOrder(optionCount: number): number[] {
  return Array.from({ length: optionCount }, (_, i) => i);
}

export function questionTypeBadgeClass(type: QuestionType): string {
  return QUESTION_TYPE_GROUPS.tier2.includes(
    type as (typeof QUESTION_TYPE_GROUPS.tier2)[number]
  )
    ? "bg-info/10 text-info"
    : "bg-muted text-muted-foreground";
}
