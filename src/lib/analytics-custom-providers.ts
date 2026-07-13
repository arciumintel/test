/**
 * Custom metric providers (Phase 5).
 *
 * Advanced partners enable providers via AnalyticsProfile.enabledProviderIds (Owner+).
 * All providers must emit partnerSafe metrics scoped to ctx.productId only.
 *
 * @see docs/analytics_versioning.md
 */

import "server-only";

import { getMetricDefinition, listMetricsByProvider } from "@/lib/analytics-metrics";
import type { MetricBag, MetricContext, MetricProvider } from "@/lib/analytics-providers";
import { registerMetricProvider } from "@/lib/analytics-providers";
import { occurredAtFilter } from "@/lib/analytics-date-range";
import { prisma } from "@/lib/prisma";

/** Example custom provider id — enable in settings for advanced partners. */
export const EXAMPLE_CUSTOM_PROVIDER_ID = "example_engagement" as const;

let customProvidersBootstrapped = false;

/**
 * Lesson engagement rate: lesson_completed / lesson_viewed × 100 for the tenant.
 * partnerSafe; single-product scope only.
 */
const exampleEngagementProvider: MetricProvider = {
  id: EXAMPLE_CUSTOM_PROVIDER_ID,
  displayName: "Example engagement provider",
  metricIds: ["lesson_engagement_rate"],

  async compute(ctx: MetricContext): Promise<MetricBag> {
    const productId = ctx.productId;
    const occurredAt = occurredAtFilter(ctx.range);

    const [views, completions] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          ecosystemProjectId: productId,
          eventName: "lesson_viewed",
          ...(occurredAt ? { occurredAt } : {}),
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          ecosystemProjectId: productId,
          eventName: "lesson_completed",
          ...(occurredAt ? { occurredAt } : {}),
        },
      }),
    ]);

    const value =
      views > 0 ? Math.round((completions / views) * 100) : null;

    return {
      providerId: EXAMPLE_CUSTOM_PROVIDER_ID,
      metrics: [
        {
          metricId: "lesson_engagement_rate",
          value,
          priorValue: null,
          delta: null,
          deltaPct: null,
          unit: "percent",
          partnerSafe: true,
        },
      ],
      computedAt: new Date(),
    };
  },
};

function validateProviderMetrics(provider: MetricProvider): void {
  for (const metricId of provider.metricIds) {
    const def = getMetricDefinition(metricId);
    if (!def) {
      throw new Error(
        `Provider ${provider.id} references unknown metric: ${metricId}`
      );
    }
    if (def.providerId !== provider.id && def.providerId !== "core") {
      throw new Error(
        `Metric ${metricId} catalogue providerId is ${def.providerId}, not ${provider.id}`
      );
    }
    if (!def.partnerSafe) {
      throw new Error(
        `Provider ${provider.id} metric ${metricId} is not partnerSafe`
      );
    }
  }
}

/** Idempotent — registers shipped custom providers (not core). */
export function ensureCustomMetricProvidersRegistered(): void {
  if (customProvidersBootstrapped) return;
  customProvidersBootstrapped = true;

  validateProviderMetrics(exampleEngagementProvider);
  try {
    registerMetricProvider(exampleEngagementProvider);
  } catch {
    // already registered (HMR)
  }
}

export type ProviderCatalogEntry = {
  id: string;
  displayName: string;
  metricIds: string[];
  partnerSafe: true;
  /** When true, Owner+ can toggle in settings. */
  enableable: boolean;
};

/** Providers available for enablement (excludes core — always on). */
export function listEnableableMetricProviders(): ProviderCatalogEntry[] {
  ensureCustomMetricProvidersRegistered();
  return [
    {
      id: EXAMPLE_CUSTOM_PROVIDER_ID,
      displayName: exampleEngagementProvider.displayName,
      metricIds: exampleEngagementProvider.metricIds,
      partnerSafe: true,
      enableable: true,
    },
  ];
}

export function listMetricsForProviderId(providerId: string): string[] {
  return listMetricsByProvider(providerId).map((m) => m.id);
}
