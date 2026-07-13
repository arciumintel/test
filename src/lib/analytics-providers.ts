/**
 * Metric provider interface + registry.
 *
 * @see docs/adr/2026-07-13-configurable-analytics-platform.md
 */

import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { ensureCustomMetricProvidersRegistered } from "@/lib/analytics-custom-providers";
import { coreMetricProvider } from "@/lib/analytics-core-provider";
import { CORE_PROVIDER_ID, getMetricDefinition } from "@/lib/analytics-metrics";

export type AnalyticsProfileRef = {
  productId: string;
  schemaVersion?: number;
  enabledProviderIds?: string[];
  kpiSet?: string[];
  funnelStages?: string[];
  successMetrics?: string[];
};

export type MetricContext = {
  productId: string;
  range: AnalyticsDateRange;
  profile: AnalyticsProfileRef;
  /** Historical compare window (prior week / month / quarter). */
  priorPeriod?: AnalyticsDateRange;
};

export type MetricValue = {
  metricId: string;
  value: number | null;
  priorValue?: number | null;
  delta?: number | null;
  deltaPct?: number | null;
  unit?: "count" | "percent" | "score" | "seconds" | "ratio";
  dimensions?: Record<string, string | number | null>;
  partnerSafe: boolean;
};

export type MetricBag = {
  providerId: string;
  metrics: MetricValue[];
  computedAt?: Date;
};

export type MetricProvider = {
  id: string;
  displayName: string;
  metricIds: string[];
  compute(ctx: MetricContext): Promise<MetricBag>;
};

const providerRegistry = new Map<string, MetricProvider>();

function assertProviderPartnerSafe(provider: MetricProvider): void {
  for (const metricId of provider.metricIds) {
    const def = getMetricDefinition(metricId);
    if (!def?.partnerSafe) {
      throw new Error(
        `Cannot register provider ${provider.id}: metric ${metricId} is not partnerSafe`
      );
    }
  }
}

/** Idempotent registration of shipped providers (core + custom). */
export function ensureAnalyticsProvidersRegistered(): void {
  if (!providerRegistry.has(CORE_PROVIDER_ID)) {
    providerRegistry.set(CORE_PROVIDER_ID, coreMetricProvider);
  }
  ensureCustomMetricProvidersRegistered();
}

export function registerMetricProvider(provider: MetricProvider): void {
  assertProviderPartnerSafe(provider);
  if (providerRegistry.has(provider.id)) {
    throw new Error(`Metric provider already registered: ${provider.id}`);
  }
  providerRegistry.set(provider.id, provider);
}

export function getMetricProvider(id: string): MetricProvider | undefined {
  ensureAnalyticsProvidersRegistered();
  return providerRegistry.get(id);
}

export function listMetricProviders(): MetricProvider[] {
  ensureAnalyticsProvidersRegistered();
  return [...providerRegistry.values()];
}

export function clearMetricProviderRegistry(): void {
  providerRegistry.clear();
}

export { CORE_PROVIDER_ID };

/** Core is always on; custom ids must be registered and explicitly enabled. */
export function resolveEnabledProviderIds(
  profile: AnalyticsProfileRef
): string[] {
  ensureAnalyticsProvidersRegistered();
  const enabled = profile.enabledProviderIds ?? [];
  const resolved = new Set<string>([CORE_PROVIDER_ID]);

  for (const id of enabled) {
    if (id === CORE_PROVIDER_ID) continue;
    if (providerRegistry.has(id)) {
      resolved.add(id);
    }
  }

  return [...resolved];
}

export async function computeMetricsViaProviders(
  ctx: MetricContext
): Promise<MetricBag[]> {
  ensureAnalyticsProvidersRegistered();

  if (ctx.profile.productId !== ctx.productId) {
    throw new Error("MetricContext productId must match profile.productId");
  }

  const ids = resolveEnabledProviderIds(ctx.profile);
  const bags: MetricBag[] = [];

  for (const id of ids) {
    const provider = providerRegistry.get(id);
    if (!provider) continue;

    const bag = await provider.compute(ctx);

    if (bag.providerId !== provider.id) {
      throw new Error(
        `Provider ${provider.id} returned bag for ${bag.providerId}`
      );
    }

    const safe = {
      ...bag,
      metrics: bag.metrics.filter((m) => {
        if (!m.partnerSafe) return false;
        if (!provider.metricIds.includes(m.metricId)) return false;
        const def = getMetricDefinition(m.metricId);
        return def?.partnerSafe === true;
      }),
    };
    bags.push(safe);
  }
  return bags;
}
