"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { coursePath, productPath } from "@/lib/paths";
import {
  cascadeRequiredPublishContent,
  getCoursePublishReadiness,
} from "@/lib/publish-readiness";
import { authorizeStaff, toActionError } from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

export async function setCourseStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

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

  if (status === "published" && current.status !== "published") {
    await cascadeRequiredPublishContent(id);
  }

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
    const staff = auth.user;
    const finalQuiz = course.quizzes[0];
    trackEventFireAndForget({
      eventName:
        current.status === "approved"
          ? "staff_partner_course_published"
          : "admin_course_published",
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

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath("/products");
  revalidatePath(productPath(course.product.slug));
  revalidatePath(coursePath(course.product.slug, course.slug));
  return { ok: true };
}

export async function requestPartnerChanges(
  courseId: string,
  notes: string
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

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

  const staff = auth.user;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "staff_changes_requested",
      staffReviewNotes: trimmed,
      reviewedAt: new Date(),
      reviewedByUserId: staff.id,
    },
  });

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

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/partner-console/${course.product.id}/courses/${courseId}`);
  return { ok: true };
}

export async function approvePartnerCourse(courseId: string): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: { select: { id: true, slug: true } } },
  });
  if (!course) return { error: "Course not found." };
  if (course.status !== "submitted_for_review") {
    return { error: "Only submitted courses can be approved." };
  }

  const staff = auth.user;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewedByUserId: staff.id,
      staffReviewNotes: null,
    },
  });

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

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/partner-console/${course.product.id}/courses/${courseId}`);
  return { ok: true };
}

export async function publishApprovedCourse(courseId: string): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

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
