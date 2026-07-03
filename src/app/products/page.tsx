import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { FoundationStartHero } from "@/components/foundation-start-hero";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { PageHeader } from "@/components/page-header";
import { ProjectsCatalog } from "@/components/projects-catalog";
import { buildCategoryOptions } from "@/lib/product-catalog";
import {
  getArciumOnboardingEntry,
  getEcosystemProductCatalogItems,
  getFeaturedProductCatalogItems,
  getFoundationProducts,
  resolvePublishedCategoryFilter,
} from "@/lib/products";
import { buildProductProgressMap, getLearnerCourseProgressList } from "@/lib/learner-progress";
import { getCurrentUser } from "@/lib/session";
import { categoryToSlug } from "@/lib/project-categories";

export const metadata: Metadata = {
  title: "Ecosystem Projects",
  description:
    "Discover apps and tools built on Arcium. Each ecosystem project has its own course list on Arcademy.",
};

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category: categorySlug } = await searchParams;
  const activeCategory = await resolvePublishedCategoryFilter(categorySlug);

  let ecosystemProducts: Awaited<
    ReturnType<typeof getEcosystemProductCatalogItems>
  > = [];
  let foundationProducts: Awaited<ReturnType<typeof getFoundationProducts>> =
    [];
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProductCatalogItems>> =
    [];
  let onboardingEntry: Awaited<ReturnType<typeof getArciumOnboardingEntry>> =
    null;
  let progressBySlug: ReturnType<typeof buildProductProgressMap> = {};
  let productsLoadError = false;

  try {
    const user = await getCurrentUser();
    const [foundations, ecosystem, featured, entry, courseProgress] =
      await Promise.all([
        getFoundationProducts(),
        getEcosystemProductCatalogItems(
          activeCategory ? { category: activeCategory } : undefined
        ),
        getFeaturedProductCatalogItems(),
        getArciumOnboardingEntry(),
        user ? getLearnerCourseProgressList(user.id) : Promise.resolve([]),
      ]);

    foundationProducts = foundations;
    ecosystemProducts = ecosystem;
    featuredProducts = featured;
    onboardingEntry = entry;
    progressBySlug = buildProductProgressMap(courseProgress);
  } catch {
    productsLoadError = true;
  }

  const categories = buildCategoryOptions(ecosystemProducts);
  const foundation = foundationProducts[0];
  const hasCatalogContent =
    Boolean(foundation) || ecosystemProducts.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <PageHeader
        headingId="projects-heading"
        title="Ecosystem projects"
        description="Apps and tools built on Arcium. Pick a project to explore its courses and learning paths."
      />

      {categorySlug && !activeCategory && !productsLoadError ? (
        <p className="mb-6 text-sm text-muted-foreground">
          No projects match that category.{" "}
          <Link
            href="/products"
            className="text-primary underline-offset-4 hover:underline"
          >
            View all projects
          </Link>
          .
        </p>
      ) : null}

      <section aria-labelledby="projects-heading" className="space-y-8">
        {productsLoadError ? (
          <HomeSectionLoadError
            title="Projects did not load"
            description="The project list is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        ) : hasCatalogContent ? (
          <>
            {foundation && onboardingEntry ? (
              <FoundationStartHero
                product={foundation}
                onboardingHref={onboardingEntry.href}
                progress={progressBySlug[foundation.slug] ?? null}
              />
            ) : null}

            {ecosystemProducts.length > 0 || featuredProducts.length > 0 ? (
              <Suspense fallback={null}>
                <ProjectsCatalog
                  products={ecosystemProducts}
                  featuredProducts={featuredProducts}
                  categories={categories}
                  progressBySlug={progressBySlug}
                  initialCategorySlug={
                    activeCategory ? categoryToSlug(activeCategory) : undefined
                  }
                />
              </Suspense>
            ) : (
              <p className="text-sm text-muted-foreground">
                More ecosystem projects are on the way.{" "}
                <Link
                  href="/start"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Start with Arcium
                </Link>{" "}
                in the meantime.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 font-medium">No published projects yet</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Ecosystem project pages appear here as Arcium apps and tools are
              added to Arcademy.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/start">Start with Arcium</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
