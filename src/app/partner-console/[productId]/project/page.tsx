import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { getPartnerProduct } from "@/app/actions/partner-products";
import { getProjectAdminAccess } from "@/lib/project-admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const result = await getPartnerProduct(productId);
  if ("error" in result) return { title: "Project settings" };
  return { title: `Project settings — ${result.product.name}` };
}

export default async function PartnerProjectSettingsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const access = await getProjectAdminAccess(productId);
  if (!access.user) redirect("/courses");
  if (!access.canManage) redirect("/partner-console");

  const result = await getPartnerProduct(productId);
  if ("error" in result) notFound();
  const product = result.product;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/partner-console"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Partner console
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Project settings</h1>
        <Badge variant="secondary" className="capitalize">
          {product.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage how {product.name} appears on Arcademy.
      </p>

      <div className="mt-8">
        <ProductForm
          variant="partner"
          partnerProductId={productId}
          initial={{
            id: product.id,
            name: product.name,
            description: product.description,
            logoUrl: product.logoUrl,
            category: product.category,
            partnerName: product.partnerName,
            links: product.links,
          }}
        />
      </div>
    </div>
  );
}
