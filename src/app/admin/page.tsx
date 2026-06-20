import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { CourseStatusControls } from "@/components/admin/course-status-controls";
import { prisma } from "@/lib/prisma";
import { getPlatformSummary } from "@/lib/analytics";
import { formatCourseStatus } from "@/lib/course-status";
import type { CourseStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admin" };

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

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  product: { name: string; slug: string };
  status: CourseStatus;
  _count: { lessons: number; badgeAwards: number };
};

export default async function AdminDashboard() {
  let courses: AdminCourse[] = [];
  let summary: {
    learners: number;
    published: number;
    completions: number;
    badges: number;
  };
  let dbError = false;
  try {
    [courses, summary] = await Promise.all([
      prisma.course.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          product: { select: { name: true, slug: true } },
          _count: {
            select: { lessons: true, badgeAwards: true },
          },
        },
      }),
      getPlatformSummary(),
    ]);
  } catch {
    dbError = true;
    courses = [];
    summary = { learners: 0, published: 0, completions: 0, badges: 0 };
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Create and manage official Arcademy courses.
          </p>
          {!dbError && (
            <p className="mt-2 text-pretty text-sm text-muted-foreground">
              {summary.learners} learners · {summary.published} published ·{" "}
              {summary.completions} completions · {summary.badges} badges
              defined
            </p>
          )}
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/courses/new">
            <Plus />
            New course
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="mt-8">
          <HomeSectionLoadError
            title="Dashboard did not load"
            description="Course data is unavailable right now. Refresh the page, or check DATABASE_URL and run pnpm db:push if this is a new environment."
          />
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-lg font-semibold tracking-tight">
            All courses ({courses.length})
          </h2>
          <div className="mt-4 space-y-3">
            {courses.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
                <BookOpen
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-3 font-medium">No courses yet</p>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">
                  Create your first course to get started.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/admin/courses/new">New course</Link>
                </Button>
              </div>
            ) : (
              courses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="truncate font-medium hover:text-primary"
                        >
                          {course.title}
                        </Link>
                        <Badge variant={STATUS_VARIANT[course.status]}>
                          {formatCourseStatus(course.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course._count.lessons} lessons ·{" "}
                        {course._count.badgeAwards} badges awarded ·{" "}
                        {course.product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/courses/${course.id}`}>
                          <Pencil />
                          Edit
                        </Link>
                      </Button>
                      <CourseStatusControls
                        courseId={course.id}
                        status={course.status}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
