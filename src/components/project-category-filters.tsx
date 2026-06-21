import Link from "next/link";
import { cn } from "@/lib/utils";
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
      <FilterChip
        href={basePath}
        active={!activeCategorySlug}
        label="All"
      />
      {categories.map((label) => {
        const slug = categoryToSlug(label);
        return (
          <FilterChip
            key={label}
            href={`${basePath}?category=${encodeURIComponent(slug)}`}
            active={activeCategorySlug === slug}
            label={label}
          />
        );
      })}
    </nav>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted/60"
      )}
    >
      {label}
    </Link>
  );
}
