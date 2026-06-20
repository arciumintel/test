import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { ProductRowLink } from "@/components/product-row-link";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse Arcium apps and tools on Arcademy. Each project has its own course list.",
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  let productsLoadError = false;

  try {
    products = await getPublishedProducts();
  } catch {
    productsLoadError = true;
  }

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

      <section aria-labelledby="projects-heading">
        {productsLoadError ? (
          <HomeSectionLoadError
            title="Projects did not load"
            description="The project list is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        ) : products.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card divide-y">
            {products.map((product) => (
              <ProductRowLink
                key={product.id}
                product={{
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  logoUrl: product.logoUrl,
                  courseCount: product._count.courses,
                }}
              />
            ))}
          </div>
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
