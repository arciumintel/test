import Link from "next/link";
import type { CourseLevel, CourseType } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  buildCourseCatalogHref,
  COURSE_LEVEL_LABELS,
  COURSE_SORT_LABELS,
  COURSE_TYPE_LABELS,
  type CourseCatalogFilters,
  type CourseSort,
} from "@/lib/course-catalog";

export type CourseCatalogFilterOptions = {
  products: { slug: string; name: string }[];
  levels: CourseLevel[];
  types: CourseType[];
};

type CourseCatalogFilterFieldsProps = {
  filters: CourseCatalogFilters;
  options: CourseCatalogFilterOptions;
  basePath?: string;
  layout?: "toolbar" | "stacked";
  className?: string;
};

export function hasCourseCatalogFilterOptions(
  options: CourseCatalogFilterOptions
): boolean {
  return (
    options.levels.length > 0 ||
    options.types.length > 0 ||
    options.products.length > 1
  );
}

export function CourseCatalogFilterFields({
  filters,
  options,
  basePath = "/courses",
  layout = "toolbar",
  className,
}: CourseCatalogFilterFieldsProps) {
  if (!hasCourseCatalogFilterOptions(options)) return null;

  const isToolbar = layout === "toolbar";

  const levelGroup =
    options.levels.length > 0 ? (
      <FilterGroup label="Level" hasSelection={Boolean(filters.level)}>
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            level: undefined,
          })}
          active={!filters.level}
          comfortable={!isToolbar}
          label="All"
        />
        {options.levels.map((level) => (
          <FilterChip
            key={level}
            href={buildCourseCatalogHref(basePath, { ...filters, level })}
            active={filters.level === level}
            emphasized={filters.level === level}
            comfortable={!isToolbar}
            label={COURSE_LEVEL_LABELS[level]}
          />
        ))}
      </FilterGroup>
    ) : null;

  const typeGroup =
    options.types.length > 0 ? (
      <FilterGroup label="Type" hasSelection={Boolean(filters.courseType)}>
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            courseType: undefined,
          })}
          active={!filters.courseType}
          comfortable={!isToolbar}
          label="All"
        />
        {options.types.map((type) => (
          <FilterChip
            key={type}
            href={buildCourseCatalogHref(basePath, {
              ...filters,
              courseType: type,
            })}
            active={filters.courseType === type}
            emphasized={filters.courseType === type}
            comfortable={!isToolbar}
            label={COURSE_TYPE_LABELS[type]}
          />
        ))}
      </FilterGroup>
    ) : null;

  const projectGroup =
    options.products.length > 1 ? (
      <FilterGroup label="Project" hasSelection={Boolean(filters.productSlug)}>
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            productSlug: undefined,
          })}
          active={!filters.productSlug}
          comfortable={!isToolbar}
          label="All"
        />
        {options.products.map((product) => (
          <FilterChip
            key={product.slug}
            href={buildCourseCatalogHref(basePath, {
              ...filters,
              productSlug: product.slug,
            })}
            active={filters.productSlug === product.slug}
            emphasized={filters.productSlug === product.slug}
            comfortable={!isToolbar}
            truncate
            label={product.name}
          />
        ))}
      </FilterGroup>
    ) : null;

  const sortIsNarrowing =
    Boolean(filters.sort) && filters.sort !== "recommended";

  const filterGroups = [levelGroup, typeGroup, projectGroup].filter(Boolean);

  const sortChips = (Object.keys(COURSE_SORT_LABELS) as CourseSort[]).map(
    (sort) => {
      const isActive =
        sort === "recommended"
          ? !filters.sort || filters.sort === "recommended"
          : filters.sort === sort;
      const isEmphasized = sort !== "recommended" && filters.sort === sort;

      return (
        <FilterChip
          key={sort}
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            sort: sort === "recommended" ? undefined : sort,
          })}
          active={isActive}
          emphasized={isEmphasized}
          comfortable={!isToolbar}
          label={COURSE_SORT_LABELS[sort]}
        />
      );
    }
  );

  if (isToolbar) {
    return (
      <div
        className={cn("flex flex-wrap items-end gap-x-6 gap-y-3", className)}
      >
        {filterGroups}
        <FilterGroup
          label="Sort"
          hasSelection={sortIsNarrowing}
          className="md:ml-auto"
        >
          {sortChips}
        </FilterGroup>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {filterGroups}
      <FilterGroup label="Sort" hasSelection={sortIsNarrowing}>
        {sortChips}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  hasSelection = false,
  className,
  children,
}: {
  label: string;
  hasSelection?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span
        className={cn(
          "text-[11px] font-medium leading-none tracking-wide",
          hasSelection ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <nav
        aria-label={`Filter courses by ${label.toLowerCase()}`}
        className="flex min-w-0 flex-wrap gap-1"
      >
        {children}
      </nav>
    </div>
  );
}

function FilterChip({
  href,
  active,
  emphasized = false,
  comfortable = false,
  truncate: shouldTruncate = false,
  label,
}: {
  href: string;
  active: boolean;
  emphasized?: boolean;
  comfortable?: boolean;
  truncate?: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border text-xs font-medium transition-colors",
        comfortable ? "min-h-9 px-3" : "h-8 px-2.5",
        shouldTruncate && "max-w-[12rem] truncate",
        active && emphasized
          ? "border-primary/30 bg-primary/12 text-primary dark:bg-primary/20"
          : active
            ? "border-border bg-muted/50 text-foreground"
            : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      )}
      title={label}
    >
      {label}
    </Link>
  );
}
