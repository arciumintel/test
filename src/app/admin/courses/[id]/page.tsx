import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { CourseStatusControls } from "@/components/admin/course-status-controls";
import { StaffPartnerReviewControls } from "@/components/admin/staff-partner-review-controls";
import { PublishReadinessPanel } from "@/components/admin/publish-readiness-panel";
import { CourseEditorTabs } from "@/components/admin/course-editor-tabs";
import { prisma } from "@/lib/prisma";
import { getCourseAnalytics } from "@/lib/analytics";
import {
  getAttemptsBeforePass,
  getQuizDiagnostics,
} from "@/lib/quiz-diagnostics";
import { getCoursePublishReadiness } from "@/lib/publish-readiness";
import { coursePath } from "@/lib/paths";
import { formatCourseStatus } from "@/lib/course-status";
import type { CourseStatus } from "@prisma/client";

const STATUS_VARIANT: Record<
  CourseStatus,
  "success" | "muted" | "secondary" | "default"
> = {
  published: "success",
  draft: "secondary",
  partner_draft: "secondary",
  submitted_for_review: "default",
  staff_changes_requested: "default",
  approved: "secondary",
  archived: "muted",
};

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let course;
  let products;
  let readiness;
  let analytics;
  let prerequisiteOptions;
  let lessonQuizzes;
  let quizDiagnostics;
  let attemptsBeforePass;

  try {
    [course, products, readiness] = await Promise.all([
      prisma.course.findUnique({
        where: { id },
        include: {
          product: true,
          lessons: { orderBy: { order: "asc" } },
          modules: { orderBy: { order: "asc" } },
          badge: true,
          quizzes: {
            where: { lessonId: null },
            include: { questions: { orderBy: { order: "asc" } } },
          },
          reviewRequestedBy: { select: { walletAddress: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, status: true },
      }),
      getCoursePublishReadiness(id),
    ]);
  } catch {
    return (
      <>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Dashboard
        </Link>
        <HomeSectionLoadError
          title="Course editor did not load"
          description="Course data is unavailable right now. Refresh the page, or return to the dashboard and try again."
        />
      </>
    );
  }

  if (!course) notFound();

  try {
    [analytics, prerequisiteOptions, lessonQuizzes, quizDiagnostics, attemptsBeforePass] =
      await Promise.all([
      getCourseAnalytics(course.id),
      prisma.course.findMany({
        where: { productId: course.productId, id: { not: course.id } },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
      prisma.quiz.findMany({
        where: { courseId: course.id, lessonId: { not: null } },
        include: { questions: { orderBy: { order: "asc" } } },
      }),
      getQuizDiagnostics(course.id),
      getAttemptsBeforePass(course.id),
    ]);
  } catch {
    return (
      <>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Dashboard
        </Link>
        <HomeSectionLoadError
          title="Course editor did not load"
          description="Course data is unavailable right now. Refresh the page, or return to the dashboard and try again."
        />
      </>
    );
  }

  const finalQuiz = course.quizzes[0] ?? null;
  const lessonQuizMap = Object.fromEntries(
    (lessonQuizzes ?? [])
      .filter((q) => q.lessonId)
      .map((q) => [
        q.lessonId as string,
        {
          id: q.id,
          title: q.title,
          passThreshold: q.passThreshold,
          description: q.description,
          status: q.status,
          questions: q.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            answerOptions: question.answerOptions,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          })),
        },
      ])
  );

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-balance text-2xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <Badge variant={STATUS_VARIANT[course.status]}>
              {formatCourseStatus(course.status)}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /products/{course.product.slug}/courses/{course.slug}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild aria-label="Preview course">
            <Link
              href={coursePath(course.product.slug, course.slug)}
              target="_blank"
            >
              <Eye />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </Button>
          <StaffPartnerReviewControls
            courseId={course.id}
            status={course.status}
          />
          <CourseStatusControls courseId={course.id} status={course.status} />
        </div>
      </div>

      {course.staffReviewNotes && (
        <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <span className="font-medium">Staff review notes:</span>{" "}
          {course.staffReviewNotes}
        </p>
      )}

      {course.status === "submitted_for_review" &&
        course.submittedForReviewAt && (
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            Submitted for review on{" "}
            {new Date(course.submittedForReviewAt).toLocaleString()}
            {course.reviewRequestedBy
              ? ` by ${course.reviewRequestedBy.walletAddress.slice(0, 4)}…${course.reviewRequestedBy.walletAddress.slice(-4)}`
              : ""}
            .
          </p>
        )}

      <PublishReadinessPanel
        report={readiness}
        status={course.status}
        entityLabel="course"
      />

      <CourseEditorTabs
        course={{
          id: course.id,
          title: course.title,
          productId: course.productId,
          summary: course.summary,
          description: course.description,
          level: course.level,
          courseType: course.courseType,
          thumbnailUrl: course.thumbnailUrl,
          estimatedDuration: course.estimatedDuration,
          learningOutcomes: course.learningOutcomes,
          prerequisiteCourseIds: course.prerequisiteCourseIds,
        }}
        lessons={course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          status: l.status,
          content: l.content,
          mediaUrl: l.mediaUrl,
          required: l.required,
          estimatedDuration: l.estimatedDuration,
          moduleId: l.moduleId,
        }))}
        modules={course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          order: m.order,
        }))}
        lessonQuizzes={lessonQuizMap}
        quiz={
          finalQuiz
            ? {
                id: finalQuiz.id,
                title: finalQuiz.title,
                passThreshold: finalQuiz.passThreshold,
                description: finalQuiz.description,
                status: finalQuiz.status,
                questions: finalQuiz.questions.map((q) => ({
                  id: q.id,
                  prompt: q.prompt,
                  answerOptions: q.answerOptions,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                })),
              }
            : null
        }
        badge={
          course.badge
            ? {
                name: course.badge.name,
                description: course.badge.description,
                imageUrl: course.badge.imageUrl,
                criteria: course.badge.criteria,
                issuer: course.badge.issuer,
                status: course.badge.status,
              }
            : null
        }
        analytics={analytics}
        quizDiagnostics={quizDiagnostics}
        attemptsBeforePass={attemptsBeforePass}
        products={products}
        prerequisiteOptions={prerequisiteOptions}
      />
    </>
  );
}
