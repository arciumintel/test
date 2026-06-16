import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Pencil,
  AlertTriangle,
  PackageOpen,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CourseStatusControls } from "@/components/admin/course-status-controls";
import { prisma } from "@/lib/prisma";
import { getPlatformSummary } from "@/lib/analytics";
import type { CourseStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admin" };

const STATUS_VARIANT: Record<
  CourseStatus,
  "success" | "muted" | "secondary"
> = {
  published: "success",
  draft: "secondary",
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
  let summary: { learners: number; published: number; completions: number; badges: number };
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage official Arcademy courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              <PackageOpen />
              Ecosystem Projects
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/partner-intake">
              <ClipboardList />
              Partner intake
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus />
              New course
            </Link>
          </Button>
        </div>
      </div>

      {dbError && (
        <Alert variant="warning" className="mt-6">
          <AlertTriangle />
          <AlertTitle>Database not reachable</AlertTitle>
          <AlertDescription>
            Set <code>DATABASE_URL</code> in <code>.env</code> and run{" "}
            <code>pnpm db:push</code> to initialize the schema.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Learners" value={summary.learners} icon={Users} />
        <SummaryStat
          label="Published courses"
          value={summary.published}
          icon={BookOpen}
        />
        <SummaryStat
          label="Course completions"
          value={summary.completions}
          icon={GraduationCap}
        />
        <SummaryStat label="Badges defined" value={summary.badges} icon={Award} />
      </div>

      {/* Courses */}
      <h2 className="mt-10 text-lg font-semibold">All courses</h2>
      <div className="mt-4 space-y-3">
        {courses.length === 0 && !dbError && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first course to get started.
            </p>
          </div>
        )}
        {courses.map((course) => (
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
                  <Badge variant={STATUS_VARIANT[course.status]} className="capitalize">
                    {course.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {course._count.lessons} lessons · {course._count.badgeAwards}{" "}
                  badges awarded · {course.product.name}
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
        ))}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
