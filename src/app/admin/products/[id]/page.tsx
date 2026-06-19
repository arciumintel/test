import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusControls } from "@/components/admin/product-status-controls";
import { PublishReadinessPanel } from "@/components/admin/publish-readiness-panel";
import { PartnerReferralToolkit } from "@/components/admin/partner-referral-toolkit";
import { ProductAnalyticsPanel } from "@/components/admin/product-analytics-panel";
import { ProjectAdminPanel } from "@/components/admin/project-admin-panel";
import { prisma } from "@/lib/prisma";
import { getProductPublishReadiness } from "@/lib/publish-readiness";
import { getProductAnalytics } from "@/lib/analytics";
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
  const [product, readiness, analytics, projectAdmins] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { courses: true } },
        courses: {
          where: { status: "published" },
          orderBy: { title: "asc" },
          select: { title: true, slug: true },
        },
      },
    }),
    getProductPublishReadiness(id),
    getProductAnalytics(id),
    prisma.projectAdmin.findMany({
      where: { productId: id },
      include: {
        user: { select: { walletAddress: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

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
            {product.partnerName ? ` · Partner: ${product.partnerName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/partner-console/${product.id}/discord`}>
              <MessageCircle />
              Discord console
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={productPath(product.slug)} target="_blank">
              <Eye />
              Preview
            </Link>
          </Button>
          <ProductStatusControls productId={product.id} status={product.status} />
        </div>
      </div>

      <PublishReadinessPanel
        report={readiness}
        status={product.status}
        entityLabel="ecosystem project"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="mt-4">
            <ProductForm
              initial={{
                id: product.id,
                name: product.name,
                description: product.description,
                logoUrl: product.logoUrl,
                category: product.category,
                partnerName: product.partnerName,
                links: normalizeLinks(product.links),
              }}
            />
          </div>
        </div>
        <div className="space-y-8">
          <PartnerReferralToolkit
            productName={product.name}
            productSlug={product.slug}
            partnerName={product.partnerName}
            courses={product.courses}
          />
        </div>
      </div>

      {analytics && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Partner reporting</h2>
          <div className="mt-4">
            <ProductAnalyticsPanel data={analytics} productId={product.id} />
          </div>
        </section>
      )}

      <ProjectAdminPanel
        productId={product.id}
        admins={projectAdmins.map((a) => ({
          id: a.id,
          role: a.role,
          user: a.user,
        }))}
      />
    </div>
  );
}
