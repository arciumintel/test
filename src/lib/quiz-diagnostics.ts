import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import {
  gradeQuestion,
  isSingleSelectFamily,
  normalizeFillBlankAnswer,
  QUESTION_TYPE_LABELS,
  type QuizSubmissionAnswer,
} from "@/lib/question-types";
import { summarizeWithinTwoAttempts } from "@/lib/quiz-diagnostics-shared";
import type {
  AttemptsBeforePassBucket,
  QuizEngagementSummary,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics-shared";

export type {
  AttemptsBeforePassBucket,
  QuizEngagementSummary,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics-shared";
export {
  formatQuizDuration,
  summarizeWithinTwoAttempts,
} from "@/lib/quiz-diagnostics-shared";

function parseAttemptAnswer(
  raw: unknown,
  questionIndex: number,
  answers: unknown
): QuizSubmissionAnswer | null {
  if (!Array.isArray(answers) || answers.length <= questionIndex) return null;
  const value = answers[questionIndex];
  if (
    typeof value === "number" ||
    typeof value === "string" ||
    Array.isArray(value)
  ) {
    return value as QuizSubmissionAnswer;
  }
  return null;
}

function buildOptionDistribution(
  answerOptions: string[],
  counts: number[],
  answered: number
) {
  return answerOptions.map((label, oi) => ({
    label,
    count: counts[oi] ?? 0,
    percent: answered > 0 ? Math.round(((counts[oi] ?? 0) / answered) * 100) : 0,
  }));
}

export async function getQuizEngagementSummary(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<QuizEngagementSummary> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    select: { id: true },
  });
  if (!quiz) {
    return {
      averageDurationSeconds: null,
      withinTwoAttemptPassRate: null,
      withinTwoAttemptCount: 0,
      learnersAttempted: 0,
    };
  }

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { durationInSeconds: true },
  });

  const durations = attempts
    .map((attempt) => attempt.durationInSeconds)
    .filter((value): value is number => value != null && value > 0);
  const averageDurationSeconds =
    durations.length > 0
      ? Math.round(
          durations.reduce((sum, value) => sum + value, 0) / durations.length
        )
      : null;

  const attemptsBeforePass = await getAttemptsBeforePass(courseId, range);
  const withinTwo = summarizeWithinTwoAttempts(attemptsBeforePass);

  return {
    averageDurationSeconds,
    ...withinTwo,
  };
}

export async function getQuizDiagnostics(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<QuizQuestionDiagnostic[]> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!quiz || quiz.questions.length === 0) return [];

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { answers: true },
  });

  if (attempts.length === 0) return [];

  return quiz.questions.map((q, qi) => {
    let answered = 0;
    let misses = 0;

    if (isSingleSelectFamily(q.type) || q.type === "multi_select") {
      const optionCounts = q.answerOptions.map(() => 0);

      for (const attempt of attempts) {
        const selected = parseAttemptAnswer(attempt.answers, qi, attempt.answers);
        if (selected == null) continue;

        if (q.type === "multi_select" && Array.isArray(selected)) {
          answered += 1;
          const graded = gradeQuestion(q, selected);
          if (!graded.correct) misses += 1;
          for (const index of selected.filter((v) => typeof v === "number")) {
            if (index >= 0 && index < optionCounts.length) {
              optionCounts[index] += 1;
            }
          }
          continue;
        }

        if (typeof selected === "number") {
          answered += 1;
          const graded = gradeQuestion(q, selected);
          if (!graded.correct) misses += 1;
          if (selected >= 0 && selected < optionCounts.length) {
            optionCounts[selected] += 1;
          }
        }
      }

      return {
        questionId: q.id,
        order: q.order,
        prompt: q.prompt,
        type: q.type,
        typeLabel: QUESTION_TYPE_LABELS[q.type],
        attemptCount: answered,
        missRate: answered > 0 ? Math.round((misses / answered) * 100) : 0,
        optionDistribution: buildOptionDistribution(
          q.answerOptions,
          optionCounts,
          answered
        ),
      };
    }

    if (q.type === "ordering") {
      const positionCorrect = q.answerOptions.map(() => 0);

      for (const attempt of attempts) {
        const selected = parseAttemptAnswer(attempt.answers, qi, attempt.answers);
        if (!Array.isArray(selected)) continue;
        answered += 1;
        const graded = gradeQuestion(q, selected);
        if (!graded.correct) misses += 1;
        selected.forEach((originalIndex, position) => {
          if (q.correctOrder[position] === originalIndex) {
            positionCorrect[position] += 1;
          }
        });
      }

      return {
        questionId: q.id,
        order: q.order,
        prompt: q.prompt,
        type: q.type,
        typeLabel: QUESTION_TYPE_LABELS[q.type],
        attemptCount: answered,
        missRate: answered > 0 ? Math.round((misses / answered) * 100) : 0,
        positionAccuracy: q.answerOptions.map((label, position) => ({
          label: `Position ${position + 1}: ${label}`,
          correctPercent:
            answered > 0
              ? Math.round((positionCorrect[position] / answered) * 100)
              : 0,
        })),
      };
    }

    if (q.type === "matching") {
      const pairStats = q.leftItems.map((left) => ({
        left,
        misses: 0,
        attempts: 0,
      }));

      for (const attempt of attempts) {
        const selected = parseAttemptAnswer(attempt.answers, qi, attempt.answers);
        if (!Array.isArray(selected)) continue;
        answered += 1;
        const graded = gradeQuestion(q, selected);
        if (!graded.correct) misses += 1;
        selected.forEach((chosen, leftIndex) => {
          if (!pairStats[leftIndex]) return;
          pairStats[leftIndex].attempts += 1;
          if (chosen !== q.correctMatches[leftIndex]) {
            pairStats[leftIndex].misses += 1;
          }
        });
      }

      return {
        questionId: q.id,
        order: q.order,
        prompt: q.prompt,
        type: q.type,
        typeLabel: QUESTION_TYPE_LABELS[q.type],
        attemptCount: answered,
        missRate: answered > 0 ? Math.round((misses / answered) * 100) : 0,
        pairMissRates: pairStats.map((pair) => ({
          left: pair.left,
          missRate:
            pair.attempts > 0
              ? Math.round((pair.misses / pair.attempts) * 100)
              : 0,
          attemptCount: pair.attempts,
        })),
      };
    }

    const wrongAnswerCounts = new Map<string, number>();

    for (const attempt of attempts) {
      const selected = parseAttemptAnswer(attempt.answers, qi, attempt.answers);
      if (typeof selected !== "string" || !selected.trim()) continue;
      answered += 1;
      const graded = gradeQuestion(q, selected);
      if (!graded.correct) {
        misses += 1;
        const key = normalizeFillBlankAnswer(selected);
        wrongAnswerCounts.set(key, (wrongAnswerCounts.get(key) ?? 0) + 1);
      }
    }

    const commonWrongAnswers = [...wrongAnswerCounts.entries()]
      .map(([answer, count]) => ({
        answer,
        count,
        percent: answered > 0 ? Math.round((count / answered) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      questionId: q.id,
      order: q.order,
      prompt: q.prompt,
      type: q.type,
      typeLabel: QUESTION_TYPE_LABELS[q.type],
      attemptCount: answered,
      missRate: answered > 0 ? Math.round((misses / answered) * 100) : 0,
      commonWrongAnswers,
    };
  });
}

export async function getAttemptsBeforePass(
  courseId: string,
  range?: AnalyticsDateRange
): Promise<AttemptsBeforePassBucket[]> {
  const quiz = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
    select: { id: true },
  });
  if (!quiz) return [];

  const submittedAt = range?.from
    ? { gte: range.from, lte: range.to }
    : undefined;
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
      ...(submittedAt ? { submittedAt } : {}),
    },
    select: { userId: true, passed: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
  });

  const byUser = new Map<string, boolean[]>();
  for (const a of attempts) {
    const list = byUser.get(a.userId) ?? [];
    list.push(a.passed);
    byUser.set(a.userId, list);
  }

  let pass1 = 0;
  let pass2 = 0;
  let pass3plus = 0;
  let neverPassed = 0;

  for (const tries of byUser.values()) {
    const firstPass = tries.findIndex((p) => p);
    if (firstPass === -1) {
      neverPassed += 1;
    } else if (firstPass === 0) {
      pass1 += 1;
    } else if (firstPass === 1) {
      pass2 += 1;
    } else {
      pass3plus += 1;
    }
  }

  return [
    { label: "Passed on attempt 1", count: pass1 },
    { label: "Passed on attempt 2", count: pass2 },
    { label: "Passed on attempt 3+", count: pass3plus },
    { label: "Never passed", count: neverPassed },
  ];
}
