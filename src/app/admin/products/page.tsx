import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, PackageOpen, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProductStatusControls } from "@/components/admin/product-status-controls";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admin products" };

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product landing pages and course ownership.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus />
            New product
          </Link>
        </Button>
      </div>

      {dbError && (
        <Alert variant="warning" className="mt-6">
          <AlertTriangle />
          <AlertTitle>Database not reachable</AlertTitle>
          <AlertDescription>
            Set <code>DATABASE_URL</code> and run the product migration.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 space-y-3">
        {products.length === 0 && !dbError && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <PackageOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a product before publishing courses.
            </p>
          </div>
        )}
        {products.map((product) => (
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
                  <Badge
                    variant={STATUS_VARIANT[product.status]}
                    className="capitalize"
                  >
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  /products/{product.slug} · {product._count.courses} course
                  {product._count.courses === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${product.id}`}>
                    <Pencil />
                    Edit
                  </Link>
                </Button>
                <ProductStatusControls
                  productId={product.id}
                  status={product.status}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
