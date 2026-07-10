import Link from "next/link";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/components/ui/filter-chip";
import { categoryToSlug } from "@/lib/project-categories";

type ProjectCategoryFiltersProps = {
  categories: string[];
  activeCategorySlug?: string;
  basePath?: string;
};

export function ProjectCategoryFilters({
  categories,
  activeCategorySlug,
  basePath = "/products",
}: ProjectCategoryFiltersProps) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Filter projects by category"
      className="flex flex-wrap gap-2"
    >
      <FilterChip href={basePath} active={!activeCategorySlug}>
        All
      </FilterChip>
      {categories.map((label) => {
        const slug = categoryToSlug(label);
        return (
          <FilterChip
            key={label}
            href={`${basePath}?category=${encodeURIComponent(slug)}`}
            active={activeCategorySlug === slug}
          >
            {label}
          </FilterChip>
        );
      })}
    </nav>
  );
}
