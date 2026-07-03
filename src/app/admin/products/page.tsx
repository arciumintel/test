import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admin projects" };

const STATUS_VARIANT: Record<
  ProductStatus,
  "success" | "muted" | "secondary"
> = {
  published: "success",
  draft: "secondary",
  archived: "muted",
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  _count: { courses: number };
};

export default async function AdminProductsPage() {
  let products: AdminProduct[] = [];
  let dbError = false;
  try {
    products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
  } catch {
    dbError = true;
    products = [];
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Manage project landing pages and course ownership.
          </p>
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/products/new">
            <Plus />
            New project
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="mt-8">
          <HomeSectionLoadError
            title="Projects did not load"
            description="The project list is unavailable right now. Refresh the page, or check DATABASE_URL if this is a new environment."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            All projects ({products.length})
          </h2>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
              <PackageOpen
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden
              />
              <p className="mt-3 font-medium">No projects yet</p>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Create a project before publishing courses.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/products/new">New project</Link>
              </Button>
            </div>
          ) : (
            products.map((product) => (
              <Card key={product.id}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="truncate font-medium hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <StatusBadge
                        variant={STATUS_VARIANT[product.status]}
                        className="capitalize"
                      >
                        {product.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /products/{product.slug} · {product._count.courses}{" "}
                      course{product._count.courses === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}`}>
                        <Pencil />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </>
  );
}
