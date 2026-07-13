import { z } from "zod";
import type { QuestionType } from "@prisma/client";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import {
  TRUE_FALSE_OPTIONS,
  defaultCorrectOrder,
  isSingleSelectFamily,
} from "@/lib/question-types";

const questionTypeSchema = z.enum([
  "single_select",
  "true_false",
  "image_select",
  "scenario_select",
  "multi_select",
  "ordering",
  "matching",
  "fill_blank",
]);

const baseQuestionFields = {
  prompt: z.string().min(2, "Prompt is required").max(L.questionPrompt),
  explanation: z.string().max(L.questionExplanation).optional().nullable(),
};

const optionListSchema = z
  .array(z.string().min(1).max(L.questionOption))
  .max(8)
  .default([]);

/** Shared bag fields — type-specific mins live in superRefine so unused [] payloads pass. */
const looseStringListSchema = z
  .array(z.string().min(1).max(L.questionOption))
  .max(8)
  .optional();

export const questionSchema = z
  .object({
    type: questionTypeSchema.default("single_select"),
    ...baseQuestionFields,
    mediaUrl: z.string().optional().nullable(),
    answerOptions: optionListSchema,
    leftItems: looseStringListSchema,
    correctAnswer: z.coerce.number().int().min(0).optional(),
    correctAnswers: z.array(z.coerce.number().int().min(0)).optional(),
    correctOrder: z.array(z.coerce.number().int().min(0)).optional(),
    correctMatches: z.array(z.coerce.number().int().min(0)).optional(),
    acceptableAnswers: looseStringListSchema,
  })
  .superRefine((data, ctx) => {
    const type = data.type as QuestionType;

    if (type === "true_false") {
      if ((data.correctAnswer ?? 0) > 1) {
        ctx.addIssue({
          code: "custom",
          message: "Correct answer must be True or False.",
          path: ["correctAnswer"],
        });
      }
      return;
    }

    if (isSingleSelectFamily(type)) {
      if (data.answerOptions.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least two options.",
          path: ["answerOptions"],
        });
      }
      const correct = data.correctAnswer ?? 0;
      if (
        data.answerOptions.length > 0 &&
        correct >= data.answerOptions.length
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Correct answer must be one of the options.",
          path: ["correctAnswer"],
        });
      }
      if (type === "image_select" && !data.mediaUrl?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Image questions require an image.",
          path: ["mediaUrl"],
        });
      }
      return;
    }

    if (type === "multi_select") {
      if (data.answerOptions.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least two options.",
          path: ["answerOptions"],
        });
      }
      const answers = data.correctAnswers ?? [];
      if (answers.length < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Select at least one correct answer.",
          path: ["correctAnswers"],
        });
      }
      if (
        answers.some((index) => index < 0 || index >= data.answerOptions.length)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Correct answers must reference valid options.",
          path: ["correctAnswers"],
        });
      }
      return;
    }

    if (type === "ordering") {
      if (data.answerOptions.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least two steps to order.",
          path: ["answerOptions"],
        });
      }
      const order =
        data.correctOrder && data.correctOrder.length > 0
          ? data.correctOrder
          : defaultCorrectOrder(data.answerOptions.length);
      if (order.length !== data.answerOptions.length) {
        ctx.addIssue({
          code: "custom",
          message: "Ordering must include every item.",
          path: ["correctOrder"],
        });
      }
      return;
    }

    if (type === "matching") {
      if (data.answerOptions.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least two right-side options.",
          path: ["answerOptions"],
        });
      }
      const leftItems = data.leftItems ?? [];
      if (leftItems.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least two items to match.",
          path: ["leftItems"],
        });
      }
      const matches = data.correctMatches ?? [];
      if (matches.length !== leftItems.length) {
        ctx.addIssue({
          code: "custom",
          message: "Assign a correct match for every left item.",
          path: ["correctMatches"],
        });
      }
      if (
        matches.some((index) => index < 0 || index >= data.answerOptions.length)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Matches must reference valid right-side options.",
          path: ["correctMatches"],
        });
      }
      return;
    }

    if (type === "fill_blank") {
      const acceptable = data.acceptableAnswers ?? [];
      if (acceptable.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one acceptable answer.",
          path: ["acceptableAnswers"],
        });
      }
      if (!data.prompt.includes("___") && !data.prompt.includes("____")) {
        ctx.addIssue({
          code: "custom",
          message: 'Use "___" in the prompt to mark the blank.',
          path: ["prompt"],
        });
      }
    }
  });

export type QuestionFormInput = z.input<typeof questionSchema>;

export function normalizeQuestionInput(
  input: z.infer<typeof questionSchema>
): {
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
} {
  const type = input.type as QuestionType;

  if (type === "true_false") {
    return {
      type,
      prompt: input.prompt,
      mediaUrl: null,
      answerOptions: [...TRUE_FALSE_OPTIONS],
      leftItems: [],
      correctAnswer: input.correctAnswer ?? 0,
      correctAnswers: [],
      correctOrder: [],
      correctMatches: [],
      acceptableAnswers: [],
      explanation: input.explanation || null,
    };
  }

  if (isSingleSelectFamily(type)) {
    return {
      type,
      prompt: input.prompt,
      mediaUrl: type === "image_select" ? input.mediaUrl?.trim() || null : null,
      answerOptions: input.answerOptions,
      leftItems: [],
      correctAnswer: input.correctAnswer ?? 0,
      correctAnswers: [],
      correctOrder: [],
      correctMatches: [],
      acceptableAnswers: [],
      explanation: input.explanation || null,
    };
  }

  if (type === "multi_select") {
    return {
      type,
      prompt: input.prompt,
      mediaUrl: null,
      answerOptions: input.answerOptions,
      leftItems: [],
      correctAnswer: 0,
      correctAnswers: [...new Set(input.correctAnswers ?? [])].sort(
        (a, b) => a - b
      ),
      correctOrder: [],
      correctMatches: [],
      acceptableAnswers: [],
      explanation: input.explanation || null,
    };
  }

  if (type === "ordering") {
    return {
      type,
      prompt: input.prompt,
      mediaUrl: null,
      answerOptions: input.answerOptions,
      leftItems: [],
      correctAnswer: 0,
      correctAnswers: [],
      correctOrder:
        input.correctOrder && input.correctOrder.length > 0
          ? input.correctOrder
          : defaultCorrectOrder(input.answerOptions.length),
      correctMatches: [],
      acceptableAnswers: [],
      explanation: input.explanation || null,
    };
  }

  if (type === "matching") {
    const leftItems = input.leftItems ?? [];
    return {
      type,
      prompt: input.prompt,
      mediaUrl: null,
      answerOptions: input.answerOptions,
      leftItems,
      correctAnswer: 0,
      correctAnswers: [],
      correctOrder: [],
      correctMatches: input.correctMatches ?? [],
      acceptableAnswers: [],
      explanation: input.explanation || null,
    };
  }

  return {
    type: "fill_blank",
    prompt: input.prompt,
    mediaUrl: null,
    answerOptions: [],
    leftItems: [],
    correctAnswer: 0,
    correctAnswers: [],
    correctOrder: [],
    correctMatches: [],
    acceptableAnswers: (input.acceptableAnswers ?? []).map((a) => a.trim()),
    explanation: input.explanation || null,
  };
}
