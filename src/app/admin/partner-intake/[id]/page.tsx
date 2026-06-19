import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartnerIntakeForm } from "@/components/admin/partner-intake-form";
import { PartnerApplicationApprovalPanel } from "@/components/admin/partner-application-approval-panel";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import type { PartnerIntakeReviewStatus } from "@prisma/client";

const STATUS_VARIANT: Record<
  PartnerIntakeReviewStatus,
  "success" | "muted" | "secondary" | "default" | "destructive"
> = {
  received: "secondary",
  in_review: "default",
  draft_created: "default",
  partner_review: "default",
  approved: "muted",
  published: "success",
  rejected: "destructive",
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
      include: {
        product: { select: { id: true, name: true, slug: true } },
        applicant: { select: { id: true, walletAddress: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!intake) notFound();

  const isPendingApplication =
    Boolean(intake.applicantUserId) &&
    !intake.productId &&
    (intake.reviewStatus === "received" || intake.reviewStatus === "in_review");

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
        {intake.applicantUserId && !intake.productId && (
          <Badge variant="default">Partner application</Badge>
        )}
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
          {" · "}
          <Link
            href={`/partner-console/${intake.product.id}/courses`}
            className="text-primary hover:underline"
          >
            Partner console
          </Link>
        </p>
      )}

      {intake.applicant && (
        <div className="mt-6 rounded-lg border bg-muted/20 p-4 text-sm">
          <p className="font-medium">Applicant wallet</p>
          <p className="mt-1 font-mono text-muted-foreground">
            {intake.applicant.walletAddress}
          </p>
          {intake.projectName && (
            <p className="mt-3">
              <span className="font-medium">Requested project: </span>
              {intake.projectName}
            </p>
          )}
          {intake.projectDescription && (
            <p className="mt-2 text-muted-foreground">
              {intake.projectDescription}
            </p>
          )}
        </div>
      )}

      {isPendingApplication && (
        <div className="mt-6">
          <PartnerApplicationApprovalPanel
            intakeId={intake.id}
            canApprove={isPendingApplication}
          />
        </div>
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
            projectName: intake.projectName,
            projectDescription: intake.projectDescription,
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
