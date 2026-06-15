import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusControls } from "@/components/admin/product-status-controls";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import type { ProductStatus } from "@prisma/client";

const STATUS_VARIANT: Record<ProductStatus, "success" | "muted" | "secondary"> = {
  published: "success",
  draft: "secondary",
  archived: "muted",
};

type ProductLink = {
  label: string;
  url: string;
};

function normalizeLinks(value: unknown): ProductLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (link): link is ProductLink =>
      typeof link === "object" &&
      link !== null &&
      "label" in link &&
      "url" in link &&
      typeof link.label === "string" &&
      typeof link.url === "string"
  );
}

export default async function ProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Ecosystem Projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge
              variant={STATUS_VARIANT[product.status]}
              className="capitalize"
            >
              {product.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /products/{product.slug} · {product._count.courses} course
            {product._count.courses === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={productPath(product.slug)} target="_blank">
              <Eye />
              Preview
            </Link>
          </Button>
          <ProductStatusControls productId={product.id} status={product.status} />
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <ProductForm
          initial={{
            id: product.id,
            name: product.name,
            description: product.description,
            logoUrl: product.logoUrl,
            links: normalizeLinks(product.links),
          }}
        />
      </div>
    </div>
  );
}
