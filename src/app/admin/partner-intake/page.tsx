import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import type { PartnerIntakeReviewStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Partner intake" };

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

type IntakeRow = {
  id: string;
  partnerName: string;
  requestedCourseTopic: string | null;
  reviewStatus: PartnerIntakeReviewStatus;
  updatedAt: Date;
  contactName: string | null;
  product: { name: string; slug: string } | null;
};

export default async function PartnerIntakeListPage() {
  let intakes: IntakeRow[] = [];
  let dbError = false;
  try {
    intakes = await prisma.partnerIntake.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { name: true, slug: true } },
      },
    });
  } catch {
    dbError = true;
    intakes = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partner intake</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track partner source material and review status internally. No
            partner login in V1.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/partner-intake/new">
            <Plus />
            New intake
          </Link>
        </Button>
      </div>

      {dbError && (
        <div className="mt-6 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          Partner intake table is not available yet. Run{" "}
          <code className="rounded bg-muted px-1">pnpm db:push</code> to apply
          the latest schema.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {intakes.length === 0 && !dbError && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <ClipboardList className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No partner intakes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an intake when a partner submits source material for a new
              or updated course.
            </p>
          </div>
        )}
        {intakes.map((intake) => (
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
                  <Badge
                    variant={STATUS_VARIANT[intake.reviewStatus]}
                    className="capitalize"
                  >
                    {intake.reviewStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {intake.requestedCourseTopic ||
                    intake.product?.name ||
                    "No topic linked"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {intake.updatedAt.toLocaleDateString()}
                  {intake.contactName ? ` · ${intake.contactName}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/partner-intake/${intake.id}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
