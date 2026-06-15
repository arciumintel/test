import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, HelpCircle, ChevronLeft } from "lucide-react";
import { LessonContent } from "@/components/lesson-content";
import { LessonActions } from "@/components/lesson-actions";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getCourseBySlugs, getFinalQuiz } from "@/lib/courses";
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

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <Link
          href={courseHref}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {course.title}
        </Link>
        <nav className="overflow-hidden rounded-xl border">
          {course.lessons.map((l) => {
            const done = completedSet.has(l.id);
            const active = l.id === lessonId;
            return (
              <Link
                key={l.id}
                href={lessonPath(productSlug, courseSlug, l.id)}
                className={cn(
                  "flex items-center gap-2.5 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0",
                  active ? "bg-accent font-medium" : "hover:bg-muted/50"
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="line-clamp-2">{l.title}</span>
              </Link>
            );
          })}
          {finalQuiz && (
            <Link
              href={quizPath(productSlug, courseSlug)}
              className="flex items-center gap-2.5 bg-muted/40 px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
            >
              <HelpCircle className="size-4 shrink-0 text-primary" />
              Final quiz
            </Link>
          )}
        </nav>
      </aside>

      <article className="min-w-0">
        <Breadcrumbs
          items={[
            { label: "Ecosystem Projects", href: "/products" },
            { label: course.product.name, href: productPath(course.product.slug) },
            { label: course.title, href: courseHref },
            { label: lesson.title },
          ]}
        />
        <p className="text-sm font-medium text-muted-foreground">
          Lesson {lessonIndex + 1} of {course.lessons.length}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
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

        <Separator className="my-8" />

        <div className="flex items-center justify-between gap-4">
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
          <p className="mt-4 text-right text-xs text-muted-foreground">
            Completing this lesson finishes the course.
          </p>
        )}
      </article>
    </div>
  );
}
