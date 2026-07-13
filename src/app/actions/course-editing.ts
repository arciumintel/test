"use server";

import type { z } from "zod";
import {
  badgeSchema,
  courseSchema,
  lessonSchema,
  questionSchema,
} from "@/lib/course-schemas";
import type { CourseEditorContext } from "@/lib/course-editor-context";
import {
  createCourseForEditor,
  createLessonForEditor,
  createModuleForEditor,
  createQuestionForEditor,
  deleteLessonForEditor,
  deleteModuleForEditor,
  deleteQuestionForEditor,
  reorderLessonsForEditor,
  reorderModulesForEditor,
  updateCourseForEditor,
  updateLessonForEditor,
  updateModuleForEditor,
  updateQuestionForEditor,
  upsertBadgeForEditor,
  upsertFinalQuizForEditor,
  upsertLessonKnowledgeCheckForEditor,
  type ActionResult,
  type CourseEditorScope,
} from "@/lib/course-editing";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import {
  authorizeProjectAdmin,
  authorizeStaff,
  toActionError,
} from "@/lib/access-control";

async function resolveScope(
  ctx: CourseEditorContext
): Promise<CourseEditorScope | { error: string }> {
  if (ctx.role === "staff") {
    const auth = await authorizeStaff();
    if (!auth.ok) return toActionError(auth);
    return { role: "staff", userId: auth.user.id };
  }
  const auth = await authorizeProjectAdmin(ctx.productId);
  if (!auth.ok) return toActionError(auth);
  return { role: "partner", userId: auth.user.id, productId: ctx.productId };
}

export async function createCourse(
  ctx: CourseEditorContext,
  raw: z.input<typeof courseSchema>
): Promise<ActionResult<{ id: string }>> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;

  const result = await createCourseForEditor(scope, raw);
  if ("error" in result) return result;

  if (scope.role === "staff") {
    trackEventFireAndForget({
      eventName: "admin_course_created",
      source: "admin",
      path: "/admin/courses/new",
      userId: scope.userId,
      courseId: result.id,
      courseSlug: result.slug,
      ecosystemProjectId: result.productId,
      metadata: { adminUserId: scope.userId },
    });
  } else {
    trackEventFireAndForget({
      eventName: "partner_course_created",
      source: "server_action",
      path: `/partner-console/${scope.productId}/courses/new`,
      userId: scope.userId,
      courseId: result.id,
      courseSlug: result.slug,
      ecosystemProjectId: result.productId,
      metadata: { partnerUserId: scope.userId },
    });
  }

  return { ok: true, id: result.id };
}

export async function updateCourse(
  ctx: CourseEditorContext,
  courseId: string,
  raw: z.input<typeof courseSchema>
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return updateCourseForEditor(scope, courseId, raw);
}

export async function createLesson(
  ctx: CourseEditorContext,
  courseId: string,
  raw: z.input<typeof lessonSchema>
): Promise<ActionResult<{ id: string }>> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return createLessonForEditor(scope, courseId, raw);
}

export async function updateLesson(
  ctx: CourseEditorContext,
  lessonId: string,
  raw: z.input<typeof lessonSchema>
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return updateLessonForEditor(scope, lessonId, raw);
}

export async function deleteLesson(
  ctx: CourseEditorContext,
  lessonId: string
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return deleteLessonForEditor(scope, lessonId);
}

export async function reorderLessons(
  ctx: CourseEditorContext,
  courseId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return reorderLessonsForEditor(scope, courseId, orderedIds);
}

export async function createModule(
  ctx: CourseEditorContext,
  courseId: string,
  raw: { title: string; description?: string | null }
): Promise<ActionResult<{ id: string }>> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return createModuleForEditor(scope, courseId, raw);
}

export async function updateModule(
  ctx: CourseEditorContext,
  moduleId: string,
  raw: { title: string; description?: string | null }
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return updateModuleForEditor(scope, moduleId, raw);
}

export async function deleteModule(
  ctx: CourseEditorContext,
  moduleId: string
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return deleteModuleForEditor(scope, moduleId);
}

export async function reorderModules(
  ctx: CourseEditorContext,
  courseId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return reorderModulesForEditor(scope, courseId, orderedIds);
}

export async function upsertFinalQuiz(
  ctx: CourseEditorContext,
  courseId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<ActionResult<{ id: string }>> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;

  const result = await upsertFinalQuizForEditor(scope, courseId, raw);
  if ("error" in result) return result;

  if (scope.role === "staff" && result.created) {
    const questionCount = await import("@/lib/prisma").then(({ prisma }) =>
      prisma.question.count({ where: { quizId: result.id } })
    );
    trackEventFireAndForget({
      eventName: "admin_quiz_created",
      source: "admin",
      path: `/admin/courses/${courseId}`,
      userId: scope.userId,
      courseId,
      quizId: result.id,
      metadata: {
        adminUserId: scope.userId,
        passThreshold: raw.passThreshold,
        questionCount,
      },
    });
  }

  return { ok: true, id: result.id };
}

export async function upsertLessonKnowledgeCheck(
  ctx: CourseEditorContext,
  courseId: string,
  lessonId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<ActionResult<{ id: string }>> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return upsertLessonKnowledgeCheckForEditor(scope, courseId, lessonId, raw);
}

export async function createQuestion(
  ctx: CourseEditorContext,
  quizId: string,
  raw: z.input<typeof questionSchema>
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return createQuestionForEditor(scope, quizId, raw);
}

export async function updateQuestion(
  ctx: CourseEditorContext,
  questionId: string,
  raw: z.input<typeof questionSchema>
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return updateQuestionForEditor(scope, questionId, raw);
}

export async function deleteQuestion(
  ctx: CourseEditorContext,
  questionId: string
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;
  return deleteQuestionForEditor(scope, questionId);
}

export async function upsertBadge(
  ctx: CourseEditorContext,
  courseId: string,
  raw: z.input<typeof badgeSchema>
): Promise<ActionResult> {
  const scope = await resolveScope(ctx);
  if ("error" in scope) return scope;

  const result = await upsertBadgeForEditor(scope, courseId, raw);
  if ("error" in result) return result;

  if (scope.role === "staff" && result.created) {
    const badge = await import("@/lib/prisma").then(({ prisma }) =>
      prisma.badge.findUnique({ where: { courseId } })
    );
    if (badge) {
      trackEventFireAndForget({
        eventName: "admin_badge_created",
        source: "admin",
        path: `/admin/courses/${courseId}`,
        userId: scope.userId,
        courseId,
        badgeId: badge.id,
      });
    }
  }

  return { ok: true };
}
