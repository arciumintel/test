import { notFound } from "next/navigation";
import { PartnerSelfServicePanel } from "@/components/partner-console/partner-self-service-panel";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { getPartnerSelfServiceData } from "@/app/actions/project-partner-self-service";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  return {
    title: product ? `Self-service: ${product.name}` : "Partner self-service",
  };
}

export default async function PartnerSelfServicePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const result = await getPartnerSelfServiceData(productId);
  if ("error" in result) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">
          Partner self-service
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Submit materials, track review progress, and view basic course
          performance.
        </p>
        <div className="mt-8">
          <HomeSectionLoadError
            title="Self-service did not load"
            description="Partner self-service data is unavailable right now. Refresh the page, or try again in a few minutes."
          />
        </div>
      </>
    );
  }

  return (
    <PartnerSelfServicePanel productId={productId} initial={result.data} />
  );
}
