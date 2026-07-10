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

export type CourseCatalogFilterGroup =
  | "level"
  | "type"
  | "project"
  | "sort";

type CourseCatalogFilterFieldsProps = {
  filters: CourseCatalogFilters;
  options: CourseCatalogFilterOptions;
  basePath?: string;
  layout?: "toolbar" | "stacked" | "compact-inline";
  groups?: CourseCatalogFilterGroup[];
  className?: string;
};

const ALL_GROUPS: CourseCatalogFilterGroup[] = [
  "level",
  "type",
  "project",
  "sort",
];

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
  groups = ALL_GROUPS,
  className,
}: CourseCatalogFilterFieldsProps) {
  if (!hasCourseCatalogFilterOptions(options)) return null;

  const isToolbar = layout === "toolbar";
  const isCompactInline = layout === "compact-inline";
  const showGroup = (group: CourseCatalogFilterGroup) => groups.includes(group);

  const levelGroup =
    showGroup("level") && options.levels.length > 0 ? (
      <FilterGroup
        label="Level"
        hasSelection={Boolean(filters.level)}
        compact={isCompactInline}
      >
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            level: undefined,
          })}
          active={!filters.level}
          comfortable={!isToolbar && !isCompactInline}
          label="All"
        />
        {options.levels.map((level) => (
          <FilterChip
            key={level}
            href={buildCourseCatalogHref(basePath, { ...filters, level })}
            active={filters.level === level}
            emphasized={filters.level === level}
            comfortable={!isToolbar && !isCompactInline}
            label={COURSE_LEVEL_LABELS[level]}
          />
        ))}
      </FilterGroup>
    ) : null;

  const typeGroup =
    showGroup("type") && options.types.length > 0 ? (
      <FilterGroup
        label="Type"
        hasSelection={Boolean(filters.courseType)}
        compact={isCompactInline}
      >
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            courseType: undefined,
          })}
          active={!filters.courseType}
          comfortable={!isToolbar && !isCompactInline}
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
            comfortable={!isToolbar && !isCompactInline}
            label={COURSE_TYPE_LABELS[type]}
          />
        ))}
      </FilterGroup>
    ) : null;

  const projectGroup =
    showGroup("project") && options.products.length > 1 ? (
      <FilterGroup
        label="Project"
        hasSelection={Boolean(filters.productSlug)}
        compact={isCompactInline}
      >
        <FilterChip
          href={buildCourseCatalogHref(basePath, {
            ...filters,
            productSlug: undefined,
          })}
          active={!filters.productSlug}
          comfortable={!isToolbar && !isCompactInline}
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
            comfortable={!isToolbar && !isCompactInline}
            truncate
            label={product.name}
          />
        ))}
      </FilterGroup>
    ) : null;

  const sortIsNarrowing =
    Boolean(filters.sort) && filters.sort !== "recommended";

  const sortChips = showGroup("sort")
    ? (Object.keys(COURSE_SORT_LABELS) as CourseSort[]).map((sort) => {
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
            comfortable={!isToolbar && !isCompactInline}
            label={COURSE_SORT_LABELS[sort]}
          />
        );
      })
    : null;

  const filterGroups = [levelGroup, typeGroup, projectGroup].filter(Boolean);

  if (isToolbar) {
    return (
      <div
        className={cn("flex flex-wrap items-end gap-x-6 gap-y-3", className)}
      >
        {filterGroups}
        {sortChips ? (
          <FilterGroup
            label="Sort"
            hasSelection={sortIsNarrowing}
            className="md:ml-auto"
          >
            {sortChips}
          </FilterGroup>
        ) : null}
      </div>
    );
  }

  if (isCompactInline) {
    return (
      <div className={cn("space-y-3", className)}>
        {filterGroups}
        {sortChips ? (
          <FilterGroup label="Sort" hasSelection={sortIsNarrowing} compact>
            {sortChips}
          </FilterGroup>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {filterGroups}
      {sortChips ? (
        <FilterGroup label="Sort" hasSelection={sortIsNarrowing}>
          {sortChips}
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  hasSelection = false,
  compact = false,
  className,
  children,
}: {
  label: string;
  hasSelection?: boolean;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span
        className={cn(
          "text-[11px] font-medium leading-none tracking-wide",
          hasSelection ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <nav
        aria-label={`Filter courses by ${label.toLowerCase()}`}
        className={cn(
          "flex min-w-0 gap-1",
          compact ? "filter-scroll-row" : "flex-wrap"
        )}
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
          ? "border-[color:var(--featured-border)] bg-[color:color-mix(in_srgb,var(--featured-background)_58%,var(--surface-elevated))] text-foreground shadow-[inset_0_0_0_1px_var(--featured-border)]"
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
