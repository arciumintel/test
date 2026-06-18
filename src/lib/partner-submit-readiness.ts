import { prisma } from "@/lib/prisma";

export type SubmitReadinessReport = {
  ready: boolean;
  blockers: string[];
};

/** Minimum content required before a partner can submit for staff review. */
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

  const blockers: string[] = [];

  if (!course.title.trim()) blockers.push("Course title is required.");
  if (!course.summary.trim()) blockers.push("Course summary is required.");
  if (course.lessons.length === 0) {
    blockers.push("Add at least one lesson before submitting.");
  }

  const finalQuiz = course.quizzes[0];
  if (!finalQuiz) {
    blockers.push("Create a final course quiz before submitting.");
  } else if (finalQuiz._count.questions === 0) {
    blockers.push("Add at least one quiz question before submitting.");
  }

  return { ready: blockers.length === 0, blockers };
}
