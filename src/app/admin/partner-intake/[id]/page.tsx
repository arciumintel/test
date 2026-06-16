import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartnerIntakeForm } from "@/components/admin/partner-intake-form";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import type { PartnerIntakeReviewStatus } from "@prisma/client";

const STATUS_VARIANT: Record<
  PartnerIntakeReviewStatus,
  "success" | "muted" | "secondary" | "default"
> = {
  received: "secondary",
  in_review: "default",
  draft_created: "default",
  partner_review: "default",
  approved: "muted",
  published: "success",
};

export default async function PartnerIntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [intake, products] = await Promise.all([
    prisma.partnerIntake.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!intake) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/admin/partner-intake"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Partner intake
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intake.partnerName}
        </h1>
        <Badge
          variant={STATUS_VARIANT[intake.reviewStatus]}
          className="capitalize"
        >
          {intake.reviewStatus.replace(/_/g, " ")}
        </Badge>
      </div>
      {intake.product && (
        <p className="mt-1 text-sm text-muted-foreground">
          Linked to{" "}
          <Link
            href={`/admin/products/${intake.product.id}`}
            className="text-primary hover:underline"
          >
            {intake.product.name}
          </Link>
          {" · "}
          <Link
            href={productPath(intake.product.slug)}
            className="text-primary hover:underline"
            target="_blank"
          >
            Public page
          </Link>
        </p>
      )}

      <div className="mt-8">
        <PartnerIntakeForm
          products={products}
          initial={{
            id: intake.id,
            productId: intake.productId,
            partnerName: intake.partnerName,
            contactName: intake.contactName,
            contactEmail: intake.contactEmail,
            sourceMaterialUrl: intake.sourceMaterialUrl,
            requestedCourseTopic: intake.requestedCourseTopic,
            reviewStatus: intake.reviewStatus,
            notes: intake.notes,
          }}
        />
      </div>
    </div>
  );
}
