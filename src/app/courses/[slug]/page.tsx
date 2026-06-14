import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock,
  BookOpen,
  Award,
  Wallet,
  CheckCircle2,
  Circle,
  Lock,
  HelpCircle,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/level-badge";
import { CourseStartPanel } from "@/components/course-start-panel";
import { formatDuration } from "@/lib/utils";
import {
  getCourseBySlug,
  getFinalQuiz,
  getLearnerCourseState,
} from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await getCourseBySlug(slug);
    if (course) return { title: course.title, description: course.summary };
  } catch {
    /* ignore */
  }
  return { title: "Course" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let course;
  try {
    course = await getCourseBySlug(slug);
  } catch {
    course = null;
  }
  if (!course || course.status !== "published") notFound();

  const user = await getCurrentUser();
  const finalQuiz = getFinalQuiz(course.quizzes);

  const state = user
    ? await getLearnerCourseState(user.id, course.id, finalQuiz?.id ?? null)
    : null;

  const completedCount = state
    ? course.lessons.filter((l) => state.completedLessonIds.has(l.id)).length
    : 0;
  const totalSteps = course.lessons.length + (finalQuiz ? 1 : 0);
  const doneSteps = completedCount + (state?.finalQuizPassed ? 1 : 0);
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const nextLesson =
    course.lessons.find((l) => !state?.completedLessonIds.has(l.id)) ??
    course.lessons[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          {course.partnerName && (
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {course.partnerName}
            </span>
          )}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {course.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LevelBadge level={course.level} />
            <Badge variant="muted">
              <Clock />
              {formatDuration(course.estimatedDuration)}
            </Badge>
            <Badge variant="muted">
              <BookOpen />
              {course.lessons.length} lesson
              {course.lessons.length === 1 ? "" : "s"}
            </Badge>
            {course.badge && (
              <Badge variant="default">
                <Award />
                Earns a badge
              </Badge>
            )}
          </div>

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

          {/* Lessons */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold">Course content</h2>
            <div className="mt-3 overflow-hidden rounded-xl border">
              {course.lessons.map((lesson, i) => {
                const done = state?.completedLessonIds.has(lesson.id);
                const locked = !user;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : locked ? (
                      <Lock className="size-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-sm">
                      <span className="text-muted-foreground">
                        Lesson {i + 1}:{" "}
                      </span>
                      {lesson.title}
                    </span>
                  </div>
                );
              })}
              {finalQuiz && (
                <div className="flex items-center gap-3 bg-muted/40 px-4 py-3">
                  {state?.finalQuizPassed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" />
                  ) : (
                    <HelpCircle className="size-5 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 text-sm font-medium">
                    Final quiz
                    <span className="ml-2 font-normal text-muted-foreground">
                      Pass at {finalQuiz.passThreshold}% to complete
                    </span>
                  </span>
                </div>
              )}
              {course.lessons.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Lessons are being prepared for this course.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-primary/15 via-accent to-secondary">
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
                    <BookOpen className="size-10 text-primary/40" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-5 p-5">
                {state && state.startedAt && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium">Your progress</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )}

                <CourseStartPanel
                  courseId={course.id}
                  slug={course.slug}
                  isAuthed={Boolean(user)}
                  started={Boolean(state?.startedAt)}
                  completed={Boolean(state?.badgeAwarded) || (totalSteps > 0 && doneSteps === totalSteps)}
                  nextLessonId={nextLesson?.id ?? null}
                />

                <Separator />

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium capitalize">
                      {course.level}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated time</span>
                    <span className="font-medium">
                      {formatDuration(course.estimatedDuration)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">{course.lessons.length}</span>
                  </li>
                  {course.badge && (
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reward</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Award className="size-4 text-primary" />
                        {course.badge.name}
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
