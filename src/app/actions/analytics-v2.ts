"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  parseAnalyticsCompareBaseline,
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
  type AnalyticsCompareBaseline,
  type AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import {
  authorizeAnalyticsRead,
  authorizeAnalyticsSensitiveConfig,
  toAnalyticsActionError,
} from "@/lib/access-control";
import { runAnalyticsEngine } from "@/lib/analytics-engine";
import { buildAnalyticsExport } from "@/lib/analytics-export";
import { isAnalyticsV2Enabled, setAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import {
  buildAnalyticsSnapshot,
  getAnalyticsEngineView,
} from "@/lib/analytics-snapshots";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { ensureAnalyticsProfileForProduct } from "@/lib/analytics-profile";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function revalidateAnalytics(productId: string) {
  revalidatePath(`/partner-console/${productId}/analytics`);
  revalidatePath(`/partner-console/${productId}/analytics/courses`);
  revalidatePath(`/partner-console/${productId}/analytics/recommendations`);
  revalidatePath(`/partner-console/${productId}/analytics/settings`);
}

export async function getAnalyticsV2Overview(
  productId: string,
  rangePreset?: string,
  compareBaseline?: string
): Promise<
  Result<{
    data: Awaited<ReturnType<typeof getAnalyticsEngineView>>["data"];
    freshness: Omit<
      Awaited<ReturnType<typeof getAnalyticsEngineView>>["freshness"],
      "builtAt"
    > & { builtAt: string | null };
    fromSnapshot: boolean;
    accessLevel: string;
    canRefresh: boolean;
  }>
> {
  const auth = await authorizeAnalyticsRead(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const preset = parseAnalyticsRangePreset(rangePreset);
  const compare = parseAnalyticsCompareBaseline(compareBaseline);
  const view = await getAnalyticsEngineView({
    productId,
    preset,
    compare,
    allowLiveFallback: true,
  });

  return {
    ok: true,
    data: view.data,
    freshness: {
      ...view.freshness,
      builtAt: view.freshness.builtAt?.toISOString() ?? null,
    },
    fromSnapshot: view.fromSnapshot,
    accessLevel: auth.level,
    canRefresh:
      auth.level === "platform_admin" || auth.level === "owner",
  };
}

export async function refreshAnalyticsSnapshot(
  productId: string,
  rangePreset?: string,
  compareBaseline?: string
): Promise<Result<{ snapshotId: string }>> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const preset = parseAnalyticsRangePreset(rangePreset) as AnalyticsRangePreset;
  const compare = parseAnalyticsCompareBaseline(
    compareBaseline
  ) as AnalyticsCompareBaseline;

  const result = await buildAnalyticsSnapshot({
    productId,
    preset,
    compare,
    trigger: "manual",
    requestedByUserId: auth.user.id,
  });

  revalidateAnalytics(productId);
  if (!result.ok) return { error: result.error };
  return { ok: true, snapshotId: result.snapshotId };
}

export async function setProductAnalyticsV2Flag(
  productId: string,
  enabled: boolean
): Promise<Result<{ enabled: boolean }>> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  await ensureAnalyticsProfileForProduct(productId);
  await setAnalyticsV2Enabled(productId, enabled);
  revalidateAnalytics(productId);
  return { ok: true, enabled };
}

export async function getProductAnalyticsV2Flag(
  productId: string
): Promise<Result<{ enabled: boolean }>> {
  const auth = await authorizeAnalyticsRead(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);
  const enabled = await isAnalyticsV2Enabled(productId);
  return { ok: true, enabled };
}

const exportSchema = z.object({
  productId: z.string().min(1),
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
  compareBaseline: z
    .enum(["none", "previous_week", "previous_month", "previous_quarter"])
    .optional(),
  format: z.enum(["markdown", "csv", "html"]),
  scope: z
    .enum([
      "overview",
      "courses",
      "course",
      "concepts",
      "assessments",
      "readiness",
      "certifications",
      "recommendations",
      "full",
    ])
    .optional()
    .default("full"),
  courseId: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.scope === "course" && !val.courseId) {
    ctx.addIssue({
      code: "custom",
      message: "courseId is required when scope is course",
      path: ["courseId"],
    });
  }
});

/**
 * Export uses scoped V2 serializers (or Plus when V2 is off).
 */
export async function exportAnalyticsReport(
  raw: z.input<typeof exportSchema>
): Promise<Result<{ content: string; filename: string; mimeType: string }>> {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const auth = await authorizeAnalyticsRead(parsed.data.productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const preset = parseAnalyticsRangePreset(parsed.data.rangePreset);
  const compare = parseAnalyticsCompareBaseline(parsed.data.compareBaseline);
  const v2 = await isAnalyticsV2Enabled(parsed.data.productId);

  const built = await buildAnalyticsExport({
    productId: parsed.data.productId,
    rangePreset: preset,
    compareBaseline: compare,
    format: parsed.data.format,
    scope: parsed.data.scope,
    courseId: parsed.data.courseId,
  });
  if (!built) return { error: "Ecosystem project not found." };

  trackEventFireAndForget({
    eventName: "partner_report_generated",
    source: "server_action",
    path: `/partner-console/${parsed.data.productId}/analytics`,
    userId: auth.user.id,
    ecosystemProjectId: parsed.data.productId,
    metadata: {
      format: parsed.data.format,
      rangePreset: preset,
      compare,
      scope: parsed.data.scope,
      generatorRole: auth.level,
      engine: v2 ? "v2" : "plus",
    },
  });

  return { ok: true, ...built };
}
