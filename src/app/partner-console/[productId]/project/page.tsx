import { ProductForm } from "@/components/admin/product-form";
import { PartnerProductStatusControls } from "@/components/partner-console/partner-product-status-controls";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { getPartnerProduct } from "@/app/actions/partner-products";
import { getProductPublishReadiness } from "@/lib/publish-readiness";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const result = await getPartnerProduct(productId);
  if ("error" in result) return { title: "Project settings" };
  return { title: `Project settings: ${result.product.name}` };
}

export default async function PartnerProjectSettingsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const result = await getPartnerProduct(productId);
  if ("error" in result) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">
          Project settings
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Manage how this project appears on Arcademy.
        </p>
        <div className="mt-8 max-w-3xl">
          <HomeSectionLoadError
            title="Project settings did not load"
            description="Project details are unavailable right now. Refresh the page, or try again in a few minutes."
          />
        </div>
      </>
    );
  }

  const product = result.product;
  const readiness = await getProductPublishReadiness(productId);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Project settings
            </h1>
            <Badge
              variant={product.status === "published" ? "success" : "secondary"}
            >
              {product.status}
            </Badge>
          </div>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Manage how {product.name} appears on Arcademy.
          </p>
        </div>
        <PartnerProductStatusControls
          productId={productId}
          status={product.status}
          readiness={readiness}
        />
      </div>

      <div className="mt-8 max-w-3xl">
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
    </>
  );
}
