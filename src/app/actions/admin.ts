"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { coursePath, productPath } from "@/lib/paths";
import { getCoursePublishReadiness } from "@/lib/publish-readiness";
import { requireStaff } from "@/lib/session";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(
  base: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  const root = slugify(base) || "course";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.course.findUnique({
      where: { productId_slug: { productId, slug } },
    });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

async function guard(): Promise<string | null> {
  try {
    await requireStaff();
    return null;
  } catch {
    return "You must be signed in as staff to do this.";
  }
}

// ── Courses ──────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(2, "Title is required").max(140),
  productId: z.string().min(1, "Product is required"),
  summary: z.string().min(2, "Summary is required").max(400),
  description: z.string().max(8000).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  courseType: z.enum(["foundational", "product_onboarding", "builder_intro"]),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  learningOutcomes: z.array(z.string().max(280)).max(20).optional(),
  prerequisiteCourseIds: z.array(z.string()).max(10).optional(),
});

export async function createCourse(
  raw: z.input<typeof courseSchema>
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, slug: true },
  });
  if (!product) return { error: "Product not found." };

  const course = await prisma.course.create({
    data: {
      productId: product.id,
      title: data.title,
      slug: await uniqueSlug(data.title, product.id),
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      courseType: data.courseType,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
      prerequisiteCourseIds: (data.prerequisiteCourseIds ?? []).filter(Boolean),
    },
  });

  const staff = await requireStaff().catch(() => null);
  if (staff) {
    trackEventFireAndForget({
      eventName: "admin_course_created",
      source: "admin",
      path: "/admin/courses/new",
      userId: staff.id,
      courseId: course.id,
      courseSlug: course.slug,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      metadata: { adminUserId: staff.id },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { ok: true, id: course.id };
}

export async function updateCourse(
  id: string,
  raw: z.input<typeof courseSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const current = await prisma.course.findUnique({
    where: { id },
    include: { product: { select: { slug: true } } },
  });
  if (!current) return { error: "Course not found." };
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, slug: true },
  });
  if (!product) return { error: "Product not found." };
  const nextSlug =
    slugify(data.title) === current.slug && product.id === current.productId
      ? current.slug
      : await uniqueSlug(data.title, product.id, id);

  await prisma.course.update({
    where: { id },
    data: {
      productId: product.id,
      title: data.title,
      slug: nextSlug,
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      courseType: data.courseType,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
      prerequisiteCourseIds: (data.prerequisiteCourseIds ?? []).filter(Boolean),
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath("/products");
  revalidatePath(productPath(current.product.slug));
  revalidatePath(productPath(product.slug));
  revalidatePath(coursePath(current.product.slug, current.slug));
  revalidatePath(coursePath(product.slug, nextSlug));
  return { ok: true };
}

export async function setCourseStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  if (status === "published") {
    const readiness = await getCoursePublishReadiness(id);
    if (!readiness.ready) {
      return { error: readiness.blockers[0] };
    }
  }

  const current = await prisma.course.findUnique({
    where: { id },
    select: {
      status: true,
      slug: true,
      product: { select: { id: true, slug: true } },
    },
  });
  if (!current) return { error: "Course not found." };

  const course = await prisma.course.update({
    where: { id },
    data: { status },
    include: {
      product: { select: { slug: true, id: true } },
      lessons: { where: { status: "published" }, select: { id: true } },
      quizzes: {
        where: { lessonId: null },
        include: { _count: { select: { questions: true } } },
      },
      badge: { select: { id: true } },
    },
  });

  if (status === "published" && current.status !== "published") {
    const readiness = await getCoursePublishReadiness(id);
    const staff = await requireStaff().catch(() => null);
    const finalQuiz = course.quizzes[0];
    if (staff) {
      const eventName =
        current.status === "approved"
          ? "staff_partner_course_published"
          : "admin_course_published";
      trackEventFireAndForget({
        eventName,
        source: "admin",
        path: `/admin/courses/${id}`,
        userId: staff.id,
        courseId: course.id,
        courseSlug: course.slug,
        ecosystemProjectId: course.product.id,
        ecosystemProjectSlug: course.product.slug,
        metadata: {
          adminUserId: staff.id,
          previousStatus: current.status,
          nextStatus: status,
          publishedLessonCount: course.lessons.length,
          hasFinalQuiz: Boolean(finalQuiz),
          questionCount: finalQuiz?._count.questions ?? 0,
          hasBadge: Boolean(course.badge),
          readinessWarningCount: readiness.warnings.length,
        },
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath("/products");
  revalidatePath(productPath(course.product.slug));
  revalidatePath(coursePath(course.product.slug, course.slug));
  return { ok: true };
}

// ── Lessons ──────────────────────────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  content: z.string().min(1, "Lesson content is required").max(40000),
  mediaUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  required: z.boolean(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
});

export async function createLesson(
  courseId: string,
  raw: z.input<typeof lessonSchema>
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };
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
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true, id: lesson.id };
}

export async function updateLesson(
  id: string,
  raw: z.input<typeof lessonSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      mediaUrl: parsed.data.mediaUrl || null,
      status: parsed.data.status,
      required: parsed.data.required,
      estimatedDuration: parsed.data.estimatedDuration ?? null,
    },
    select: { courseId: true },
  });

  revalidatePath(`/admin/courses/${lesson.courseId}`);
  return { ok: true };
}

export async function deleteLesson(id: string): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const lesson = await prisma.lesson.delete({
    where: { id },
    select: { courseId: true },
  });
  revalidatePath(`/admin/courses/${lesson.courseId}`);
  return { ok: true };
}

/** Reorders lessons using a two-phase write to dodge the unique(order) index. */
export async function reorderLessons(
  courseId: string,
  orderedIds: string[]
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

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

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

// ── Quiz & questions ───────────────────────────────────────────────────────

export async function upsertFinalQuiz(
  courseId: string,
  raw: {
    title: string;
    passThreshold: number;
    description?: string | null;
    status?: "draft" | "published";
  }
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };

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

  if (!existing) {
    const questionCount = await prisma.question.count({ where: { quizId: quiz.id } });
    const staff = await requireStaff().catch(() => null);
    if (staff) {
      trackEventFireAndForget({
        eventName: "admin_quiz_created",
        source: "admin",
        path: `/admin/courses/${courseId}`,
        userId: staff.id,
        courseId,
        quizId: quiz.id,
        metadata: {
          adminUserId: staff.id,
          passThreshold: threshold,
          questionCount,
        },
      });
    }
  }

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true, id: quiz.id };
}

const questionSchema = z.object({
  prompt: z.string().min(2, "Prompt is required").max(600),
  answerOptions: z
    .array(z.string().min(1).max(300))
    .min(2, "Add at least two options")
    .max(6),
  correctAnswer: z.coerce.number().int().min(0),
  explanation: z.string().max(800).optional().nullable(),
});

export async function createQuestion(
  quizId: string,
  raw: z.input<typeof questionSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.correctAnswer >= parsed.data.answerOptions.length) {
    return { error: "Correct answer must be one of the options." };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { courseId: true },
  });
  if (!quiz) return { error: "Quiz not found." };

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

  revalidatePath(`/admin/courses/${quiz.courseId}`);
  return { ok: true };
}

export async function updateQuestion(
  id: string,
  raw: z.input<typeof questionSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.correctAnswer >= parsed.data.answerOptions.length) {
    return { error: "Correct answer must be one of the options." };
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      prompt: parsed.data.prompt,
      answerOptions: parsed.data.answerOptions,
      correctAnswer: parsed.data.correctAnswer,
      explanation: parsed.data.explanation || null,
    },
    include: { quiz: { select: { courseId: true } } },
  });

  revalidatePath(`/admin/courses/${question.quiz.courseId}`);
  return { ok: true };
}

export async function deleteQuestion(id: string): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const question = await prisma.question.delete({
    where: { id },
    include: { quiz: { select: { courseId: true } } },
  });
  revalidatePath(`/admin/courses/${question.quiz.courseId}`);
  return { ok: true };
}

// ── Badge ────────────────────────────────────────────────────────────────────

const badgeSchema = z.object({
  name: z.string().min(2, "Badge name is required").max(120),
  description: z.string().min(2, "Description is required").max(400),
  imageUrl: z.string().optional().nullable(),
  criteria: z.string().max(600).optional().nullable(),
  issuer: z.string().max(120).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function upsertBadge(
  courseId: string,
  raw: z.input<typeof badgeSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
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

  if (!existingBadge) {
    const badge = await prisma.badge.findUnique({ where: { courseId } });
    const staff = await requireStaff().catch(() => null);
    if (staff && badge) {
      trackEventFireAndForget({
        eventName: "admin_badge_created",
        source: "admin",
        path: `/admin/courses/${courseId}`,
        userId: staff.id,
        courseId,
        badgeId: badge.id,
      });
    }
  }

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

// ── Partner course staff review ─────────────────────────────────────────────

export async function requestPartnerChanges(
  courseId: string,
  notes: string
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  const trimmed = notes.trim();
  if (!trimmed) return { error: "Add notes explaining what the partner should change." };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!course) return { error: "Course not found." };
  if (course.status !== "submitted_for_review") {
    return { error: "Only submitted courses can be sent back for changes." };
  }

  const staff = await requireStaff().catch(() => null);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "staff_changes_requested",
      staffReviewNotes: trimmed,
      reviewedAt: new Date(),
      reviewedByUserId: staff?.id ?? null,
    },
  });

  if (staff) {
    trackEventFireAndForget({
      eventName: "staff_partner_course_changes_requested",
      source: "admin",
      path: `/admin/courses/${courseId}`,
      userId: staff.id,
      courseId,
      courseSlug: course.slug,
      ecosystemProjectId: course.product.id,
      ecosystemProjectSlug: course.product.slug,
      metadata: { adminUserId: staff.id },
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/partner-console/${course.product.id}/courses/${courseId}`);
  return { ok: true };
}

export async function approvePartnerCourse(courseId: string): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!course) return { error: "Course not found." };
  if (course.status !== "submitted_for_review") {
    return { error: "Only submitted courses can be approved." };
  }

  const staff = await requireStaff().catch(() => null);

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewedByUserId: staff?.id ?? null,
      staffReviewNotes: null,
    },
  });

  if (staff) {
    trackEventFireAndForget({
      eventName: "staff_partner_course_approved",
      source: "admin",
      path: `/admin/courses/${courseId}`,
      userId: staff.id,
      courseId,
      courseSlug: course.slug,
      ecosystemProjectId: course.product.id,
      ecosystemProjectSlug: course.product.slug,
      metadata: { adminUserId: staff.id },
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/partner-console/${course.product.id}/courses/${courseId}`);
  return { ok: true };
}

export async function publishApprovedCourse(courseId: string): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { status: true },
  });
  if (!course) return { error: "Course not found." };
  if (course.status !== "approved" && course.status !== "draft") {
    return {
      error:
        "Only approved partner courses or staff drafts can be published from this action.",
    };
  }

  return setCourseStatus(courseId, "published");
}
