import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PartnerSelfServicePanel } from "@/components/project-console/partner-self-service-panel";
import { getPartnerSelfServiceData } from "@/app/actions/project-partner-self-service";
import { getProjectAdminAccess } from "@/lib/project-admin";
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
    title: product ? `Self-service — ${product.name}` : "Partner self-service",
  };
}

export default async function PartnerSelfServicePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const access = await getProjectAdminAccess(productId);
  if (!access.user) redirect("/courses");
  if (!access.canManage) redirect("/project-console");

  const result = await getPartnerSelfServiceData(productId);
  if ("error" in result) {
    if (result.error.includes("permission")) redirect("/project-console");
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/project-console"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Project console
      </Link>

      <PartnerSelfServicePanel
        productId={productId}
        initial={result.data}
      />
    </div>
  );
}
