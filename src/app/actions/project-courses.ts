"use server";

import type { CourseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";
import { getPartnerSubmitReadiness } from "@/lib/partner-submit-readiness";
import { prisma } from "@/lib/prisma";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function projectCoursesPath(productId: string) {
  return `/partner-console/${productId}/courses`;
}

function projectCoursePath(productId: string, courseId: string) {
  return `${projectCoursesPath(productId)}/${courseId}`;
}

function revalidatePartnerCourse(productId: string, courseId: string) {
  revalidatePath(projectCoursesPath(productId));
  revalidatePath(projectCoursePath(productId, courseId));
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin");
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

export async function submitPartnerCourseForReview(
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

  if (
    course.status !== "partner_draft" &&
    course.status !== "staff_changes_requested"
  ) {
    return { error: "This course cannot be submitted for review right now." };
  }

  const readiness = await getPartnerSubmitReadiness(courseId);
  if (!readiness.ready) {
    return { error: readiness.blockers[0] };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "submitted_for_review",
      submittedForReviewAt: new Date(),
      reviewRequestedByUserId: user.id,
      staffReviewNotes: null,
    },
  });

  trackEventFireAndForget({
    eventName: "partner_course_submitted_for_review",
    source: "server_action",
    path: projectCoursePath(productId, courseId),
    userId: user.id,
    courseId,
    courseSlug: course.slug,
    ecosystemProjectId: productId,
    ecosystemProjectSlug: course.product.slug,
    metadata: { partnerUserId: user.id },
  });

  revalidatePartnerCourse(productId, courseId);
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

  if (course.status !== "staff_changes_requested") {
    return { error: "Only courses with requested changes can return to draft." };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: "partner_draft" },
  });

  revalidatePartnerCourse(productId, courseId);
  return { ok: true };
}
