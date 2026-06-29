import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseCatalogFilters } from "@/components/course-catalog-filters";
import { PageHeader } from "@/components/page-header";
import { TrackView } from "@/components/analytics/track-view";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import {
  getPublishedCourseFilterOptions,
  getPublishedCourses,
} from "@/lib/courses";
import {
  hasActiveCourseFilters,
  parseCourseCatalogSearchParams,
} from "@/lib/course-catalog";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Short courses that explain Arcium in plain language. Browse the full catalog on Arcademy.",
};

type CoursesPageProps = {
  searchParams: Promise<{
    level?: string;
    type?: string;
    product?: string;
    sort?: string;
  }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const raw = await searchParams;
  const filters = parseCourseCatalogSearchParams(raw);
  const filtersActive = hasActiveCourseFilters(filters);

  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  let filterOptions: Awaited<
    ReturnType<typeof getPublishedCourseFilterOptions>
  > = { products: [], levels: [], types: [] };
  let coursesLoadError = false;

  try {
    [courses, filterOptions] = await Promise.all([
      getPublishedCourses(filters),
      getPublishedCourseFilterOptions(),
    ]);
  } catch {
    coursesLoadError = true;
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 pb-12 sm:px-6">
      <TrackView
        eventName="course_catalog_viewed"
        path="/courses"
        metadata={{
          visibleCourseCount: coursesLoadError ? 0 : courses.length,
          filterLevel: filters.level ?? null,
          filterType: filters.courseType ?? null,
          filterProduct: filters.productSlug ?? null,
          filterSort: filters.sort ?? "recommended",
        }}
      />
      <PageHeader
        headingId="courses-heading"
        title="Courses"
        description="All published courses in the Arcium ecosystem. No wallet needed to read."
      />

      {!coursesLoadError && (
        <div className="mb-8">
          <CourseCatalogFilters
            filters={filters}
            options={filterOptions}
            courseCount={courses.length}
          />
        </div>
      )}

      <section aria-labelledby="courses-heading">
        {coursesLoadError ? (
          <HomeSectionLoadError
            title="Courses did not load"
            description="The course catalog is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        ) : courses.length > 0 ? (
          <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
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
                  courseType: c.courseType,
                  thumbnailUrl: c.thumbnailUrl,
                  estimatedDuration: c.estimatedDuration,
                  lessonCount: c._count.lessons,
                  hasBadge: Boolean(c.badge),
                }}
              />
            ))}
          </div>
        ) : filtersActive ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 font-medium">No courses match these filters</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Try removing a filter or browse the full catalog.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/courses">Clear filters</Link>
            </Button>
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
