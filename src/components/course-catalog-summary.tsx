import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActiveCourseFilterPills,
  type CourseCatalogFilters,
} from "@/lib/course-catalog";
import type { CourseCatalogFilterOptions } from "@/components/course-catalog-filter-fields";

type CourseCatalogSummaryProps = {
  courseCount: number;
  filters: CourseCatalogFilters;
  options: CourseCatalogFilterOptions;
  basePath?: string;
};

export function CourseCatalogSummary({
  courseCount,
  filters,
  options,
  basePath = "/courses",
}: CourseCatalogSummaryProps) {
  const pills = getActiveCourseFilterPills(filters, options, basePath);
  const hasNarrowingFilters = pills.length > 0;
  const courseLabel = courseCount === 1 ? "course" : "courses";

  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="shrink-0 text-sm text-muted-foreground">
        <span
          className={cn(
            "font-medium",
            hasNarrowingFilters ? "text-primary" : "text-foreground"
          )}
        >
          {courseCount} {courseLabel}
        </span>
        {hasNarrowingFilters ? " matching filters" : " in catalog"}
      </p>

      {hasNarrowingFilters && (
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {pills.map((pill) => (
            <Link
              key={pill.id}
              href={pill.href}
              className="inline-flex h-7 max-w-[10rem] items-center gap-1 rounded-md border border-primary/25 bg-primary/10 py-0 pl-2 pr-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20"
            >
              <span className="truncate">{pill.label}</span>
              <X className="size-3 shrink-0 opacity-70" aria-hidden />
              <span className="sr-only">Remove {pill.label} filter</span>
            </Link>
          ))}
          <Link
            href={basePath}
            className="inline-flex h-7 items-center px-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
