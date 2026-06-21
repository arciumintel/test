import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { listPartnerCourses } from "@/app/actions/project-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { formatCourseStatus } from "@/lib/course-status";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  return { title: product ? `Courses: ${product.name}` : "Course drafts" };
}

export default async function PartnerCoursesPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });
  if (!product) notFound();

  const result = await listPartnerCourses(productId);
  if ("error" in result) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Course drafts
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Create and submit courses for Arcademy staff review.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <HomeSectionLoadError
            title="Course drafts did not load"
            description="The draft list is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        </div>
      </>
    );
  }

  const courses = result.courses;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Course drafts
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Create and submit courses for Arcademy staff review.
          </p>
        </div>
        <Button asChild>
          <Link href={`/partner-console/${productId}/courses/new`}>
            <Plus className="size-4" />
            Create course draft
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">No course drafts yet</p>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Create your first draft to get started.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href={`/partner-console/${productId}/courses/new`}>
                  Create course draft
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/partner-console/${productId}/courses/${course.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {course.title}
                    </Link>
                    <Badge variant="secondary">
                      {formatCourseStatus(course.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course._count.lessons} lessons · Updated{" "}
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/partner-console/${productId}/courses/${course.id}`}
                  >
                    Edit draft
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
