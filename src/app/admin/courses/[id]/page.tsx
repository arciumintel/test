import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseStatusControls } from "@/components/admin/course-status-controls";
import { PublishReadinessPanel } from "@/components/admin/publish-readiness-panel";
import { CourseEditorTabs } from "@/components/admin/course-editor-tabs";
import { prisma } from "@/lib/prisma";
import { getCourseAnalytics } from "@/lib/analytics";
import { getCoursePublishReadiness } from "@/lib/publish-readiness";
import { coursePath } from "@/lib/paths";
import type { CourseStatus } from "@prisma/client";

const STATUS_VARIANT: Record<CourseStatus, "success" | "muted" | "secondary"> = {
  published: "success",
  draft: "secondary",
  archived: "muted",
};

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, products, readiness] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        product: true,
        lessons: { orderBy: { order: "asc" } },
        badge: true,
        quizzes: {
          where: { lessonId: null },
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
    getCoursePublishReadiness(id),
  ]);

  if (!course) notFound();

  const analytics = await getCourseAnalytics(course.id);
  const finalQuiz = course.quizzes[0] ?? null;
  const prerequisiteOptions = await prisma.course.findMany({
    where: { productId: course.productId, id: { not: course.id } },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <Badge
              variant={STATUS_VARIANT[course.status]}
              className="capitalize"
            >
              {course.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /products/{course.product.slug}/courses/{course.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={coursePath(course.product.slug, course.slug)}
              target="_blank"
            >
              <Eye />
              Preview
            </Link>
          </Button>
          <CourseStatusControls courseId={course.id} status={course.status} />
        </div>
      </div>

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
        products={products}
        prerequisiteOptions={prerequisiteOptions}
      />
    </div>
  );
}
