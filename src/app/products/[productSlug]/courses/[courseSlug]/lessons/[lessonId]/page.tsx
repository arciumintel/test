import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LessonContent } from "@/components/lesson-content";
import { LessonActions } from "@/components/lesson-actions";
import {
  LessonOutlineMobile,
  LessonOutlineSidebar,
} from "@/components/lesson-outline";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrackView } from "@/components/analytics/track-view";
import { Separator } from "@/components/ui/separator";
import { getCourseBySlugs, getFinalQuiz, buildCourseModuleOutline } from "@/lib/courses";
import { toLearnerQuestion } from "@/lib/question-types";
import { KnowledgeCheckRunner } from "@/components/knowledge-check-runner";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { coursePath, lessonPath, productPath, quizPath } from "@/lib/paths";

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    productSlug: string;
    courseSlug: string;
    lessonId: string;
  }>;
}) {
  const { productSlug, courseSlug, lessonId } = await params;
  const courseHref = coursePath(productSlug, courseSlug);

  const user = await getCurrentUser();
  if (!user) redirect(courseHref);

  const course = await getCourseBySlugs(productSlug, courseSlug);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) notFound();
  const lesson = course.lessons[lessonIndex];

  const finalQuiz = getFinalQuiz(course.quizzes);

  const knowledgeCheckQuiz = await prisma.quiz.findFirst({
    where: {
      lessonId,
      courseId: course.id,
      status: "published",
      type: "lesson_knowledge_check",
    },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  const progress = await prisma.progress.findMany({
    where: { userId: user.id, courseId: course.id },
    select: { lessonId: true, completed: true },
  });
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lessonId)
  );

  const isLast = lessonIndex === course.lessons.length - 1;
  const nextLesson = course.lessons[lessonIndex + 1];

  let nextHref: string;
  let nextLabel: string;
  if (nextLesson) {
    nextHref = lessonPath(productSlug, courseSlug, nextLesson.id);
    nextLabel = "Next lesson";
  } else if (finalQuiz) {
    nextHref = quizPath(productSlug, courseSlug);
    nextLabel = "Go to quiz";
  } else {
    nextHref = courseHref;
    nextLabel = "Finish";
  }

  const lessonPagePath = lessonPath(productSlug, courseSlug, lessonId);

  const outlineProps = {
    courseHref,
    courseTitle: course.title,
    productSlug,
    courseSlug,
    groups: buildCourseModuleOutline(course),
    lessons: course.lessons.map((l) => ({ id: l.id, title: l.title })),
    activeLessonId: lessonId,
    completedLessonIds: completedSet,
    hasFinalQuiz: Boolean(finalQuiz),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <TrackView
        eventName="lesson_viewed"
        path={lessonPagePath}
        ecosystemProjectId={course.product.id}
        ecosystemProjectSlug={course.product.slug}
        courseId={course.id}
        courseSlug={course.slug}
        lessonId={lesson.id}
        metadata={{
          lessonOrder: lesson.order,
          isCompleted: completedSet.has(lesson.id),
        }}
      />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <LessonOutlineSidebar {...outlineProps} />

        <article className="min-w-0">
          <LessonOutlineMobile {...outlineProps} />

          <Breadcrumbs
            items={[
              { label: "Ecosystem Projects", href: "/products" },
              {
                label: course.product.name,
                href: productPath(course.product.slug),
              },
              { label: course.title, href: courseHref },
              { label: lesson.title },
            ]}
          />
          <p className="text-sm font-medium text-muted-foreground">
            Lesson {lessonIndex + 1} of {course.lessons.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>

          {lesson.mediaUrl && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
              <Image
                src={lesson.mediaUrl}
                alt={lesson.title}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-6">
            <LessonContent content={lesson.content} />
          </div>

          {knowledgeCheckQuiz && knowledgeCheckQuiz.questions.length > 0 && (
            <section className="mt-10" aria-labelledby="knowledge-check-heading">
              <h2
                id="knowledge-check-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Check your understanding
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional. Does not affect your badge or course completion.
              </p>
              <div className="mt-4">
                <KnowledgeCheckRunner
                  quizId={knowledgeCheckQuiz.id}
                  courseId={course.id}
                  courseSlug={course.slug}
                  lessonId={lesson.id}
                  ecosystemProjectId={course.product.id}
                  ecosystemProjectSlug={course.product.slug}
                  passThreshold={knowledgeCheckQuiz.passThreshold}
                  questions={knowledgeCheckQuiz.questions.map(toLearnerQuestion)}
                  lessonPath={lessonPagePath}
                />
              </div>
            </section>
          )}

          <Separator className="my-8" />

          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            {lessonIndex > 0 ? (
              <Link
                href={lessonPath(
                  productSlug,
                  courseSlug,
                  course.lessons[lessonIndex - 1].id
                )}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            ) : (
              <span />
            )}
            <LessonActions
              lessonId={lesson.id}
              alreadyComplete={completedSet.has(lesson.id)}
              nextHref={nextHref}
              nextLabel={nextLabel}
            />
          </div>
          {isLast && !finalQuiz && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              This is the last lesson in the course.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}
