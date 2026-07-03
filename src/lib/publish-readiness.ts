import { prisma } from "@/lib/prisma";

export type ReadinessReport = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
};

export async function getCoursePublishReadiness(
  courseId: string
): Promise<ReadinessReport> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      product: { select: { name: true, status: true } },
      lessons: { select: { status: true, required: true } },
      badge: {
        select: {
          name: true,
          description: true,
          imageUrl: true,
          criteria: true,
          status: true,
        },
      },
      quizzes: {
        where: { lessonId: null },
        include: {
          questions: { select: { explanation: true } },
        },
      },
    },
  });

  if (!course) {
    return { ready: false, blockers: ["Course not found."], warnings: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (course.product.status !== "published") {
    blockers.push(
      `Publish the ecosystem project "${course.product.name}" before publishing this course.`
    );
  }

  const lessonsGoingLive = course.lessons.filter(
    (l) => l.status === "published" || l.required
  );
  if (lessonsGoingLive.length === 0) {
    blockers.push("Add at least one required lesson.");
  }

  const optionalHiddenLessons = course.lessons.filter(
    (l) => l.status === "draft" && !l.required
  );
  if (optionalHiddenLessons.length > 0) {
    warnings.push(
      `${optionalHiddenLessons.length} optional lesson${optionalHiddenLessons.length === 1 ? "" : "s"} hidden from learners.`
    );
  }

  const finalQuiz = course.quizzes[0] ?? null;
  if (!finalQuiz) {
    blockers.push("Create a final course quiz.");
  } else {
    if (finalQuiz.questions.length === 0) {
      blockers.push("Add at least one question to the final quiz.");
    }
    const missingExplanations = finalQuiz.questions.filter((q) => !q.explanation?.trim())
      .length;
    if (missingExplanations > 0) {
      warnings.push(
        `${missingExplanations} quiz question${missingExplanations === 1 ? "" : "s"} missing an explanation.`
      );
    }
  }

  if (!course.badge) {
    blockers.push("Create a completion badge for this course.");
  } else {
    if (course.badge.status === "archived") {
      blockers.push(
        "The completion badge is archived. Restore it before publishing."
      );
    }
    if (!course.badge.criteria?.trim()) {
      warnings.push("Badge criteria is empty — add criteria for clearer verification pages.");
    }
    if (!course.badge.imageUrl) {
      warnings.push("Badge has no image.");
    }
  }

  if (!course.thumbnailUrl) {
    warnings.push("Course has no thumbnail.");
  }
  if (!course.description?.trim()) {
    warnings.push("Course has no extended description.");
  }
  if (!course.summary?.trim()) {
    warnings.push("Course summary is empty.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}

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
): Promise<ReadinessReport> {
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
