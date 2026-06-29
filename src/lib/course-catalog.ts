import type { CourseLevel, CourseType } from "@prisma/client";

export const COURSE_SORT_OPTIONS = [
  "recommended",
  "newest",
  "duration",
] as const;

export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number];

export type CourseCatalogFilters = {
  level?: CourseLevel;
  courseType?: CourseType;
  productSlug?: string;
  sort?: CourseSort;
};

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  foundational: "Foundations",
  product_onboarding: "Product onboarding",
  builder_intro: "Builder intro",
};

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const COURSE_SORT_LABELS: Record<CourseSort, string> = {
  recommended: "Recommended",
  newest: "Newest",
  duration: "Shortest",
};

export type ActiveFilterPill = {
  id: string;
  label: string;
  href: string;
};

export function parseCourseCatalogSearchParams(
  params: Record<string, string | undefined>
): CourseCatalogFilters {
  const level = params.level;
  const courseType = params.type;
  const productSlug = params.product?.trim() || undefined;
  const sort = params.sort;

  return {
    level:
      level === "beginner" || level === "intermediate" || level === "advanced"
        ? level
        : undefined,
    courseType:
      courseType === "foundational" ||
      courseType === "product_onboarding" ||
      courseType === "builder_intro"
        ? courseType
        : undefined,
    productSlug,
    sort:
      sort === "newest" || sort === "duration" || sort === "recommended"
        ? sort
        : undefined,
  };
}

export function buildCourseCatalogHref(
  basePath: string,
  filters: CourseCatalogFilters
): string {
  const params = new URLSearchParams();
  if (filters.level) params.set("level", filters.level);
  if (filters.courseType) params.set("type", filters.courseType);
  if (filters.productSlug) params.set("product", filters.productSlug);
  if (filters.sort && filters.sort !== "recommended") {
    params.set("sort", filters.sort);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function hasActiveCourseFilters(filters: CourseCatalogFilters): boolean {
  return countNarrowingCourseFilters(filters) > 0;
}

/** Filters that narrow the catalog (excludes default "recommended" sort). */
export function countNarrowingCourseFilters(filters: CourseCatalogFilters): number {
  let count = 0;
  if (filters.level) count += 1;
  if (filters.courseType) count += 1;
  if (filters.productSlug) count += 1;
  if (filters.sort && filters.sort !== "recommended") count += 1;
  return count;
}

export function getActiveCourseFilterPills(
  filters: CourseCatalogFilters,
  options: {
    products: { slug: string; name: string }[];
  },
  basePath = "/courses"
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (filters.level) {
    pills.push({
      id: "level",
      label: COURSE_LEVEL_LABELS[filters.level],
      href: buildCourseCatalogHref(basePath, { ...filters, level: undefined }),
    });
  }

  if (filters.courseType) {
    pills.push({
      id: "type",
      label: COURSE_TYPE_LABELS[filters.courseType],
      href: buildCourseCatalogHref(basePath, {
        ...filters,
        courseType: undefined,
      }),
    });
  }

  if (filters.productSlug) {
    const product = options.products.find((p) => p.slug === filters.productSlug);
    pills.push({
      id: "product",
      label: product?.name ?? filters.productSlug,
      href: buildCourseCatalogHref(basePath, {
        ...filters,
        productSlug: undefined,
      }),
    });
  }

  if (filters.sort && filters.sort !== "recommended") {
    pills.push({
      id: "sort",
      label: COURSE_SORT_LABELS[filters.sort],
      href: buildCourseCatalogHref(basePath, { ...filters, sort: undefined }),
    });
  }

  return pills;
}
