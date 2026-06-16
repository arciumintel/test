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

  const publishedLessons = course.lessons.filter((l) => l.status === "published");
  if (publishedLessons.length === 0) {
    blockers.push("Add at least one published lesson.");
  }

  const draftLessons = course.lessons.filter((l) => l.status === "draft");
  if (draftLessons.length > 0) {
    warnings.push(
      `${draftLessons.length} lesson${draftLessons.length === 1 ? "" : "s"} still in draft.`
    );
  }

  const finalQuiz = course.quizzes[0] ?? null;
  if (!finalQuiz) {
    blockers.push("Create a final course quiz.");
  } else {
    if (finalQuiz.status !== "published") {
      blockers.push("Publish the final quiz.");
    }
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
    if (course.badge.status !== "published") {
      blockers.push("Publish the completion badge.");
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
  if (!product.referralUrl?.trim()) {
    warnings.push("Referral URL is not set.");
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
