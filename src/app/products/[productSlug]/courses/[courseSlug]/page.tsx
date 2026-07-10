import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock,
  BookOpen,
  Award,
  Wallet,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/level-badge";
import { CourseStartPanel } from "@/components/course-start-panel";
import { CoursePrerequisites } from "@/components/course-prerequisites";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrackView } from "@/components/analytics/track-view";
import { formatDuration } from "@/lib/utils";
import { CourseModuleOutline } from "@/components/course-module-outline";
import {
  getCourseBySlugs,
  getFinalQuiz,
  getPublishedCoursePrerequisites,
  buildCourseModuleOutline,
} from "@/lib/courses";
import { getCourseCompletionState } from "@/lib/course-completion";
import { getCurrentUser } from "@/lib/session";
import { productPath, coursePath } from "@/lib/paths";
import { getCourseTypeBadgeVariant } from "@/lib/badge-colors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string; courseSlug: string }>;
}): Promise<Metadata> {
  const { productSlug, courseSlug } = await params;
  const course = await getCourseBySlugs(productSlug, courseSlug);
  if (course) return { title: course.title, description: course.summary };
  return { title: "Course" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string; courseSlug: string }>;
}) {
  const { productSlug, courseSlug } = await params;
  const course = await getCourseBySlugs(productSlug, courseSlug);
  if (!course || course.status !== "published") notFound();

  const prerequisites = await getPublishedCoursePrerequisites(
    course.prerequisiteCourseIds
  );

  const user = await getCurrentUser();
  const finalQuiz = getFinalQuiz(course.quizzes);

  const state = user
    ? await getCourseCompletionState(user.id, course.id)
    : null;

  const pct = state?.progress.pct ?? 0;

  const nextLesson =
    course.lessons.find((l) => !state?.completedLessonIds.has(l.id)) ??
    course.lessons[0];

  const pagePath = coursePath(productSlug, courseSlug);
  const moduleGroups = buildCourseModuleOutline(course);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <TrackView
        eventName="course_detail_viewed"
        path={pagePath}
        ecosystemProjectId={course.product.id}
        ecosystemProjectSlug={course.product.slug}
        courseId={course.id}
        courseSlug={course.slug}
        metadata={{
          courseLevel: course.level,
          estimatedDuration: course.estimatedDuration,
          lessonCount: course.lessons.length,
          hasFinalQuiz: Boolean(finalQuiz),
          hasBadge: Boolean(course.badge),
          prerequisiteCount: prerequisites.length,
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Ecosystem Projects", href: "/products" },
          { label: course.product.name, href: productPath(course.product.slug) },
          { label: course.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {course.product.name}
          </span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {course.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LevelBadge level={course.level} />
            <Badge variant={getCourseTypeBadgeVariant(course.courseType)}>
              <Clock />
              {formatDuration(course.estimatedDuration)}
            </Badge>
            <Badge variant="muted">
              <BookOpen />
              {course.lessons.length} lesson
              {course.lessons.length === 1 ? "" : "s"}
            </Badge>
            {course.badge && (
              <Badge variant="certification">
                <Award />
                Earns a badge
              </Badge>
            )}
          </div>

          <CoursePrerequisites prerequisites={prerequisites} />

          {course.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">About this course</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {course.description}
              </p>
            </div>
          )}

          {course.learningOutcomes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">What you&apos;ll learn</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {course.learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Course content</h2>
            <div className="mt-3">
              <CourseModuleOutline
                groups={moduleGroups}
                completedLessonIds={state?.completedLessonIds ?? new Set()}
                finalQuiz={finalQuiz}
                finalQuizPassed={state?.progress.finalQuizPassed}
                locked={!user}
                renderLessonLabel={(lesson, index) => (
                  <>
                    <span className="text-muted-foreground">
                      Lesson {index + 1}:{" "}
                    </span>
                    {lesson.title}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] w-full bg-media-placeholder">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="size-10 text-muted-foreground/60" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-5 p-5">
                {state && state.startedAt && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium">Your progress</span>
                      <span className="font-medium text-xp">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )}

                <CourseStartPanel
                  courseId={course.id}
                  productSlug={course.product.slug}
                  courseSlug={course.slug}
                  ecosystemProjectId={course.product.id}
                  isAuthed={Boolean(user)}
                  started={Boolean(state?.startedAt)}
                  completed={Boolean(state?.completed)}
                  nextLessonId={nextLesson?.id ?? null}
                />

                <Separator />

                <ul className="space-y-3 text-sm">
                  <li className="flex min-w-0 items-center justify-between gap-3">
                    <span className="shrink-0 text-muted-foreground">
                      Ecosystem Project
                    </span>
                    <span className="min-w-0 truncate text-right font-medium">
                      {course.product.name}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium capitalize">{course.level}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Estimated time</span>
                    <span className="font-medium">
                      {formatDuration(course.estimatedDuration)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">{course.lessons.length}</span>
                  </li>
                  {course.badge && (
                    <li className="flex min-w-0 items-center justify-between gap-3">
                      <span className="shrink-0 text-muted-foreground">Reward</span>
                      <span className="flex min-w-0 items-center gap-1 truncate font-medium">
                        <Award className="size-4 shrink-0 text-warning" />
                        <span className="truncate">{course.badge.name}</span>
                      </span>
                    </li>
                  )}
                </ul>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Wallet className="mt-0.5 size-4 shrink-0" />
                  <span>
                    A connected Solana wallet is required to track progress,
                    take quizzes, and earn the badge.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
