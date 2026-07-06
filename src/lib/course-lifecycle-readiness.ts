import { prisma } from "@/lib/prisma";

export type ReadinessReport = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
};

export type SubmitReadinessReport = {
  ready: boolean;
  blockers: string[];
};

type FinalQuizSnapshot = {
  questionCount: number;
  questionsMissingExplanation?: number;
};

type CourseSubmitSnapshot = {
  title: string;
  summary: string;
  lessonCount: number;
  finalQuiz: FinalQuizSnapshot | null;
};

type CoursePublishSnapshot = {
  productName: string;
  productStatus: string;
  lessons: Array<{ status: string; required: boolean }>;
  finalQuiz: FinalQuizSnapshot | null;
  badge: {
    name: string;
    description: string;
    imageUrl: string | null;
    criteria: string | null;
    status: string;
  } | null;
  thumbnailUrl: string | null;
  description: string | null;
  summary: string | null;
};

function finalQuizBlockers(
  finalQuiz: FinalQuizSnapshot | null,
  opts: { createMessage: string; questionsMessage: string }
): string[] {
  if (!finalQuiz) return [opts.createMessage];
  if (finalQuiz.questionCount === 0) return [opts.questionsMessage];
  return [];
}

/** Minimum content before a partner can submit for staff review. */
export function evaluatePartnerSubmitReadiness(
  course: CourseSubmitSnapshot
): SubmitReadinessReport {
  const blockers: string[] = [];

  if (!course.title.trim()) blockers.push("Course title is required.");
  if (!course.summary.trim()) blockers.push("Course summary is required.");
  if (course.lessonCount === 0) {
    blockers.push("Add at least one lesson before submitting.");
  }

  blockers.push(
    ...finalQuizBlockers(course.finalQuiz, {
      createMessage: "Create a final course quiz before submitting.",
      questionsMessage: "Add at least one quiz question before submitting.",
    })
  );

  return { ready: blockers.length === 0, blockers };
}

/** Staff publish gate — stricter than partner submit. */
export function evaluateStaffPublishReadiness(
  course: CoursePublishSnapshot
): ReadinessReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (course.productStatus !== "published") {
    blockers.push(
      `Publish the ecosystem project "${course.productName}" before publishing this course.`
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

  blockers.push(
    ...finalQuizBlockers(course.finalQuiz, {
      createMessage: "Create a final course quiz.",
      questionsMessage: "Add at least one question to the final quiz.",
    })
  );

  if (
    course.finalQuiz &&
    course.finalQuiz.questionsMissingExplanation &&
    course.finalQuiz.questionsMissingExplanation > 0
  ) {
    const n = course.finalQuiz.questionsMissingExplanation;
    warnings.push(
      `${n} quiz question${n === 1 ? "" : "s"} missing an explanation.`
    );
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
      warnings.push(
        "Badge criteria is empty — add criteria for clearer verification pages."
      );
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

export async function getPartnerSubmitReadiness(
  courseId: string
): Promise<SubmitReadinessReport> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: { select: { id: true } },
      quizzes: {
        where: { lessonId: null },
        include: { _count: { select: { questions: true } } },
      },
    },
  });

  if (!course) {
    return { ready: false, blockers: ["Course not found."] };
  }

  const finalQuiz = course.quizzes[0];
  return evaluatePartnerSubmitReadiness({
    title: course.title,
    summary: course.summary,
    lessonCount: course.lessons.length,
    finalQuiz: finalQuiz
      ? { questionCount: finalQuiz._count.questions }
      : null,
  });
}

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

  const finalQuizRow = course.quizzes[0] ?? null;
  return evaluateStaffPublishReadiness({
    productName: course.product.name,
    productStatus: course.product.status,
    lessons: course.lessons,
    finalQuiz: finalQuizRow
      ? {
          questionCount: finalQuizRow.questions.length,
          questionsMissingExplanation: finalQuizRow.questions.filter(
            (q) => !q.explanation?.trim()
          ).length,
        }
      : null,
    badge: course.badge,
    thumbnailUrl: course.thumbnailUrl,
    description: course.description,
    summary: course.summary,
  });
}
