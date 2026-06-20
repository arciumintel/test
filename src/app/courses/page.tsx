import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { TrackView } from "@/components/analytics/track-view";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { getPublishedCourses } from "@/lib/courses";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Short courses that explain Arcium in plain language. Browse the full catalog on Arcademy.",
};

export default async function CoursesPage() {
  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  let coursesLoadError = false;

  try {
    courses = await getPublishedCourses();
  } catch {
    coursesLoadError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <TrackView
        eventName="course_catalog_viewed"
        path="/courses"
        metadata={{ visibleCourseCount: coursesLoadError ? 0 : courses.length }}
      />
      <header className="mb-8 max-w-2xl">
        <h1
          id="courses-heading"
          className="text-balance text-3xl font-semibold tracking-tight"
        >
          Courses
        </h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
          Short courses that explain Arcium in plain language. You can read
          without a wallet. Connect one when you want to save progress and earn
          a badge in your profile.
        </p>
      </header>

      <section aria-labelledby="courses-heading">
      {coursesLoadError ? (
        <HomeSectionLoadError
          title="Courses did not load"
          description="The course catalog is unavailable right now. Refresh the page, or try again in a few minutes."
        />
      ) : courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={{
                slug: c.slug,
                productSlug: c.product.slug,
                productName: c.product.name,
                title: c.title,
                summary: c.summary,
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
        <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <BookOpen
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-3 font-medium">No published courses yet</p>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            The Arcademy team is preparing the first courses. Check back soon.
          </p>
        </div>
      )}
      </section>
    </div>
  );
}
