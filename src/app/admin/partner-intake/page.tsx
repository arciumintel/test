import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { prisma } from "@/lib/prisma";
import type { PartnerIntakeReviewStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Partner intake" };

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

type IntakeRow = {
  id: string;
  partnerName: string;
  projectName: string | null;
  requestedCourseTopic: string | null;
  reviewStatus: PartnerIntakeReviewStatus;
  updatedAt: Date;
  contactName: string | null;
  applicantUserId: string | null;
  productId: string | null;
  product: { name: string; slug: string } | null;
  applicant: { walletAddress: string } | null;
};

function isPendingApplication(intake: IntakeRow) {
  return (
    Boolean(intake.applicantUserId) &&
    !intake.productId &&
    (intake.reviewStatus === "received" || intake.reviewStatus === "in_review")
  );
}

export default async function PartnerIntakeListPage() {
  let intakes: IntakeRow[] = [];
  let dbError = false;
  try {
    intakes = await prisma.partnerIntake.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { name: true, slug: true } },
        applicant: { select: { walletAddress: true } },
      },
    });
  } catch {
    dbError = true;
    intakes = [];
  }

  const pendingCount = intakes.filter(isPendingApplication).length;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            Partner intake
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Review partner applications and track source material intake for
            staff-managed publishing.
          </p>
          {!dbError && pendingCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingCount} pending application
              {pendingCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/partner-intake/new">
            <Plus />
            New intake
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="mt-8">
          <HomeSectionLoadError
            title="Partner intake did not load"
            description="Intake records are unavailable right now. Refresh the page, or run pnpm db:push if the partner intake schema is new."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            All intakes ({intakes.length})
          </h2>
          {intakes.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
              <ClipboardList
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden
              />
              <p className="mt-3 font-medium">No partner intakes yet</p>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Create an intake when a partner submits source material, or
                review a partner application from the public apply form.
              </p>
            </div>
          ) : (
            intakes.map((intake) => (
              <Card key={intake.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/partner-intake/${intake.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {intake.partnerName}
                      </Link>
                      {isPendingApplication(intake) && (
                        <Badge variant="default">Partner application</Badge>
                      )}
                      <Badge
                        variant={STATUS_VARIANT[intake.reviewStatus]}
                        className="capitalize"
                      >
                        {intake.reviewStatus.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {intake.projectName ||
                        intake.requestedCourseTopic ||
                        intake.product?.name ||
                        "No topic linked"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {intake.updatedAt.toLocaleDateString()}
                      {intake.contactName ? ` · ${intake.contactName}` : ""}
                      {intake.applicant?.walletAddress
                        ? ` · ${intake.applicant.walletAddress.slice(0, 4)}…${intake.applicant.walletAddress.slice(-4)}`
                        : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/partner-intake/${intake.id}`}>
                      Open
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </>
  );
}
