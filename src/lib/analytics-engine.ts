/**
 * Analytics engine — orchestrates providers into section DTOs.
 */

import "server-only";

import type {
  AnalyticsCompareBaseline,
  AnalyticsDateRange,
  AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import {
  resolvePriorPeriod,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { getBehaviourAnalytics } from "@/lib/analytics-behaviour";
import { getCohortAnalytics } from "@/lib/analytics-cohorts";
import { getConversionAnalytics } from "@/lib/analytics-conversions";
import { ensureAnalyticsProfileForProduct } from "@/lib/analytics-profile";
import {
  buildAnalyticsRecommendations,
  type AnalyticsRecommendation,
  type RecommendationPolicy,
} from "@/lib/analytics-recommendations";
import {
  computeMetricsViaProviders,
  type AnalyticsProfileRef,
  type MetricValue,
} from "@/lib/analytics-providers";
import {
  getLearnerFunnel,
  getPartnerPlusAnalytics,
  getWeeklyTrends,
  type FunnelStep,
  type PartnerPlusAnalytics,
  type WeeklyTrendPoint,
} from "@/lib/partner-analytics";
import type { ProductCourseMetric } from "@/lib/analytics";
import { ensureAnalyticsProvidersRegistered } from "@/lib/analytics-providers";
import { getCertificationAnalytics } from "@/lib/certifications";
import { getConceptMasteryRows } from "@/lib/concept-mastery";
import { evaluateReadinessModels } from "@/lib/readiness-eval";
import { getQuestionIntelligenceRows } from "@/lib/question-intelligence";
import { prisma } from "@/lib/prisma";

export const ANALYTICS_ENGINE_SCHEMA_VERSION = 2;

export type AnalyticsEngineResult = {
  productId: string;
  productName: string;
  range: AnalyticsDateRange;
  compare: AnalyticsCompareBaseline;
  priorPeriod: AnalyticsDateRange | null;
  metrics: MetricValue[];
  metricsById: Record<string, MetricValue>;
  overview: {
    summary: PartnerPlusAnalytics["summary"];
    discovery: PartnerPlusAnalytics["discovery"];
    funnel: FunnelStep[];
    weeklyTrends: WeeklyTrendPoint[];
    staffNotes: string | null;
    conversions: Awaited<ReturnType<typeof getConversionAnalytics>>;
    cohorts: Awaited<ReturnType<typeof getCohortAnalytics>>;
    behaviour: Awaited<ReturnType<typeof getBehaviourAnalytics>>;
  };
  courses: ProductCourseMetric[];
  recommendations: AnalyticsRecommendation[];
  computedAt: string;
};

function toProfileRef(
  productId: string,
  profile: {
    schemaVersion: number;
    enabledProviderIds: string[];
    kpiSet: string[];
    funnelStages: string[];
  }
): AnalyticsProfileRef {
  return {
    productId,
    schemaVersion: profile.schemaVersion,
    enabledProviderIds: profile.enabledProviderIds,
    kpiSet: profile.kpiSet,
    funnelStages: profile.funnelStages,
  };
}

export async function runAnalyticsEngine(input: {
  productId: string;
  preset?: AnalyticsRangePreset;
  compare?: AnalyticsCompareBaseline;
  range?: AnalyticsDateRange;
}): Promise<AnalyticsEngineResult | null> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, name: true },
  });
  if (!product) return null;

  ensureAnalyticsProvidersRegistered();
  await ensureAnalyticsProfileForProduct(product.id);
  const profile = await prisma.analyticsProfile.findUniqueOrThrow({
    where: { productId: product.id },
  });

  const range =
    input.range ?? resolveAnalyticsDateRange(input.preset ?? "30d");
  const compare = input.compare ?? "none";
  const priorPeriod = resolvePriorPeriod(range, compare);

  const profileRef = toProfileRef(product.id, profile);
  const bags = await computeMetricsViaProviders({
    productId: product.id,
    range,
    profile: profileRef,
    priorPeriod: priorPeriod ?? undefined,
  });

  const metrics = bags.flatMap((b) => b.metrics);
  const metricsById = Object.fromEntries(metrics.map((m) => [m.metricId, m]));

  const plus = await getPartnerPlusAnalytics(product.id, range);
  if (!plus) return null;

  const [conversions, cohorts, behaviour, readiness, certs, concepts, questions] =
    await Promise.all([
      getConversionAnalytics(product.id, range),
      getCohortAnalytics(product.id, range),
      getBehaviourAnalytics(product.id, range),
      evaluateReadinessModels(product.id, range),
      getCertificationAnalytics(product.id, range),
      getConceptMasteryRows(product.id, range).catch(() => []),
      getQuestionIntelligenceRows(product.id, range, { minAttempts: 3, limit: 20 }).catch(
        () => []
      ),
    ]);

  const criticalConcepts = concepts.filter((c) => c.importance === "critical");
  const criticalMastery =
    criticalConcepts.length > 0
      ? (() => {
          const withData = criticalConcepts.filter((c) => c.masteryPct !== null);
          if (withData.length === 0) return null;
          return Math.round(
            withData.reduce((s, c) => s + (c.masteryPct ?? 0), 0) /
              withData.length
          );
        })()
      : null;

  const topMiss =
    questions.length > 0 ? (questions[0].missRatePct ?? null) : null;

  const defaultReadiness = readiness.find((r) => r.isDefault) ?? readiness[0];
  const readinessSetupNeeded = Boolean(
    defaultReadiness?.components.some((c) => c.status === "setup_needed")
  );

  const policy =
    (profile.recommendationPolicy as RecommendationPolicy | null) ?? {};

  const recommendations = buildAnalyticsRecommendations({
    productId: product.id,
    metrics: Object.fromEntries(
      metrics.map((m) => [
        m.metricId,
        { value: m.value, deltaPct: m.deltaPct ?? null },
      ])
    ),
    funnel: plus.funnel,
    policy,
    criticalConceptMasteryPct: criticalMastery,
    topQuestionMissRatePct: topMiss,
    readinessAverageScore: defaultReadiness?.averageScore ?? null,
    readinessSetupNeeded,
    certificationCount: certs.certifications.length,
    certificationAttainmentPct:
      certs.learnersStarted > 0 && certs.awardsInRange >= 0
        ? Math.round((certs.awardsInRange / Math.max(1, certs.learnersStarted)) * 100)
        : null,
    conversionSetupNeeded: conversions.setupNeeded,
  });

  return {
    productId: product.id,
    productName: product.name,
    range,
    compare,
    priorPeriod,
    metrics,
    metricsById,
    overview: {
      summary: plus.summary,
      discovery: plus.discovery,
      funnel: plus.funnel,
      weeklyTrends: plus.weeklyTrends,
      staffNotes: plus.staffNotes,
      conversions,
      cohorts,
      behaviour,
    },
    courses: plus.courses,
    recommendations,
    computedAt: new Date().toISOString(),
  };
}

/** Lightweight re-export helpers used by snapshots. */
export { getLearnerFunnel, getWeeklyTrends };
