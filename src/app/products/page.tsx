import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Ecosystem Projects",
  description: "Explore curated Arcium ecosystem projects on Arcademy.",
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  try {
    products = await getPublishedProducts();
  } catch {
    products = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ecosystem Projects
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse staff-curated Arcium ecosystem projects, then follow the
          courses attached to each one.
        </p>
      </header>

      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
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
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <PackageOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No ecosystem projects available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The Arcademy team is preparing the first ecosystem project pages.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
