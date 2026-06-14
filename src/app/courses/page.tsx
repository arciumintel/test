import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { getPublishedCourses } from "@/lib/courses";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse official Arcium ecosystem courses on Arcademy.",
};

export default async function CoursesPage() {
  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  try {
    courses = await getPublishedCourses();
  } catch {
    courses = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-2 text-muted-foreground">
          Official, curated learning paths for the Arcium ecosystem. Browse
          freely — connect a wallet when you&apos;re ready to track progress and
          earn badges.
        </p>
      </header>

      {courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={{
                slug: c.slug,
                title: c.title,
                summary: c.summary,
                partnerName: c.partnerName,
                level: c.level,
                thumbnailUrl: c.thumbnailUrl,
                estimatedDuration: c.estimatedDuration,
                lessonCount: c._count.lessons,
                hasBadge: Boolean(c.badge),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No courses available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — the Arcademy team is preparing the first courses.
          </p>
        </div>
      )}
    </div>
  );
}
