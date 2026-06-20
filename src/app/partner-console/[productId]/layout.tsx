import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartnerProductNav } from "@/components/partner-console/partner-product-nav";
import { getProjectAdminAccess } from "@/lib/project-admin";
import { prisma } from "@/lib/prisma";

export default async function PartnerProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const access = await getProjectAdminAccess(productId);

  if (!access.user) {
    redirect("/partner-console");
  }

  if (!access.canManage) {
    redirect("/partner-console?access=denied");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/partner-console"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Partner console
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xl font-semibold tracking-tight">{product.name}</p>
        <Badge variant="secondary" className="capitalize">
          {product.status}
        </Badge>
      </div>

      <PartnerProductNav productId={productId} />

      <div className="mt-8">{children}</div>
    </div>
  );
}
