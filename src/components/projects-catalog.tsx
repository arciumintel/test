"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FeaturedProductCard,
  ProductCard,
  type ProductCardData,
} from "@/components/product-card";
import {
  matchesProductSearch,
  sortProductCatalogItems,
  type ProductCatalogItem,
  type ProductCategoryOption,
  type ProductProgressState,
  type ProductSort,
} from "@/lib/product-catalog";
import { cn } from "@/lib/utils";

type ProjectsCatalogProps = {
  products: ProductCatalogItem[];
  featuredProducts: ProductCatalogItem[];
  categories: ProductCategoryOption[];
  progressBySlug: Record<string, ProductProgressState>;
  initialCategorySlug?: string;
};

function withProgress(
  product: ProductCatalogItem,
  progressBySlug: Record<string, ProductProgressState>
): ProductCardData {
  return {
    ...product,
    progress: progressBySlug[product.slug] ?? null,
  };
}

function FilterChip({
  active,
  onClick,
  href,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-foreground hover:bg-muted/60"
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? "true" : undefined} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={className}
    >
      {children}
    </button>
  );
}

export function ProjectsCatalog({
  products,
  featuredProducts,
  categories,
  progressBySlug,
  initialCategorySlug,
}: ProjectsCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<ProductSort>("recommended");
  const [activeCategorySlug, setActiveCategorySlug] = React.useState(
    initialCategorySlug ?? ""
  );

  React.useEffect(() => {
    setActiveCategorySlug(initialCategorySlug ?? "");
  }, [initialCategorySlug]);

  const activeCategoryLabel = React.useMemo(() => {
    if (!activeCategorySlug) return null;
    return (
      categories.find((category) => category.slug === activeCategorySlug)
        ?.label ?? null
    );
  }, [activeCategorySlug, categories]);

  const filterProducts = React.useCallback(
    (items: ProductCatalogItem[]) => {
      let next = items.filter((product) => matchesProductSearch(product, query));
      if (activeCategoryLabel) {
        next = next.filter((product) => product.category === activeCategoryLabel);
      }
      return sortProductCatalogItems(next, sort);
    },
    [activeCategoryLabel, query, sort]
  );

  const filteredFeatured = React.useMemo(
    () => filterProducts(featuredProducts),
    [featuredProducts, filterProducts]
  );

  const filteredProducts = React.useMemo(() => {
    const sorted = filterProducts(products);
    if (filteredFeatured.length === 0) return sorted;
    const featuredIds = new Set(filteredFeatured.map((product) => product.id));
    return sorted.filter((product) => !featuredIds.has(product.id));
  }, [filterProducts, products, filteredFeatured]);

  const hasActiveFilters = Boolean(query.trim() || activeCategorySlug);

  function setCategory(slug: string) {
    setActiveCategorySlug(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    const next = params.toString();
    router.replace(next ? `/products?${next}` : "/products", { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredProducts.length + filteredFeatured.length}
            </span>{" "}
            project{filteredProducts.length === 1 ? "" : "s"}
            {hasActiveFilters ? " matching your filters" : ""}
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects by name, description, or category…"
                aria-label="Search projects"
                className="pl-9"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  aria-label="Clear search"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label htmlFor="project-sort" className="sr-only">
                Sort projects
              </label>
              <Select
                id="project-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as ProductSort)}
                className="min-w-[11rem]"
                aria-label="Sort projects"
              >
                <option value="recommended">Recommended</option>
                <option value="name">Name (A–Z)</option>
                <option value="courses">Most courses</option>
                <option value="updated">Recently updated</option>
              </Select>
            </div>
          </div>

          {categories.length > 0 ? (
            <nav
              aria-label="Filter projects by category"
              className="flex flex-wrap gap-2"
            >
              <FilterChip
                active={!activeCategorySlug}
                onClick={() => setCategory("")}
              >
                All ({products.length})
              </FilterChip>
              {categories.map((category) => (
                <FilterChip
                  key={category.slug}
                  active={activeCategorySlug === category.slug}
                  onClick={() => setCategory(category.slug)}
                >
                  {category.label} ({category.count})
                </FilterChip>
              ))}
            </nav>
          ) : null}
        </div>
      </div>

      {filteredFeatured.length > 0 ? (
        <section aria-labelledby="featured-projects-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2
                id="featured-projects-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Highlighted ecosystem projects
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Partner apps and tools worth exploring first.
              </p>
            </div>
          </div>
          <div className="grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            {filteredFeatured.map((product) => (
              <FeaturedProductCard
                key={product.id}
                product={withProgress(product, progressBySlug)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-projects-heading">
        <h2
          id="all-projects-heading"
          className="mb-4 text-lg font-semibold tracking-tight"
        >
          All ecosystem projects
        </h2>

        {filteredProducts.length > 0 ? (
          <div className="grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={withProgress(product, progressBySlug)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 font-medium">No projects match your filters</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Try a different search term or clear your category filter.
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
