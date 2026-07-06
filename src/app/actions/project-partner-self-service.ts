"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PartnerIntakeReviewStatus } from "@prisma/client";
import { isPartnerIntakeAvailable, prisma } from "@/lib/prisma";
import {
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const partnerFieldsSchema = z.object({
  sourceMaterialUrl: z
    .union([z.string().url().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : null)),
  requestedCourseTopic: z.string().max(400).optional().nullable(),
  partnerNotes: z.string().max(8000).optional().nullable(),
});

/** Partner may only advance to partner_review from draft_created. */
const PARTNER_STATUS_TRANSITIONS: Partial<
  Record<PartnerIntakeReviewStatus, PartnerIntakeReviewStatus[]>
> = {
  draft_created: ["partner_review"],
};

function selfServicePath(productId: string) {
  return `/partner-console/${productId}/self-service`;
}

export type PartnerSelfServicePayload = {
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
    partnerName: string | null;
    referralUrl: string | null;
  };
  intake: {
    id: string;
    sourceMaterialUrl: string | null;
    requestedCourseTopic: string | null;
    reviewStatus: PartnerIntakeReviewStatus;
    partnerNotes: string | null;
    updatedAt: string;
    canSubmitForReview: boolean;
  } | null;
  /** Most recently updated non-published course, for draft review handoff. */
  reviewDraftCourse: { id: string; title: string } | null;
  hasPublishedCourses: boolean;
};

export async function getPartnerSelfServiceData(
  productId: string
): Promise<Result<{ data: PartnerSelfServicePayload }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      partnerName: true,
      referralUrl: true,
    },
  });
  if (!product) return { error: "Ecosystem project not found." };

  const [reviewDraftCourse, publishedCourseCount] = await Promise.all([
    prisma.course.findFirst({
      where: {
        productId,
        status: { notIn: ["published", "archived"] },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.course.count({
      where: { productId, status: "published" },
    }),
  ]);

  let intake: PartnerSelfServicePayload["intake"] = null;
  if (isPartnerIntakeAvailable()) {
    const row = await prisma.partnerIntake.findFirst({
      where: { productId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        sourceMaterialUrl: true,
        requestedCourseTopic: true,
        reviewStatus: true,
        notes: true,
        updatedAt: true,
      },
    });
    if (row) {
      intake = {
        id: row.id,
        sourceMaterialUrl: row.sourceMaterialUrl,
        requestedCourseTopic: row.requestedCourseTopic,
        reviewStatus: row.reviewStatus,
        partnerNotes: row.notes,
        updatedAt: row.updatedAt.toISOString(),
        canSubmitForReview: row.reviewStatus === "draft_created",
      };
    }
  }

  return {
    ok: true,
    data: {
      product,
      intake,
      reviewDraftCourse,
      hasPublishedCourses: publishedCourseCount > 0,
    },
  };
}

export async function upsertPartnerIntakeFields(
  productId: string,
  raw: z.input<typeof partnerFieldsSchema>
): Promise<Result<{ intakeId: string }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const parsed = partnerFieldsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!isPartnerIntakeAvailable()) {
    return {
      error:
        "Partner intake is unavailable. Run pnpm db:generate and restart the dev server.",
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, partnerName: true },
  });
  if (!product) return { error: "Ecosystem project not found." };

  const existing = await prisma.partnerIntake.findFirst({
    where: { productId },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    sourceMaterialUrl: parsed.data.sourceMaterialUrl,
    requestedCourseTopic: parsed.data.requestedCourseTopic?.trim() || null,
    notes: parsed.data.partnerNotes?.trim() || null,
  };

  let intakeId: string;

  if (existing) {
    if (
      existing.reviewStatus === "approved" ||
      existing.reviewStatus === "published"
    ) {
      return {
        error:
          "This intake is finalized. Contact Arcademy staff to request changes.",
      };
    }

    const updated = await prisma.partnerIntake.update({
      where: { id: existing.id },
      data,
    });
    intakeId = updated.id;
  } else {
    const created = await prisma.partnerIntake.create({
      data: {
        productId,
        partnerName: product.partnerName?.trim() || product.name,
        sourceMaterialUrl: data.sourceMaterialUrl,
        requestedCourseTopic: data.requestedCourseTopic,
        notes: data.notes,
        reviewStatus: "received",
      },
    });
    intakeId = created.id;
  }

  revalidatePath(selfServicePath(productId));
  revalidatePath("/admin/partner-intake");
  return { ok: true, intakeId };
}

export async function submitPartnerReview(
  productId: string
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  if (!isPartnerIntakeAvailable()) {
    return {
      error:
        "Partner intake is unavailable. Run pnpm db:generate and restart the dev server.",
    };
  }

  const intake = await prisma.partnerIntake.findFirst({
    where: { productId },
    orderBy: { updatedAt: "desc" },
  });
  if (!intake) {
    return { error: "No intake record found. Save your materials first." };
  }

  const allowed = PARTNER_STATUS_TRANSITIONS[intake.reviewStatus] ?? [];
  if (!allowed.includes("partner_review")) {
    return {
      error:
        "You cannot submit for review at this stage. Wait for Arcademy staff to prepare a draft.",
    };
  }

  await prisma.partnerIntake.update({
    where: { id: intake.id },
    data: { reviewStatus: "partner_review" },
  });

  revalidatePath(selfServicePath(productId));
  revalidatePath("/admin/partner-intake");
  revalidatePath(`/admin/partner-intake/${intake.id}`);
  return { ok: true };
}
