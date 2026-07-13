import "server-only";

import type { CourseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  badgeSchema,
  courseSchema,
  lessonSchema,
  PARTNER_EDITABLE_STATUSES,
  questionSchema,
  normalizeQuestionInput,
} from "@/lib/course-schemas";
import { resolveCourseSlugOnRename, uniqueCourseSlug } from "@/lib/slugs";
import { coursePath, productPath } from "@/lib/paths";
import { prisma } from "@/lib/prisma";

export type CourseEditorScope =
  | { role: "staff"; userId: string }
  | { role: "partner"; userId: string; productId: string };

export type ActionResult<T = unknown> = ({ ok: true } & T) | { error: string };

const moduleSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(500).optional().nullable(),
});

export function assertPartnerEditable(status: CourseStatus): string | null {
  if (
    !PARTNER_EDITABLE_STATUSES.includes(
      status as (typeof PARTNER_EDITABLE_STATUSES)[number]
    )
  ) {
    return "This course cannot be edited in its current review state.";
  }
  return null;
}

function partnerCoursesPath(productId: string) {
  return `/partner-console/${productId}/courses`;
}

function partnerCoursePath(productId: string, courseId: string) {
  return `${partnerCoursesPath(productId)}/${courseId}`;
}

export function revalidateCourseEditorPaths(
  scope: CourseEditorScope,
  courseId: string,
  options?: { productSlug?: string; courseSlug?: string }
) {
  if (scope.role === "staff") {
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/admin");
    if (options?.productSlug && options?.courseSlug) {
      revalidatePath(productPath(options.productSlug));
      revalidatePath(coursePath(options.productSlug, options.courseSlug));
    }
    revalidatePath("/courses");
    revalidatePath("/products");
    return;
  }

  revalidatePath(partnerCoursesPath(scope.productId));
  revalidatePath(partnerCoursePath(scope.productId, courseId));
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin");
}

async function getCourseForScope(
  scope: CourseEditorScope,
  courseId: string
) {
  if (scope.role === "partner") {
    return prisma.course.findFirst({
      where: { id: courseId, productId: scope.productId },
      include: { product: { select: { id: true, slug: true } } },
    });
  }
  return prisma.course.findUnique({
    where: { id: courseId },
    include: { product: { select: { id: true, slug: true } } },
  });
}

async function gateCourseEdit(
  scope: CourseEditorScope,
  courseId: string
): Promise<
  | { error: string }
  | {
      course: NonNullable<Awaited<ReturnType<typeof getCourseForScope>>>;
    }
> {
  const course = await getCourseForScope(scope, courseId);
  if (!course) return { error: "Course not found." };
  if (scope.role === "partner") {
    const editErr = assertPartnerEditable(course.status);
    if (editErr) return { error: editErr };
  }
  return { course };
}

async function gateLessonById(scope: CourseEditorScope, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        include: { product: { select: { id: true, slug: true } } },
      },
    },
  });
  if (!lesson) return { error: "Lesson not found." as const };
  if (scope.role === "partner" && lesson.course.productId !== scope.productId) {
    return { error: "Lesson not found." as const };
  }
  if (scope.role === "partner") {
    const editErr = assertPartnerEditable(lesson.course.status);
    if (editErr) return { error: editErr };
  }
  return { lesson };
}

async function gateQuizById(scope: CourseEditorScope, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: {
        include: { product: { select: { id: true, slug: true } } },
      },
    },
  });
  if (!quiz) return { error: "Quiz not found." as const };
  if (scope.role === "partner" && quiz.course.productId !== scope.productId) {
    return { error: "Quiz not found." as const };
  }
  if (scope.role === "partner") {
    const editErr = assertPartnerEditable(quiz.course.status);
    if (editErr) return { error: editErr };
  }
  return { quiz };
}

async function gateQuestionById(scope: CourseEditorScope, questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: {
          course: {
            include: { product: { select: { id: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!question) return { error: "Question not found." as const };
  if (
    scope.role === "partner" &&
    question.quiz.course.productId !== scope.productId
  ) {
    return { error: "Question not found." as const };
  }
  if (scope.role === "partner") {
    const editErr = assertPartnerEditable(question.quiz.course.status);
    if (editErr) return { error: editErr };
  }
  return { question };
}

async function gateModuleById(scope: CourseEditorScope, moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        include: { product: { select: { id: true, slug: true } } },
      },
    },
  });
  if (!mod) return { error: "Module not found." as const };
  if (scope.role === "partner" && mod.course.productId !== scope.productId) {
    return { error: "Module not found." as const };
  }
  if (scope.role === "partner") {
    const editErr = assertPartnerEditable(mod.course.status);
    if (editErr) return { error: editErr };
  }
  return { mod };
}

export async function createCourseForEditor(
  scope: CourseEditorScope,
  raw: z.input<typeof courseSchema>
): Promise<ActionResult<{ id: string; productId: string; slug: string }>> {
  const productId =
    scope.role === "partner" ? scope.productId : raw.productId ?? "";
  const parsed = courseSchema.safeParse({ ...raw, productId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) {
    return {
      error:
        scope.role === "partner"
          ? "Ecosystem project not found."
          : "Product not found.",
    };
  }

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
      prerequisiteCourseIds: (parsed.data.prerequisiteCourseIds ?? []).filter(
        Boolean
      ),
      ...(scope.role === "partner" ? { status: "partner_draft" as const } : {}),
    },
  });

  revalidateCourseEditorPaths(scope, course.id);
  if (scope.role === "staff") {
    revalidatePath("/admin/products");
  }

  return {
    ok: true,
    id: course.id,
    productId: product.id,
    slug: course.slug,
  };
}

export async function updateCourseForEditor(
  scope: CourseEditorScope,
  courseId: string,
  raw: z.input<typeof courseSchema>
): Promise<ActionResult> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const productId =
    scope.role === "partner"
      ? scope.productId
      : (raw.productId ?? gate.course.productId);
  const parsed = courseSchema.safeParse({ ...raw, productId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return { error: "Product not found." };

  const nextSlug =
    product.id === gate.course.productId
      ? await resolveCourseSlugOnRename(
          parsed.data.title,
          gate.course.slug,
          product.id,
          courseId
        )
      : await uniqueCourseSlug(parsed.data.title, product.id, courseId);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(scope.role === "staff" ? { productId: product.id } : {}),
      title: parsed.data.title,
      slug: nextSlug,
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      level: parsed.data.level,
      courseType: parsed.data.courseType,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
      learningOutcomes: (parsed.data.learningOutcomes ?? []).filter(Boolean),
      prerequisiteCourseIds: (parsed.data.prerequisiteCourseIds ?? []).filter(
        Boolean
      ),
    },
  });

  revalidateCourseEditorPaths(scope, courseId, {
    productSlug: product.slug,
    courseSlug: nextSlug,
  });
  if (scope.role === "staff" && product.slug !== gate.course.product.slug) {
    revalidatePath(productPath(gate.course.product.slug));
    revalidatePath(coursePath(gate.course.product.slug, gate.course.slug));
  }

  return { ok: true };
}

export async function createLessonForEditor(
  scope: CourseEditorScope,
  courseId: string,
  raw: z.input<typeof lessonSchema>
): Promise<ActionResult<{ id: string }>> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

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
      moduleId: parsed.data.moduleId || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true, id: lesson.id };
}

export async function updateLessonForEditor(
  scope: CourseEditorScope,
  lessonId: string,
  raw: z.input<typeof lessonSchema>
): Promise<ActionResult> {
  const gate = await gateLessonById(scope, lessonId);
  if ("error" in gate) return gate;

  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      mediaUrl: parsed.data.mediaUrl || null,
      status: parsed.data.status,
      required: parsed.data.required,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
      moduleId: parsed.data.moduleId || null,
    },
  });

  revalidateCourseEditorPaths(scope, gate.lesson.courseId);
  return { ok: true };
}

export async function deleteLessonForEditor(
  scope: CourseEditorScope,
  lessonId: string
): Promise<ActionResult> {
  const gate = await gateLessonById(scope, lessonId);
  if ("error" in gate) return gate;

  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidateCourseEditorPaths(scope, gate.lesson.courseId);
  return { ok: true };
}

export async function reorderLessonsForEditor(
  scope: CourseEditorScope,
  courseId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

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

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true };
}

export async function createModuleForEditor(
  scope: CourseEditorScope,
  courseId: string,
  raw: z.input<typeof moduleSchema>
): Promise<ActionResult<{ id: string }>> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const parsed = moduleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const mod = await prisma.module.create({
    data: {
      courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true, id: mod.id };
}

export async function updateModuleForEditor(
  scope: CourseEditorScope,
  moduleId: string,
  raw: z.input<typeof moduleSchema>
): Promise<ActionResult> {
  const gate = await gateModuleById(scope, moduleId);
  if ("error" in gate) return gate;

  const parsed = moduleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.module.update({
    where: { id: moduleId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
    },
  });

  revalidateCourseEditorPaths(scope, gate.mod.courseId);
  return { ok: true };
}

export async function deleteModuleForEditor(
  scope: CourseEditorScope,
  moduleId: string
): Promise<ActionResult> {
  const gate = await gateModuleById(scope, moduleId);
  if ("error" in gate) return gate;

  await prisma.module.delete({ where: { id: moduleId } });
  await prisma.lesson.updateMany({
    where: { moduleId },
    data: { moduleId: null },
  });

  revalidateCourseEditorPaths(scope, gate.mod.courseId);
  return { ok: true };
}

export async function reorderModulesForEditor(
  scope: CourseEditorScope,
  courseId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  await prisma.$transaction([
    ...orderedIds.map((id, i) =>
      prisma.module.updateMany({
        where: { id, courseId },
        data: { order: -(i + 1) },
      })
    ),
    ...orderedIds.map((id, i) =>
      prisma.module.updateMany({
        where: { id, courseId },
        data: { order: i },
      })
    ),
  ]);

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true };
}

export async function upsertFinalQuizForEditor(
  scope: CourseEditorScope,
  courseId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<ActionResult<{ id: string; created: boolean }>> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const threshold = Math.min(100, Math.max(1, Math.round(raw.passThreshold)));
  const title = raw.title?.trim() || "Course Quiz";
  const description = raw.description?.trim() || null;
  const status = raw.status ?? "published";

  const existing = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
  });

  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: { title, passThreshold: threshold, description, status },
      })
    : await prisma.quiz.create({
        data: {
          courseId,
          title,
          passThreshold: threshold,
          description,
          status,
        },
      });

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true, id: quiz.id, created: !existing };
}

export async function upsertLessonKnowledgeCheckForEditor(
  scope: CourseEditorScope,
  courseId: string,
  lessonId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<ActionResult<{ id: string }>> {
  if (scope.role === "partner") {
    return { error: "Knowledge checks are staff-only for now." };
  }

  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    select: { id: true },
  });
  if (!lesson) return { error: "Lesson not found." };

  const threshold = Math.min(100, Math.max(1, Math.round(raw.passThreshold)));
  const title = raw.title?.trim() || "Knowledge check";
  const description = raw.description?.trim() || null;
  const status = raw.status ?? "draft";

  const existing = await prisma.quiz.findFirst({ where: { lessonId } });
  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: {
          title,
          passThreshold: threshold,
          description,
          status,
          type: "lesson_knowledge_check",
        },
      })
    : await prisma.quiz.create({
        data: {
          courseId,
          lessonId,
          title,
          passThreshold: threshold,
          description,
          status,
          type: "lesson_knowledge_check",
        },
      });

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true, id: quiz.id };
}

export async function createQuestionForEditor(
  scope: CourseEditorScope,
  quizId: string,
  raw: z.input<typeof questionSchema>
): Promise<ActionResult> {
  const gate = await gateQuizById(scope, quizId);
  if ("error" in gate) return gate;

  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = normalizeQuestionInput(parsed.data);

  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.question.create({
    data: {
      quizId,
      ...data,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateCourseEditorPaths(scope, gate.quiz.courseId);
  return { ok: true };
}

export async function updateQuestionForEditor(
  scope: CourseEditorScope,
  questionId: string,
  raw: z.input<typeof questionSchema>
): Promise<ActionResult> {
  const gate = await gateQuestionById(scope, questionId);
  if ("error" in gate) return gate;

  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = normalizeQuestionInput(parsed.data);

  await prisma.question.update({
    where: { id: questionId },
    data,
  });

  revalidateCourseEditorPaths(scope, gate.question.quiz.courseId);
  return { ok: true };
}

export async function deleteQuestionForEditor(
  scope: CourseEditorScope,
  questionId: string
): Promise<ActionResult> {
  const gate = await gateQuestionById(scope, questionId);
  if ("error" in gate) return gate;

  await prisma.question.delete({ where: { id: questionId } });
  revalidateCourseEditorPaths(scope, gate.question.quiz.courseId);
  return { ok: true };
}

export async function upsertBadgeForEditor(
  scope: CourseEditorScope,
  courseId: string,
  raw: z.input<typeof badgeSchema>
): Promise<ActionResult<{ created: boolean }>> {
  const gate = await gateCourseEdit(scope, courseId);
  if ("error" in gate) return gate;

  const parsed = badgeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existingBadge = await prisma.badge.findUnique({ where: { courseId } });

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

  revalidateCourseEditorPaths(scope, courseId);
  return { ok: true, created: !existingBadge };
}
