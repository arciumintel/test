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
  partnerPlusReportToCsv,
  partnerPlusReportToHtml,
  partnerPlusReportToMarkdown,
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
  const user = auth.user;

  const range = resolveAnalyticsDateRange(
    parseAnalyticsRangePreset(parsed.data.rangePreset)
  );
  const data = await getPartnerPlusAnalytics(parsed.data.productId, range);
  if (!data) return { error: "Ecosystem project not found." };

  const courseDetails = await Promise.all(
    data.courses.map((c) =>
      getPartnerPlusCourseAnalytics(parsed.data.productId, c.courseId, range)
    )
  );
  const validCourses = courseDetails.filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  const slug = data.productName
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase()
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);

  trackEventFireAndForget({
    eventName: "partner_report_generated",
    source: "server_action",
    path: `/partner-console/${parsed.data.productId}/analytics/reports`,
    userId: user.id,
    ecosystemProjectId: parsed.data.productId,
    metadata: {
      reportPeriodStart: range.from?.toISOString().slice(0, 10) ?? "all",
      reportPeriodEnd: range.to.toISOString().slice(0, 10),
      courseCount: data.summary.publishedCourses,
      courseStarts: data.summary.starts,
      courseCompletions: data.summary.completions,
      badgeAwards: data.summary.badgeAwards,
      format: parsed.data.format,
      generatedBy: user.role === "staff_admin" ? "staff" : "partner",
    },
  });

  if (parsed.data.format === "csv") {
    return {
      ok: true,
      content: partnerPlusReportToCsv(data),
      filename: `arcademy-analytics-${slug}-${date}.csv`,
      mimeType: "text/csv;charset=utf-8",
    };
  }

  if (parsed.data.format === "html") {
    return {
      ok: true,
      content: partnerPlusReportToHtml(data, validCourses),
      filename: `arcademy-analytics-${slug}-${date}.html`,
      mimeType: "text/html;charset=utf-8",
    };
  }

  return {
    ok: true,
    content: partnerPlusReportToMarkdown(data, validCourses),
    filename: `arcademy-analytics-${slug}-${date}.md`,
    mimeType: "text/markdown;charset=utf-8",
  };
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
