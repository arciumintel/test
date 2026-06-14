"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

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

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "course";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.course.findUnique({ where: { slug } });
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
  partnerName: z.string().max(120).optional().nullable(),
  summary: z.string().min(2, "Summary is required").max(400),
  description: z.string().max(8000).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  learningOutcomes: z.array(z.string().max(280)).max(20).optional(),
});

export async function createCourse(
  raw: z.input<typeof courseSchema>
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const course = await prisma.course.create({
    data: {
      title: data.title,
      slug: await uniqueSlug(data.title),
      partnerName: data.partnerName || null,
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
    },
  });

  revalidatePath("/admin");
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

  const current = await prisma.course.findUnique({ where: { id } });
  if (!current) return { error: "Course not found." };

  await prisma.course.update({
    where: { id },
    data: {
      title: data.title,
      slug:
        slugify(data.title) === current.slug
          ? current.slug
          : await uniqueSlug(data.title, id),
      partnerName: data.partnerName || null,
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath(`/courses/${current.slug}`);
  return { ok: true };
}

export async function setCourseStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  if (status === "published") {
    const lessonCount = await prisma.lesson.count({
      where: { courseId: id, status: "published" },
    });
    if (lessonCount === 0) {
      return { error: "Add at least one published lesson before publishing." };
    }
  }

  await prisma.course.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  return { ok: true };
}

// ── Lessons ──────────────────────────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  content: z.string().min(1, "Lesson content is required").max(40000),
  mediaUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
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
  title: string,
  passThreshold: number
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };

  const threshold = Math.min(100, Math.max(1, Math.round(passThreshold)));
  const existing = await prisma.quiz.findFirst({
    where: { courseId, lessonId: null },
  });

  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: { title: title || "Course Quiz", passThreshold: threshold },
      })
    : await prisma.quiz.create({
        data: {
          courseId,
          title: title || "Course Quiz",
          passThreshold: threshold,
        },
      });

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
});

export async function upsertBadge(
  courseId: string,
  raw: z.input<typeof badgeSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = badgeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.badge.upsert({
    where: { courseId },
    update: {
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
    },
    create: {
      courseId,
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}
