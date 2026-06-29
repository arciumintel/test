"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Result<T = void> = { ok: true } & (T extends void ? object : T);
type ActionError = { error: string };

async function guard(): Promise<string | null> {
  try {
    await requireStaff();
    return null;
  } catch {
    return "Staff access required.";
  }
}

const pathSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published"]),
});

export async function createLearningPath(
  productId: string,
  raw: z.input<typeof pathSchema>
): Promise<Result<{ id: string }> | ActionError> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = pathSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug =
    parsed.data.slug?.trim() ||
    slugify(parsed.data.title) ||
    `path-${Date.now()}`;

  const last = await prisma.learningPath.findFirst({
    where: { productId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const path = await prisma.learningPath.create({
    data: {
      productId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      status: parsed.data.status,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
  return { ok: true, id: path.id };
}

export async function updateLearningPath(
  pathId: string,
  raw: z.input<typeof pathSchema>
): Promise<Result | ActionError> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = pathSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const path = await prisma.learningPath.update({
    where: { id: pathId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      ...(parsed.data.slug ? { slug: parsed.data.slug } : {}),
    },
    select: { productId: true },
  });

  revalidatePath(`/admin/products/${path.productId}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteLearningPath(
  pathId: string
): Promise<Result | ActionError> {
  const err = await guard();
  if (err) return { error: err };

  const path = await prisma.learningPath.delete({
    where: { id: pathId },
    select: { productId: true },
  });

  revalidatePath(`/admin/products/${path.productId}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function setLearningPathCourses(
  pathId: string,
  courseIds: string[]
): Promise<Result | ActionError> {
  const err = await guard();
  if (err) return { error: err };

  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    select: { productId: true },
  });
  if (!path) return { error: "Learning path not found." };

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, productId: path.productId },
    select: { id: true },
  });
  if (courses.length !== courseIds.length) {
    return { error: "All courses must belong to this product." };
  }

  await prisma.$transaction([
    prisma.learningPathCourse.deleteMany({ where: { pathId } }),
    ...courseIds.map((courseId, order) =>
      prisma.learningPathCourse.create({
        data: { pathId, courseId, order },
      })
    ),
  ]);

  revalidatePath(`/admin/products/${path.productId}`);
  revalidatePath("/products");
  return { ok: true };
}
