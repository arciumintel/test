import type { CourseLevel, ProductRole } from "@prisma/client";
import { categoryToSlug } from "@/lib/project-categories";
import { formatDate } from "@/lib/utils";

export type ProductProgressState = {
  pct: number;
  completed: boolean;
  resumeHref: string;
};

export type ProductCatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  category: string | null;
  role: ProductRole;
  featured: boolean;
  featuredOrder: number | null;
  updatedAt: string;
  courseCount: number;
  lessonCount: number;
  estimatedDurationMinutes: number | null;
  learningOutcomes: string[];
  difficulty: CourseLevel | null;
};

export type ProductSort = "recommended" | "name" | "courses" | "updated";

export type ProductCategoryOption = {
  label: string;
  slug: string;
  count: number;
};

const LEVEL_RANK: Record<CourseLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function deriveProductDifficulty(
  levels: CourseLevel[]
): CourseLevel | null {
  if (levels.length === 0) return null;
  return levels.reduce((highest, level) =>
    LEVEL_RANK[level] > LEVEL_RANK[highest] ? level : highest
  );
}

export function collectLearningOutcomes(
  productOutcomes: string[],
  courseOutcomes: string[],
  max = 4
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const outcome of [...productOutcomes, ...courseOutcomes]) {
    const trimmed = outcome.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= max) break;
  }

  return result;
}

export function formatRelativeUpdate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Updated ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return `Updated ${formatDate(d)}`;
}

export function formatDurationHours(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} Hour${hours === 1 ? "" : "s"}`;
}

export function productCtaLabel(
  progress: ProductProgressState | null | undefined
): string {
  if (!progress) return "Start Learning";
  if (progress.completed) return "Explore Project";
  if (progress.pct > 0) return "Continue Learning";
  return "View Courses";
}

export function foundationStartCtaLabel(
  progress: ProductProgressState | null | undefined
): string {
  if (!progress) return "Start with Arcium";
  if (progress.completed) return "Review foundations";
  if (progress.pct > 0) return "Continue learning";
  return "Start with Arcium";
}

export function matchesProductSearch(
  product: ProductCatalogItem,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q) ||
    (product.category?.toLowerCase().includes(q) ?? false)
  );
}

export function sortProductCatalogItems(
  products: ProductCatalogItem[],
  sort: ProductSort
): ProductCatalogItem[] {
  const copy = [...products];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "courses":
      return copy.sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name));
    case "updated":
      return copy.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "recommended":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function buildCategoryOptions(
  products: ProductCatalogItem[]
): ProductCategoryOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (product.role === "foundation") continue;
    const label = product.category?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([label, count]) => ({
      label,
      slug: categoryToSlug(label),
      count,
    }));
}
