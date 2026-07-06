import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CourseEditorTabs } from "@/components/admin/course-editor-tabs";
import { PartnerCourseStatusControls } from "@/components/partner-console/partner-course-status-controls";
import { getCourseAnalytics } from "@/lib/analytics";
import { formatCourseStatus } from "@/lib/course-status";
import { prisma } from "@/lib/prisma";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string; courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  return { title: course ? `Edit: ${course.title}` : "Edit course draft" };
}

export default async function PartnerCourseEditorPage({
  params,
}: {
  params: Promise<{ productId: string; courseId: string }>;
}) {
  const { productId, courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId, productId },
    include: {
      product: true,
      lessons: { orderBy: { order: "asc" } },
      modules: { orderBy: { order: "asc" } },
      badge: true,
      quizzes: {
        where: { lessonId: null },
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const analytics = await getCourseAnalytics(course.id);
  const finalQuiz = course.quizzes[0] ?? null;
  const prerequisiteOptions = await prisma.course.findMany({
    where: { productId, id: { not: course.id } },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <Link
        href={`/partner-console/${productId}/courses`}
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Course drafts
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <Badge variant={STATUS_VARIANT[course.status]}>
              {formatCourseStatus(course.status)}
            </Badge>
          </div>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Partner course draft for {course.product.name}
          </p>
        </div>
        <PartnerCourseStatusControls
          productId={productId}
          courseId={course.id}
          status={course.status}
        />
      </div>

      {course.staffReviewNotes && (
        <Alert className="mt-4" variant="warning">
          <AlertDescription>
            <span className="font-medium">Staff feedback:</span>{" "}
            {course.staffReviewNotes}
          </AlertDescription>
        </Alert>
      )}

      {course.status === "submitted_for_review" && (
        <Alert className="mt-4">
          <AlertDescription>
            This course is with Arcademy staff for review. You cannot edit it
            until staff requests changes or publishes it.
          </AlertDescription>
        </Alert>
      )}

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
        products={[
          {
            id: course.product.id,
            name: course.product.name,
            status: course.product.status,
          },
        ]}
        prerequisiteOptions={prerequisiteOptions}
        variant="partner"
        partnerProductId={productId}
        courseStatus={course.status}
      />
    </>
  );
}
