/**
 * Core metric provider — partner-safe catalogue metrics from transactional + event data.
 */

import "server-only";

import {
  CORE_PROVIDER_ID,
  getMetricDefinition,
  listMetricsByProvider,
} from "@/lib/analytics-metrics";
import type {
  MetricBag,
  MetricContext,
  MetricProvider,
  MetricValue,
} from "@/lib/analytics-providers";
import {
  getLearnerFunnel,
  getPartnerPlusAnalytics,
} from "@/lib/partner-analytics";
import { prisma } from "@/lib/prisma";

function deltaPct(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return Math.round(((current - prior) / Math.abs(prior)) * 1000) / 10;
}

function metric(
  metricId: string,
  value: number | null,
  priorValue: number | null | undefined,
  unit: MetricValue["unit"]
): MetricValue | null {
  const def = getMetricDefinition(metricId);
  if (!def || !def.partnerSafe) return null;
  const prior = priorValue ?? null;
  return {
    metricId,
    value,
    priorValue: prior,
    delta:
      value !== null && prior !== null
        ? Math.round((value - prior) * 10) / 10
        : null,
    deltaPct: deltaPct(value, prior),
    unit,
    partnerSafe: true,
  };
}

async function countConversions(
  productId: string,
  range: MetricContext["range"]
): Promise<number> {
  const { occurredAtFilter } = await import("@/lib/analytics-date-range");
  const occurredAt = occurredAtFilter(range);
  return prisma.analyticsEvent.count({
    where: {
      ecosystemProjectId: productId,
      eventName: { in: ["conversion_triggered", "docs_visited"] },
      ...(occurredAt ? { occurredAt } : {}),
    },
  });
}

async function computeBagForRange(
  ctx: MetricContext,
  range: MetricContext["range"]
): Promise<Record<string, number | null>> {
  const data = await getPartnerPlusAnalytics(ctx.productId, range);
  if (!data) return {};

  const conversions = await countConversions(ctx.productId, range);
  const starts = data.summary.starts;

  return {
    active_learners: starts,
    completion_rate: data.summary.completionRate,
    badges_awarded: data.summary.badgeAwards,
    quiz_pass_rate: data.summary.quizPassRate,
    course_detail_views: data.discovery.courseDetailViews,
    start_conversion_rate: data.discovery.startConversionRate,
    badge_verification_views: data.discovery.badgeVerificationViews,
    conversion_count: conversions,
    conversion_rate:
      starts > 0 ? Math.round((conversions / starts) * 100) : null,
    health_score: computeHealthScore({
      completionRate: data.summary.completionRate,
      quizPassRate: data.summary.quizPassRate,
      startConversion: data.discovery.startConversionRate,
    }),
    certifications_awarded: await prisma.certificationAward.count({
      where: {
        certification: { productId: ctx.productId },
        awardedAt: {
          ...(range.from ? { gte: range.from } : {}),
          lte: range.to,
        },
      },
    }),
  };
}

function computeHealthScore(input: {
  completionRate: number;
  quizPassRate: number | null;
  startConversion: number | null;
}): number {
  const parts = [
    input.completionRate,
    input.quizPassRate ?? input.completionRate,
    input.startConversion ?? input.completionRate,
  ];
  return Math.round(parts.reduce((s, n) => s + n, 0) / parts.length);
}

export const coreMetricProvider: MetricProvider = {
  id: CORE_PROVIDER_ID,
  displayName: "Core Analytics",
  metricIds: listMetricsByProvider(CORE_PROVIDER_ID)
    .filter((m) => m.partnerSafe)
    .map((m) => m.id),

  async compute(ctx: MetricContext): Promise<MetricBag> {
    const current = await computeBagForRange(ctx, ctx.range);
    const prior = ctx.priorPeriod
      ? await computeBagForRange(ctx, ctx.priorPeriod)
      : {};

    const units: Record<string, MetricValue["unit"]> = {
      active_learners: "count",
      completion_rate: "percent",
      badges_awarded: "count",
      quiz_pass_rate: "percent",
      course_detail_views: "count",
      start_conversion_rate: "percent",
      badge_verification_views: "count",
      conversion_count: "count",
      conversion_rate: "percent",
      health_score: "score",
      certifications_awarded: "count",
    };

    const phase2Ids = [
      "health_score",
      "active_learners",
      "completion_rate",
      "badges_awarded",
      "quiz_pass_rate",
      "course_detail_views",
      "start_conversion_rate",
      "badge_verification_views",
      "conversion_count",
      "conversion_rate",
      "certifications_awarded",
    ] as const;

    const metrics: MetricValue[] = [];
    for (const id of phase2Ids) {
      const row = metric(id, current[id] ?? null, prior[id], units[id]);
      if (row) metrics.push(row);
    }

    // Funnel stage metrics (aggregate first→last conversion)
    const funnel = await getLearnerFunnel(ctx.productId, ctx.range);
    if (funnel.length >= 2) {
      const first = funnel[0]?.count ?? 0;
      const last = funnel[funnel.length - 1]?.count ?? 0;
      const priorFunnel = ctx.priorPeriod
        ? await getLearnerFunnel(ctx.productId, ctx.priorPeriod)
        : null;
      const priorFirst = priorFunnel?.[0]?.count ?? null;
      const priorLast = priorFunnel?.[priorFunnel.length - 1]?.count ?? null;
      const priorRate =
        priorFirst && priorFirst > 0 && priorLast !== null
          ? Math.round((priorLast / priorFirst) * 100)
          : null;

      const funnelRate =
        first > 0 ? Math.round((last / first) * 100) : null;
      const funnelMetric = metric(
        "funnel_stage_conversion",
        funnelRate,
        priorRate,
        "percent"
      );
      if (funnelMetric) metrics.push(funnelMetric);
    }

    return {
      providerId: CORE_PROVIDER_ID,
      metrics,
      computedAt: new Date(),
    };
  },
};
