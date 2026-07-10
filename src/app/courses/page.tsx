import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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

      {!coursesLoadError ? (
        <div className="mb-6 rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-sm">
          <p className="text-pretty text-muted-foreground">
            <span className="font-medium text-foreground">New here?</span>{" "}
            <Link
              href="/start"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Start with Arcium
            </Link>{" "}
            for a guided introduction to the ecosystem.
          </p>
        </div>
      ) : null}

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
          <EmptyState
            icon={BookOpen}
            title="No courses match these filters"
            description="Try removing a filter or browse the full catalog."
            action={
              <Button variant="outline" asChild>
                <Link href="/courses">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No published courses yet"
            description="The Arcademy team is preparing the first courses. Check back soon."
          />
        )}
      </section>
    </div>
  );
}
