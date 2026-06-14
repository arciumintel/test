import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BadgeMedallion } from "@/components/badge-medallion";
import { DisplayNameForm } from "@/components/display-name-form";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { shortWallet, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My learning" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/courses");

  const [awards, progressRows, passedAttempts] = await Promise.all([
    prisma.badgeAward.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
      include: { badge: true, course: { select: { slug: true, title: true } } },
    }),
    prisma.progress.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            _count: { select: { lessons: { where: { status: "published" } } } },
            quizzes: { where: { lessonId: null }, select: { id: true } },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id, passed: true },
      select: { quizId: true },
    }),
  ]);

  const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
  const awardedCourseIds = new Set(awards.map((a) => a.courseId));

  // Group progress by course.
  type CourseAgg = {
    slug: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    finalQuizId: string | null;
    completed: boolean;
  };
  const byCourse = new Map<string, CourseAgg>();
  for (const row of progressRows) {
    const c = row.course;
    if (c.status !== "published") continue;
    let agg = byCourse.get(c.id);
    if (!agg) {
      agg = {
        slug: c.slug,
        title: c.title,
        totalLessons: c._count.lessons,
        completedLessons: 0,
        finalQuizId: c.quizzes[0]?.id ?? null,
        completed: awardedCourseIds.has(c.id),
      };
      byCourse.set(c.id, agg);
    }
    if (row.completed) agg.completedLessons += 1;
  }

  const courses = [...byCourse.values()].map((c) => {
    const quizDone = c.finalQuizId ? passedQuizIds.has(c.finalQuizId) : true;
    const totalSteps = c.totalLessons + (c.finalQuizId ? 1 : 0);
    const doneSteps = c.completedLessons + (quizDone && c.finalQuizId ? 1 : 0);
    const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
    return { ...c, pct };
  });

  const inProgress = courses.filter((c) => !c.completed && c.pct < 100);
  const completed = courses.filter((c) => c.completed || c.pct >= 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </span>
          <div>
            <DisplayNameForm initialName={user.displayName} />
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {shortWallet(user.walletAddress, 6)}
            </p>
          </div>
        </div>
        <div className="flex gap-6">
          <Stat label="Badges" value={awards.length} icon={Award} />
          <Stat label="Completed" value={completed.length} icon={GraduationCap} />
          <Stat label="In progress" value={inProgress.length} icon={BookOpen} />
        </div>
      </div>

      <Separator className="my-8" />

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold">Badges earned</h2>
        {awards.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {awards.map((award) => (
              <Card key={award.id}>
                <CardContent className="flex items-center gap-4 py-5">
                  <BadgeMedallion
                    name={award.badge.name}
                    imageUrl={award.badge.imageUrl}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{award.badge.name}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {award.course.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Earned {formatDate(award.awardedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <Award className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No badges yet. Complete a course to earn your first one.
            </p>
          </div>
        )}
      </section>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Continue learning</h2>
          <div className="mt-4 space-y-3">
            {inProgress.map((c) => (
              <CourseProgressRow key={c.slug} {...c} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Completed courses</h2>
          <div className="mt-4 space-y-3">
            {completed.map((c) => (
              <CourseProgressRow key={c.slug} {...c} />
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && (
        <section className="mt-10 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">You haven&apos;t started a course yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the catalog and start learning.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Browse courses
            <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-2xl font-semibold">
        <Icon className="size-5 text-primary" />
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CourseProgressRow({
  slug,
  title,
  pct,
  completed,
}: {
  slug: string;
  title: string;
  pct: number;
  completed: boolean;
}) {
  return (
    <Link href={`/courses/${slug}`} className="block">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{title}</p>
              {completed && (
                <Badge variant="success">
                  <Award />
                  Complete
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={pct} className="max-w-xs" />
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
