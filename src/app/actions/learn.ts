"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { evaluateCourseCompletion } from "@/lib/completion";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { coursePath } from "@/lib/paths";

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

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!course) return { error: "Course not found." };

  const lessons = await prisma.lesson.findMany({
    where: { courseId, status: "published" },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (lessons.length === 0) return { error: "This course has no lessons yet." };

  const alreadyStarted = await prisma.progress.findFirst({
    where: { userId: user.id, courseId },
    select: { id: true },
  });

  await prisma.$transaction(
    lessons.map((lesson) =>
      prisma.progress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: {},
        create: { userId: user.id, courseId, lessonId: lesson.id },
      })
    )
  );

  trackEventFireAndForget({
    eventName: "course_started",
    source: "server_action",
    path: coursePath(course.product.slug, course.slug),
    userId: user.id,
    courseId,
    courseSlug: course.slug,
    ecosystemProjectId: course.product.id,
    ecosystemProjectSlug: course.product.slug,
    metadata: {
      alreadyStarted: Boolean(alreadyStarted),
      createdProgressRowCount: lessons.length,
      firstLessonId: lessons[0].id,
    },
  });

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
    select: {
      id: true,
      courseId: true,
      order: true,
      course: {
        select: {
          slug: true,
          product: { select: { id: true, slug: true } },
          lessons: {
            where: { status: "published", required: true },
            select: { id: true },
          },
        },
      },
    },
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

  const completedLessonCount = await prisma.progress.count({
    where: {
      userId: user.id,
      courseId: lesson.courseId,
      lessonId: { in: lesson.course.lessons.map((l) => l.id) },
      completed: true,
    },
  });

  const result = await evaluateCourseCompletion(user.id, lesson.courseId);

  trackEventFireAndForget({
    eventName: "lesson_completed",
    source: "server_action",
    path: coursePath(lesson.course.product.slug, lesson.course.slug),
    userId: user.id,
    courseId: lesson.courseId,
    courseSlug: lesson.course.slug,
    lessonId: lesson.id,
    ecosystemProjectId: lesson.course.product.id,
    ecosystemProjectSlug: lesson.course.product.slug,
    metadata: {
      lessonOrder: lesson.order,
      completedLessonCount,
      totalRequiredLessonCount: lesson.course.lessons.length,
      courseCompleted: result.completed,
      badgeAwarded: result.newlyAwarded,
    },
  });

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
    include: {
      questions: { orderBy: { order: "asc" } },
      course: { include: { product: { select: { id: true, slug: true } } } },
    },
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

  const attemptNumber =
    (await prisma.quizAttempt.count({
      where: { userId: user.id, quizId },
    })) + 1;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId,
      score,
      passed,
      answers: answers,
    },
  });

  const isLessonCheck = Boolean(quiz.lessonId);
  const lessonPagePath =
    quiz.lessonId != null
      ? `${coursePath(quiz.course.product.slug, quiz.course.slug)}/lessons/${quiz.lessonId}`
      : coursePath(quiz.course.product.slug, quiz.course.slug) + "/quiz";

  let completed = false;
  let newBadge = false;
  let verificationSlug: string | undefined;
  if (passed && !isLessonCheck) {
    const result = await evaluateCourseCompletion(user.id, quiz.courseId);
    completed = result.completed;
    newBadge = result.newlyAwarded;
    verificationSlug = result.verificationSlug;
  }

  const baseEvent = {
    source: "server_action" as const,
    path: lessonPagePath,
    userId: user.id,
    courseId: quiz.courseId,
    courseSlug: quiz.course.slug,
    ecosystemProjectId: quiz.course.product.id,
    ecosystemProjectSlug: quiz.course.product.slug,
    quizId,
    lessonId: quiz.lessonId,
  };

  const submittedEventName = isLessonCheck
    ? "lesson_knowledge_check_submitted"
    : "quiz_submitted";
  const passedEventName = isLessonCheck
    ? "lesson_knowledge_check_passed"
    : "quiz_passed";
  const failedEventName = isLessonCheck
    ? "lesson_knowledge_check_submitted"
    : "quiz_failed";

  trackEventFireAndForget({
    eventName: submittedEventName,
    ...baseEvent,
    metadata: {
      quizAttemptId: attempt.id,
      score,
      passed,
      questionCount: quiz.questions.length,
      passThreshold: quiz.passThreshold,
      attemptNumber,
      correctCount,
      incorrectCount: quiz.questions.length - correctCount,
      courseCompleted: completed,
      badgeAwarded: newBadge,
      isLessonKnowledgeCheck: isLessonCheck,
    },
  });

  if (passed) {
    trackEventFireAndForget({
      eventName: passedEventName,
      ...baseEvent,
      metadata: {
        quizAttemptId: attempt.id,
        score,
        passThreshold: quiz.passThreshold,
        attemptNumber,
        courseCompleted: completed,
        badgeAwarded: newBadge,
        isLessonKnowledgeCheck: isLessonCheck,
      },
    });
  } else if (!isLessonCheck) {
    trackEventFireAndForget({
      eventName: failedEventName,
      ...baseEvent,
      metadata: {
        quizAttemptId: attempt.id,
        score,
        passThreshold: quiz.passThreshold,
        attemptNumber,
        incorrectCount: quiz.questions.length - correctCount,
      },
    });
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
