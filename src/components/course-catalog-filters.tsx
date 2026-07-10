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

function hasSecondaryFilters(options: CourseCatalogFilterOptions): boolean {
  return options.types.length > 0 || options.products.length > 1;
}

function countSecondaryFilters(
  filters: CatalogFilters,
  options: CourseCatalogFilterOptions
): number {
  let count = 0;
  if (options.types.length > 0 && filters.courseType) count += 1;
  if (options.products.length > 1 && filters.productSlug) count += 1;
  return count;
}

export function CourseCatalogFilters({
  filters,
  options,
  courseCount,
  basePath = "/courses",
}: CourseCatalogFiltersProps) {
  const showFilters = hasCourseCatalogFilterOptions(options);
  const activeFilterCount = countNarrowingCourseFilters(filters);
  const secondaryFilterCount = countSecondaryFilters(filters, options);
  const showSecondaryFilters = hasSecondaryFilters(options);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        activeFilterCount > 0 && "border-border-strong"
      )}
    >
      <div
        className={cn(
          "border-b px-4 py-3 transition-colors",
          activeFilterCount > 0
            ? "border-border-subtle bg-surface-secondary"
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
        <div className="px-4 pb-4 pt-3">
          <div className="space-y-3 md:hidden">
            <CourseCatalogFilterFields
              filters={filters}
              options={options}
              basePath={basePath}
              layout="compact-inline"
              groups={["level", "sort"]}
            />
            {showSecondaryFilters ? (
              <CourseCatalogFiltersMobile
                activeFilterCount={secondaryFilterCount}
                triggerLabel="More filters"
              >
                <CourseCatalogFilterFields
                  filters={filters}
                  options={options}
                  basePath={basePath}
                  layout="stacked"
                  groups={["type", "project"]}
                />
              </CourseCatalogFiltersMobile>
            ) : null}
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
