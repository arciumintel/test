import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { ProductRowLink } from "@/components/product-row-link";
import { ProjectCategoryFilters } from "@/components/project-category-filters";
import {
  categoryToSlug,
  groupProductsByCategory,
} from "@/lib/project-categories";
import {
  getPublishedProductCategoryLabels,
  getPublishedProducts,
  resolvePublishedCategoryFilter,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse Arcium apps and tools on Arcademy. Each project has its own course list.",
};

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category: categorySlug } = await searchParams;
  const activeCategory = await resolvePublishedCategoryFilter(categorySlug);

  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  let categoryLabels: string[] = [];
  let productsLoadError = false;

  try {
    [products, categoryLabels] = await Promise.all([
      getPublishedProducts(
        activeCategory ? { category: activeCategory } : undefined
      ),
      getPublishedProductCategoryLabels(),
    ]);
  } catch {
    productsLoadError = true;
  }

  const groupedProducts =
    !activeCategory && products.length > 0
      ? groupProductsByCategory(products)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1
          id="projects-heading"
          className="text-balance text-3xl font-semibold tracking-tight"
        >
          Projects
        </h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
          Each project is an app or tool in Arcium with its own course list. Pick
          a project to see its courses.
        </p>
      </header>

      {!productsLoadError && categoryLabels.length > 0 && (
        <div className="mb-6">
          <ProjectCategoryFilters
            categories={categoryLabels}
            activeCategorySlug={
              activeCategory ? categoryToSlug(activeCategory) : undefined
            }
          />
        </div>
      )}

      {categorySlug && !activeCategory && !productsLoadError && (
        <p className="mb-6 text-sm text-muted-foreground">
          No projects match that category.{" "}
          <Link href="/products" className="text-primary underline-offset-4 hover:underline">
            View all projects
          </Link>
          .
        </p>
      )}

      <section aria-labelledby="projects-heading">
        {productsLoadError ? (
          <HomeSectionLoadError
            title="Projects did not load"
            description="The project list is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        ) : products.length > 0 ? (
          groupedProducts ? (
            <div className="space-y-8">
              {groupedProducts.map(({ label, products: group }) => (
                <div key={label}>
                  <h2 className="mb-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                  </h2>
                  <div className="overflow-hidden rounded-xl border bg-card divide-y">
                    {group.map((product) => (
                      <ProductRowLink
                        key={product.id}
                        product={{
                          slug: product.slug,
                          name: product.name,
                          description: product.description,
                          logoUrl: product.logoUrl,
                          category: product.category,
                          courseCount: product._count.courses,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card divide-y">
              {products.map((product) => (
                <ProductRowLink
                  key={product.id}
                  product={{
                    slug: product.slug,
                    name: product.name,
                    description: product.description,
                    logoUrl: product.logoUrl,
                    category: product.category,
                    courseCount: product._count.courses,
                  }}
                />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 font-medium">No published projects yet</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Project pages appear here as Arcium apps and tools are added to
              Arcademy.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
