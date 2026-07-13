"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import {
  getPartnerPlusAnalytics,
  getPartnerPlusCourseAnalytics,
} from "@/lib/partner-analytics";
import {
  ACCESS_MESSAGES,
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

export async function getPartnerAnalyticsOverview(
  productId: string,
  rangePreset?: string
): Promise<Result<{ data: NonNullable<Awaited<ReturnType<typeof getPartnerPlusAnalytics>>> }>> {
  const auth = await authorizeProjectAdmin(
    productId,
    ACCESS_MESSAGES.analyticsForbidden
  );
  if (!auth.ok) return toActionError(auth);

  const range = resolveAnalyticsDateRange(parseAnalyticsRangePreset(rangePreset));
  const data = await getPartnerPlusAnalytics(productId, range);
  if (!data) return { error: "Ecosystem project not found." };

  return { ok: true, data };
}

export async function getPartnerAnalyticsCourse(
  productId: string,
  courseId: string,
  rangePreset?: string
): Promise<
  Result<{ data: NonNullable<Awaited<ReturnType<typeof getPartnerPlusCourseAnalytics>>> }>
> {
  const auth = await authorizeProjectAdmin(
    productId,
    ACCESS_MESSAGES.analyticsForbidden
  );
  if (!auth.ok) return toActionError(auth);

  const range = resolveAnalyticsDateRange(parseAnalyticsRangePreset(rangePreset));
  const data = await getPartnerPlusCourseAnalytics(productId, courseId, range);
  if (!data) return { error: "Course not found." };

  return { ok: true, data };
}

const exportSchema = z.object({
  productId: z.string().min(1),
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
  format: z.enum(["markdown", "csv", "html"]),
});

export async function exportPartnerPlusReport(
  raw: z.input<typeof exportSchema>
): Promise<Result<{ content: string; filename: string; mimeType: string }>> {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const auth = await authorizeProjectAdmin(
    parsed.data.productId,
    ACCESS_MESSAGES.analyticsForbidden
  );
  if (!auth.ok) return toActionError(auth);

  const { buildAnalyticsExport } = await import("@/lib/analytics-export");
  const built = await buildAnalyticsExport({
    productId: parsed.data.productId,
    rangePreset: parsed.data.rangePreset,
    compareBaseline: "none",
    format: parsed.data.format,
  });
  if (!built) return { error: "Ecosystem project not found." };

  const range = resolveAnalyticsDateRange(
    parseAnalyticsRangePreset(parsed.data.rangePreset)
  );

  trackEventFireAndForget({
    eventName: "partner_report_generated",
    source: "server_action",
    path: `/partner-console/${parsed.data.productId}/analytics`,
    userId: auth.user.id,
    ecosystemProjectId: parsed.data.productId,
    metadata: {
      reportPeriodStart: range.from?.toISOString().slice(0, 10) ?? "all",
      reportPeriodEnd: range.to.toISOString().slice(0, 10),
      format: parsed.data.format,
      generatedBy: auth.user.role === "staff_admin" ? "staff" : "partner",
      engine: "unified",
    },
  });

  return { ok: true, ...built };
}

export async function updatePartnerAnalyticsNotes(
  productId: string,
  notes: string | null
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);
  if (auth.user.role !== "staff_admin") {
    return { error: "Only staff can update partner analytics notes." };
  }

  const { prisma } = await import("@/lib/prisma");
  await prisma.product.update({
    where: { id: productId },
    data: { partnerAnalyticsNotes: notes?.trim() || null },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/partner-console/${productId}/analytics`);

  return { ok: true };
}
