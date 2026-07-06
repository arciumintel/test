"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isPartnerIntakeAvailable, prisma } from "@/lib/prisma";
import { generatePartnerReport } from "@/lib/analytics";
import { getProductAnalytics } from "@/lib/analytics";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { authorizeStaff, toActionError } from "@/lib/access-control";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const intakeSchema = z.object({
  productId: z.string().optional().nullable(),
  partnerName: z.string().min(2, "Partner name is required").max(120),
  contactName: z.string().max(120).optional().nullable(),
  contactEmail: z
    .union([z.string().email().max(200), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : null)),
  projectName: z.string().max(120).optional().nullable(),
  projectDescription: z.string().max(800).optional().nullable(),
  sourceMaterialUrl: z
    .union([z.string().url().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : null)),
  requestedCourseTopic: z.string().max(400).optional().nullable(),
  reviewStatus: z.enum([
    "received",
    "in_review",
    "draft_created",
    "partner_review",
    "approved",
    "published",
    "rejected",
  ]),
  notes: z.string().max(8000).optional().nullable(),
});

export async function createPartnerIntake(
  raw: z.input<typeof intakeSchema>
): Promise<Result<{ id: string }>> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    });
    if (!product) return { error: "Ecosystem project not found." };
  }

  if (!isPartnerIntakeAvailable()) {
    return {
      error:
        "Prisma client is out of date. Run pnpm db:generate, then restart the dev server.",
    };
  }

  try {
    const intake = await prisma.partnerIntake.create({
      data: {
        productId: parsed.data.productId || null,
        partnerName: parsed.data.partnerName,
        contactName: parsed.data.contactName?.trim() || null,
        contactEmail: parsed.data.contactEmail,
        projectName: parsed.data.projectName?.trim() || null,
        projectDescription: parsed.data.projectDescription?.trim() || null,
        sourceMaterialUrl: parsed.data.sourceMaterialUrl,
        requestedCourseTopic: parsed.data.requestedCourseTopic?.trim() || null,
        reviewStatus: parsed.data.reviewStatus,
        notes: parsed.data.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/partner-intake");
    return { ok: true, id: intake.id };
  } catch (e) {
    if (
      e instanceof TypeError &&
      String(e.message).includes("Cannot read properties of undefined")
    ) {
      return {
        error:
          "Prisma client is out of date. Run pnpm db:generate, then restart the dev server.",
      };
    }
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2021") {
      return {
        error:
          "Partner intake table is missing. Run pnpm db:push, then restart the dev server.",
      };
    }
    throw e;
  }
}

export async function updatePartnerIntake(
  id: string,
  raw: z.input<typeof intakeSchema>
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!isPartnerIntakeAvailable()) {
    return {
      error:
        "Prisma client is out of date. Run pnpm db:generate, then restart the dev server.",
    };
  }

  const existing = await prisma.partnerIntake.findUnique({ where: { id } });
  if (!existing) return { error: "Intake not found." };

  if (parsed.data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    });
    if (!product) return { error: "Ecosystem project not found." };
  }

  await prisma.partnerIntake.update({
    where: { id },
    data: {
      productId: parsed.data.productId || null,
      partnerName: parsed.data.partnerName,
      contactName: parsed.data.contactName?.trim() || null,
      contactEmail: parsed.data.contactEmail,
      projectName: parsed.data.projectName?.trim() || null,
      projectDescription: parsed.data.projectDescription?.trim() || null,
      sourceMaterialUrl: parsed.data.sourceMaterialUrl,
      requestedCourseTopic: parsed.data.requestedCourseTopic?.trim() || null,
      reviewStatus: parsed.data.reviewStatus,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/admin/partner-intake");
  revalidatePath(`/admin/partner-intake/${id}`);
  return { ok: true };
}

export async function exportPartnerReport(
  productId: string
): Promise<Result<{ markdown: string; filename: string }>> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const report = await generatePartnerReport(productId);
  if (!report) return { error: "Ecosystem project not found." };

  const staff = auth.user;
  const analytics = await getProductAnalytics(productId);
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 90);
  trackEventFireAndForget({
    eventName: "partner_report_generated",
    source: "admin",
    path: `/admin/products/${productId}`,
    userId: staff.id,
    ecosystemProjectId: productId,
    metadata: {
      adminUserId: staff.id,
      reportPeriodStart: periodStart.toISOString().slice(0, 10),
      reportPeriodEnd: now.toISOString().slice(0, 10),
      courseCount: analytics?.publishedCourses ?? 0,
      courseStarts: analytics?.starts ?? 0,
      courseCompletions: analytics?.completions ?? 0,
      badgeAwards: analytics?.badgeAwards ?? 0,
      format: "markdown",
    },
  });

  return { ok: true, markdown: report.markdown, filename: report.filename };
}
