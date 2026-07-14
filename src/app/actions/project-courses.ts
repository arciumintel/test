"use server";

import type { CourseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { coursePath, productPath } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import {
  cascadeRequiredPublishContent,
  getCoursePublishReadiness,
} from "@/lib/publish-readiness";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const PARTNER_PUBLISHABLE_STATUSES: CourseStatus[] = [
  "partner_draft",
  "staff_changes_requested",
  "submitted_for_review",
  "approved",
];

function projectCoursesPath(productId: string) {
  return `/partner-console/${productId}/courses`;
}

function projectCoursePath(productId: string, courseId: string) {
  return `${projectCoursesPath(productId)}/${courseId}`;
}

function revalidatePartnerCourse(
  productId: string,
  courseId: string,
  options?: { productSlug?: string; courseSlug?: string }
) {
  revalidatePath(projectCoursesPath(productId));
  revalidatePath(projectCoursePath(productId, courseId));
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin");
  if (options?.productSlug && options?.courseSlug) {
    revalidatePath(productPath(options.productSlug));
    revalidatePath(coursePath(options.productSlug, options.courseSlug));
    revalidatePath("/courses");
    revalidatePath("/products");
  }
}

export type PartnerCourseListItem = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  updatedAt: Date;
  _count: { lessons: number };
};

export async function listPartnerCourses(
  productId: string
): Promise<Result<{ courses: PartnerCourseListItem[] }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const courses = await prisma.course.findMany({
    where: { productId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { lessons: true } },
    },
  });

  return { ok: true, courses };
}

/** @deprecated Use publishPartnerCourse — partners publish directly. */
export async function submitPartnerCourseForReview(
  productId: string,
  courseId: string
): Promise<Result> {
  return publishPartnerCourse(productId, courseId);
}

export async function publishPartnerCourse(
  productId: string,
  courseId: string
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);
  const user = auth.user;

  const course = await prisma.course.findFirst({
    where: { id: courseId, productId },
    include: { product: { select: { slug: true } } },
  });
  if (!course) return { error: "Course not found." };

  if (course.status === "published") {
    return { error: "This course is already published." };
  }
  if (course.status === "archived") {
    return { error: "Restore this course from archived before publishing." };
  }
  if (!PARTNER_PUBLISHABLE_STATUSES.includes(course.status)) {
    return { error: "This course cannot be published from its current state." };
  }

  const readiness = await getCoursePublishReadiness(courseId);
  if (!readiness.ready) {
    return { error: readiness.blockers[0] };
  }

  const previousStatus = course.status;
  await cascadeRequiredPublishContent(courseId);

  const published = await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "published",
      staffReviewNotes: null,
      reviewedAt: new Date(),
      reviewedByUserId: user.id,
    },
    include: {
      lessons: { where: { status: "published" }, select: { id: true } },
      quizzes: {
        where: { lessonId: null },
        include: { _count: { select: { questions: true } } },
      },
      badge: { select: { id: true } },
    },
  });

  const finalQuiz = published.quizzes[0];
  trackEventFireAndForget({
    eventName: "partner_course_published",
    source: "server_action",
    path: projectCoursePath(productId, courseId),
    userId: user.id,
    courseId,
    courseSlug: published.slug,
    ecosystemProjectId: productId,
    ecosystemProjectSlug: course.product.slug,
    metadata: {
      partnerUserId: user.id,
      previousStatus,
      publishedLessonCount: published.lessons.length,
      hasFinalQuiz: Boolean(finalQuiz),
      questionCount: finalQuiz?._count.questions ?? 0,
      hasBadge: Boolean(published.badge),
      readinessWarningCount: readiness.warnings.length,
    },
  });

  revalidatePartnerCourse(productId, courseId, {
    productSlug: course.product.slug,
    courseSlug: published.slug,
  });
  return { ok: true };
}

export async function unpublishPartnerCourse(
  productId: string,
  courseId: string
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const course = await prisma.course.findFirst({
    where: { id: courseId, productId },
    include: { product: { select: { slug: true } } },
  });
  if (!course) return { error: "Course not found." };

  if (course.status !== "published") {
    return { error: "Only published courses can be unpublished." };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "partner_draft" },
  });

  revalidatePartnerCourse(productId, courseId, {
    productSlug: course.product.slug,
    courseSlug: course.slug,
  });
  return { ok: true };
}

export async function returnPartnerCourseToDraft(
  productId: string,
  courseId: string
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const course = await prisma.course.findFirst({
    where: { id: courseId, productId },
  });
  if (!course) return { error: "Course not found." };

  if (
    course.status !== "staff_changes_requested" &&
    course.status !== "submitted_for_review" &&
    course.status !== "approved"
  ) {
    return {
      error: "Only courses in review can return to draft.",
    };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "partner_draft", staffReviewNotes: null },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}
