"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CourseStatus } from "@prisma/client";
import {
  badgeSchema,
  courseSchema,
  lessonSchema,
  PARTNER_EDITABLE_STATUSES,
  questionSchema,
} from "@/lib/course-schemas";
import { uniqueCourseSlug } from "@/lib/course-slug";
import { getPartnerSubmitReadiness } from "@/lib/partner-submit-readiness";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin } from "@/lib/project-admin";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function projectCoursesPath(productId: string) {
  return `/project-console/${productId}/courses`;
}

function projectCoursePath(productId: string, courseId: string) {
  return `${projectCoursesPath(productId)}/${courseId}`;
}

async function guardProduct(productId: string) {
  try {
    return await requireProjectAdmin(productId);
  } catch {
    return null;
  }
}

async function getPartnerCourse(courseId: string, productId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, productId },
    include: { product: { select: { slug: true } } },
  });
}

function assertPartnerEditable(status: CourseStatus): string | null {
  if (!PARTNER_EDITABLE_STATUSES.includes(status as (typeof PARTNER_EDITABLE_STATUSES)[number])) {
    return "This course cannot be edited in its current review state.";
  }
  return null;
}

function revalidatePartnerCourse(productId: string, courseId: string) {
  revalidatePath(projectCoursesPath(productId));
  revalidatePath(projectCoursePath(productId, courseId));
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin");
}

export type PartnerCourseListItem = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  updatedAt: Date;
  _count: { lessons: number };
};

export async function listPartnerCourses(
  productId: string
): Promise<Result<{ courses: PartnerCourseListItem[] }>> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const courses = await prisma.course.findMany({
    where: { productId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { lessons: true } },
    },
  });

  return { ok: true, courses };
}

export async function createPartnerCourse(
  productId: string,
  raw: z.input<typeof courseSchema>
): Promise<Result<{ id: string }>> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = courseSchema.safeParse({ ...raw, productId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return { error: "Ecosystem project not found." };

  const course = await prisma.course.create({
    data: {
      productId: product.id,
      title: parsed.data.title,
      slug: await uniqueCourseSlug(parsed.data.title, product.id),
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      level: parsed.data.level,
      courseType: parsed.data.courseType,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
      learningOutcomes: (parsed.data.learningOutcomes ?? []).filter(Boolean),
      prerequisiteCourseIds: (parsed.data.prerequisiteCourseIds ?? []).filter(Boolean),
      status: "partner_draft",
    },
  });

  trackEventFireAndForget({
    eventName: "partner_course_created",
    source: "server_action",
    path: `${projectCoursesPath(productId)}/new`,
    userId: user.id,
    courseId: course.id,
    courseSlug: course.slug,
    ecosystemProjectId: product.id,
    ecosystemProjectSlug: product.slug,
    metadata: { partnerUserId: user.id },
  });

  revalidatePartnerCourse(productId, course.id);
  return { ok: true, id: course.id };
}

export async function updatePartnerCourse(
  productId: string,
  courseId: string,
  raw: z.input<typeof courseSchema>
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = courseSchema.safeParse({ ...raw, productId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const current = await getPartnerCourse(courseId, productId);
  if (!current) return { error: "Course not found." };

  const editErr = assertPartnerEditable(current.status);
  if (editErr) return { error: editErr };

  const nextSlug =
    parsed.data.title === current.title
      ? current.slug
      : await uniqueCourseSlug(parsed.data.title, productId, courseId);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: parsed.data.title,
      slug: nextSlug,
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      level: parsed.data.level,
      courseType: parsed.data.courseType,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
      learningOutcomes: (parsed.data.learningOutcomes ?? []).filter(Boolean),
      prerequisiteCourseIds: (parsed.data.prerequisiteCourseIds ?? []).filter(Boolean),
    },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}

export async function createPartnerLesson(
  productId: string,
  courseId: string,
  raw: Parameters<typeof lessonSchema.safeParse>[0]
): Promise<Result<{ id: string }>> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };
  const editErr = assertPartnerEditable(course.status);
  if (editErr) return { error: editErr };

  const last = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title: parsed.data.title,
      content: parsed.data.content,
      mediaUrl: parsed.data.mediaUrl || null,
      status: parsed.data.status,
      required: parsed.data.required,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true, id: lesson.id };
}

export async function updatePartnerLesson(
  productId: string,
  lessonId: string,
  raw: Parameters<typeof lessonSchema.safeParse>[0]
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, productId: true, status: true } } },
  });
  if (!lesson || lesson.course.productId !== productId) {
    return { error: "Lesson not found." };
  }
  const editErr = assertPartnerEditable(lesson.course.status);
  if (editErr) return { error: editErr };

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      mediaUrl: parsed.data.mediaUrl || null,
      status: parsed.data.status,
      required: parsed.data.required,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
    },
  });

  revalidatePartnerCourse(productId, lesson.course.id);
  return { ok: true };
}

export async function deletePartnerLesson(
  productId: string,
  lessonId: string
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, productId: true, status: true } } },
  });
  if (!lesson || lesson.course.productId !== productId) {
    return { error: "Lesson not found." };
  }
  const editErr = assertPartnerEditable(lesson.course.status);
  if (editErr) return { error: editErr };

  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePartnerCourse(productId, lesson.course.id);
  return { ok: true };
}

export async function reorderPartnerLessons(
  productId: string,
  courseId: string,
  orderedIds: string[]
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };
  const editErr = assertPartnerEditable(course.status);
  if (editErr) return { error: editErr };

  await prisma.$transaction([
    ...orderedIds.map((id, i) =>
      prisma.lesson.updateMany({
        where: { id, courseId },
        data: { order: -(i + 1) },
      })
    ),
    ...orderedIds.map((id, i) =>
      prisma.lesson.updateMany({
        where: { id, courseId },
        data: { order: i },
      })
    ),
  ]);

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}

export async function upsertPartnerFinalQuiz(
  productId: string,
  courseId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<Result<{ id: string }>> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };
  const editErr = assertPartnerEditable(course.status);
  if (editErr) return { error: editErr };

  const threshold = Math.min(100, Math.max(1, Math.round(raw.passThreshold)));
  const title = raw.title?.trim() || "Course Quiz";
  const description = raw.description?.trim() || null;
  const status = raw.status ?? "draft";

  const existing = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
  });

  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: { title, passThreshold: threshold, description, status },
      })
    : await prisma.quiz.create({
        data: { courseId, title, passThreshold: threshold, description, status },
      });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true, id: quiz.id };
}

export async function createPartnerQuestion(
  productId: string,
  quizId: string,
  raw: Parameters<typeof questionSchema.safeParse>[0]
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.correctAnswer >= parsed.data.answerOptions.length) {
    return { error: "Correct answer must be one of the options." };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { course: { select: { id: true, productId: true, status: true } } },
  });
  if (!quiz || quiz.course.productId !== productId) {
    return { error: "Quiz not found." };
  }
  const editErr = assertPartnerEditable(quiz.course.status);
  if (editErr) return { error: editErr };

  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.question.create({
    data: {
      quizId,
      prompt: parsed.data.prompt,
      answerOptions: parsed.data.answerOptions,
      correctAnswer: parsed.data.correctAnswer,
      explanation: parsed.data.explanation || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePartnerCourse(productId, quiz.course.id);
  return { ok: true };
}

export async function updatePartnerQuestion(
  productId: string,
  questionId: string,
  raw: Parameters<typeof questionSchema.safeParse>[0]
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.correctAnswer >= parsed.data.answerOptions.length) {
    return { error: "Correct answer must be one of the options." };
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: { course: { select: { id: true, productId: true, status: true } } },
      },
    },
  });
  if (!question || question.quiz.course.productId !== productId) {
    return { error: "Question not found." };
  }
  const editErr = assertPartnerEditable(question.quiz.course.status);
  if (editErr) return { error: editErr };

  await prisma.question.update({
    where: { id: questionId },
    data: {
      prompt: parsed.data.prompt,
      answerOptions: parsed.data.answerOptions,
      correctAnswer: parsed.data.correctAnswer,
      explanation: parsed.data.explanation || null,
    },
  });

  revalidatePartnerCourse(productId, question.quiz.course.id);
  return { ok: true };
}

export async function deletePartnerQuestion(
  productId: string,
  questionId: string
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: { course: { select: { id: true, productId: true, status: true } } },
      },
    },
  });
  if (!question || question.quiz.course.productId !== productId) {
    return { error: "Question not found." };
  }
  const editErr = assertPartnerEditable(question.quiz.course.status);
  if (editErr) return { error: editErr };

  await prisma.question.delete({ where: { id: questionId } });
  revalidatePartnerCourse(productId, question.quiz.course.id);
  return { ok: true };
}

export async function upsertPartnerBadge(
  productId: string,
  courseId: string,
  raw: Parameters<typeof badgeSchema.safeParse>[0]
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const parsed = badgeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };
  const editErr = assertPartnerEditable(course.status);
  if (editErr) return { error: editErr };

  await prisma.badge.upsert({
    where: { courseId },
    update: {
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
      criteria: parsed.data.criteria?.trim() || null,
      issuer: parsed.data.issuer?.trim() || "Arcademy",
      status: parsed.data.status,
    },
    create: {
      courseId,
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
      criteria: parsed.data.criteria?.trim() || null,
      issuer: parsed.data.issuer?.trim() || "Arcademy",
      status: parsed.data.status,
    },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}

export async function submitPartnerCourseForReview(
  productId: string,
  courseId: string
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };

  if (
    course.status !== "partner_draft" &&
    course.status !== "staff_changes_requested"
  ) {
    return { error: "This course cannot be submitted for review right now." };
  }

  const readiness = await getPartnerSubmitReadiness(courseId);
  if (!readiness.ready) {
    return { error: readiness.blockers[0] };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "submitted_for_review",
      submittedForReviewAt: new Date(),
      reviewRequestedByUserId: user.id,
      staffReviewNotes: null,
    },
  });

  trackEventFireAndForget({
    eventName: "partner_course_submitted_for_review",
    source: "server_action",
    path: projectCoursePath(productId, courseId),
    userId: user.id,
    courseId,
    courseSlug: course.slug,
    ecosystemProjectId: productId,
    ecosystemProjectSlug: course.product.slug,
    metadata: { partnerUserId: user.id },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}

export async function returnPartnerCourseToDraft(
  productId: string,
  courseId: string
): Promise<Result> {
  const user = await guardProduct(productId);
  if (!user) return { error: "You do not have permission to manage this project." };

  const course = await getPartnerCourse(courseId, productId);
  if (!course) return { error: "Course not found." };

  if (course.status !== "staff_changes_requested") {
    return { error: "Only courses with requested changes can return to draft." };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "partner_draft" },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}
