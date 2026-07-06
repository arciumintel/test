import { prisma } from "@/lib/prisma";

export type { ReadinessReport } from "@/lib/course-lifecycle-readiness";
export {
  evaluateStaffPublishReadiness,
  getCoursePublishReadiness,
} from "@/lib/course-lifecycle-readiness";

/** Publishes required lessons, the final quiz, and the badge when a course goes live. */
export async function cascadeRequiredPublishContent(
  courseId: string
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: { where: { required: true, status: "draft" }, select: { id: true } },
      quizzes: {
        where: { lessonId: null, status: "draft" },
        select: { id: true },
      },
      badge: { select: { id: true, status: true } },
    },
  });
  if (!course) return;

  await prisma.$transaction(async (tx) => {
    for (const lesson of course.lessons) {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "published" },
      });
    }
    for (const quiz of course.quizzes) {
      await tx.quiz.update({
        where: { id: quiz.id },
        data: { status: "published" },
      });
    }
    if (course.badge?.status === "draft") {
      await tx.badge.update({
        where: { id: course.badge.id },
        data: { status: "published" },
      });
    }
  });
}

export async function getProductPublishReadiness(
  productId: string
): Promise<import("@/lib/course-lifecycle-readiness").ReadinessReport> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: { select: { courses: true } },
      courses: { where: { status: "published" }, select: { id: true } },
    },
  });

  if (!product) {
    return { ready: false, blockers: ["Ecosystem project not found."], warnings: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!product.name.trim()) {
    blockers.push("Name is required.");
  }
  if (!product.description.trim()) {
    blockers.push("Description is required.");
  }

  if (!product.logoUrl) {
    warnings.push("No logo uploaded.");
  }
  if (!product.category?.trim()) {
    warnings.push("Category is not set.");
  }
  if (!product.partnerName?.trim()) {
    warnings.push("Partner name is not set.");
  }
  const links = Array.isArray(product.links) ? product.links : [];
  const hasLinks = links.some(
    (link) =>
      link &&
      typeof link === "object" &&
      "url" in link &&
      typeof link.url === "string" &&
      link.url.trim()
  );
  if (!hasLinks) {
    warnings.push("No ecosystem project links added yet.");
  }
  if (product._count.courses === 0) {
    warnings.push("No courses linked to this ecosystem project yet.");
  } else if (product.courses.length === 0) {
    warnings.push("No published courses yet.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}
