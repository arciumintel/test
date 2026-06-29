import {
  countNarrowingCourseFilters,
  type CourseCatalogFilters as CatalogFilters,
} from "@/lib/course-catalog";
import { cn } from "@/lib/utils";
import {
  CourseCatalogFilterFields,
  hasCourseCatalogFilterOptions,
  type CourseCatalogFilterOptions,
} from "@/components/course-catalog-filter-fields";
import { CourseCatalogFiltersMobile } from "@/components/course-catalog-filters-shell";
import { CourseCatalogSummary } from "@/components/course-catalog-summary";

type CourseCatalogFiltersProps = {
  filters: CatalogFilters;
  options: CourseCatalogFilterOptions;
  courseCount: number;
  basePath?: string;
};

export function CourseCatalogFilters({
  filters,
  options,
  courseCount,
  basePath = "/courses",
}: CourseCatalogFiltersProps) {
  const showFilters = hasCourseCatalogFilterOptions(options);
  const activeFilterCount = countNarrowingCourseFilters(filters);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        activeFilterCount > 0 && "border-primary/20"
      )}
    >
      <div
        className={cn(
          "border-b px-4 py-3 transition-colors",
          activeFilterCount > 0
            ? "border-primary/15 bg-primary/[0.04] dark:bg-primary/[0.08]"
            : "bg-muted/20"
        )}
      >
        <CourseCatalogSummary
          courseCount={courseCount}
          filters={filters}
          options={options}
          basePath={basePath}
        />
      </div>

      {showFilters && (
        <div className="px-4 pb-4 pt-1">
          <div className="md:hidden">
            <CourseCatalogFiltersMobile activeFilterCount={activeFilterCount}>
              <CourseCatalogFilterFields
                filters={filters}
                options={options}
                basePath={basePath}
                layout="stacked"
              />
            </CourseCatalogFiltersMobile>
          </div>

          <CourseCatalogFilterFields
            filters={filters}
            options={options}
            basePath={basePath}
            layout="toolbar"
            className="hidden md:flex"
          />
        </div>
      )}
    </div>
  );
}
