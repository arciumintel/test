"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { evaluateCourseCompletion } from "@/lib/completion";

type ActionError = { error: string };

/** Enrolls the learner by creating progress rows for every published lesson. */
export async function startCourse(
  courseId: string
): Promise<{ ok: true; firstLessonId: string | null } | ActionError> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Connect your wallet to start this course." };
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId, status: "published" },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (lessons.length === 0) return { error: "This course has no lessons yet." };

  await prisma.$transaction(
    lessons.map((lesson) =>
      prisma.progress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: {},
        create: { userId: user.id, courseId, lessonId: lesson.id },
      })
    )
  );

  revalidatePath("/courses");
  revalidatePath("/products");
  return { ok: true, firstLessonId: lessons[0].id };
}

export async function completeLesson(
  lessonId: string
): Promise<
  | { ok: true; courseCompleted: boolean; newBadge: boolean; verificationSlug?: string }
  | ActionError
> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Connect your wallet to save your progress." };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });
  if (!lesson) return { error: "Lesson not found." };

  await prisma.progress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completed: true, completedAt: new Date() },
    create: {
      userId: user.id,
      courseId: lesson.courseId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
  });

  const result = await evaluateCourseCompletion(user.id, lesson.courseId);

  revalidatePath(`/courses`);
  revalidatePath(`/products`);
  revalidatePath(`/profile`);
  if (result.verificationSlug) {
    revalidatePath(`/badges/${result.verificationSlug}`);
  }
  return {
    ok: true,
    courseCompleted: result.completed,
    newBadge: result.newlyAwarded,
    verificationSlug: result.verificationSlug,
  };
}

export async function submitQuiz(
  quizId: string,
  answers: number[]
): Promise<
  | {
      ok: true;
      score: number;
      passed: boolean;
      results: { questionId: string; correct: boolean; correctAnswer: number; explanation: string | null }[];
      courseCompleted: boolean;
      newBadge: boolean;
      verificationSlug?: string;
    }
  | ActionError
> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Connect your wallet to take this quiz." };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz || quiz.questions.length === 0) {
    return { error: "This quiz has no questions yet." };
  }

  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    return { error: "Please answer every question before submitting." };
  }
  const answersValid = quiz.questions.every((q, i) => {
    const a = answers[i];
    return Number.isInteger(a) && a >= 0 && a < q.answerOptions.length;
  });
  if (!answersValid) {
    return { error: "Please answer every question before submitting." };
  }

  const results = quiz.questions.map((q, i) => ({
    questionId: q.id,
    correct: answers[i] === q.correctAnswer,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passThreshold;

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId,
      score,
      passed,
      answers: answers,
    },
  });

  let completed = false;
  let newBadge = false;
  let verificationSlug: string | undefined;
  if (passed) {
    const result = await evaluateCourseCompletion(user.id, quiz.courseId);
    completed = result.completed;
    newBadge = result.newlyAwarded;
    verificationSlug = result.verificationSlug;
  }

  revalidatePath(`/courses`);
  revalidatePath(`/products`);
  revalidatePath(`/profile`);
  if (verificationSlug) {
    revalidatePath(`/badges/${verificationSlug}`);
  }
  return {
    ok: true,
    score,
    passed,
    results,
    courseCompleted: completed,
    newBadge,
    verificationSlug,
  };
}
