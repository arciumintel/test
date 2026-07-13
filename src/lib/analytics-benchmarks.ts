/**
 * Anonymous ecosystem benchmarks — design/schema prep only (Phase 5).
 *
 * NOT exposed in partner UI until explicitly approved. Feature flag off by default.
 * Never includes project names, rankings, or cross-tenant raw rows.
 *
 * @see docs/adr/2026-07-13-configurable-analytics-platform.md §25.3
 */

import "server-only";

import { prisma } from "@/lib/prisma";

export const ECOSYSTEM_BENCHMARKS_FLAG = "ecosystemBenchmarks" as const;

export type BenchmarkOverlay = {
  metricId: string;
  periodKey: string;
  sampleSize: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  computedAt: string;
};

export type BenchmarkOverlaySafe = BenchmarkOverlay & {
  /** Always anonymous — no product identifiers. */
  anonymous: true;
};

export async function isEcosystemBenchmarksEnabled(
  productId: string
): Promise<boolean> {
  const profile = await prisma.analyticsProfile.findUnique({
    where: { productId },
    select: { featureFlags: true },
  });
  if (!profile) return false;
  const flags = (profile.featureFlags as Record<string, unknown> | null) ?? {};
  return flags[ECOSYSTEM_BENCHMARKS_FLAG] === true;
}

/**
 * Read anonymous rollups for overlay (future). Returns empty when flag off.
 * Partner surfaces must never call this until product approval.
 */
export async function getAnonymousBenchmarkOverlays(
  productId: string,
  metricIds: string[],
  periodKey: string
): Promise<BenchmarkOverlaySafe[]> {
  const enabled = await isEcosystemBenchmarksEnabled(productId);
  if (!enabled || metricIds.length === 0) return [];

  const delegate = (
    prisma as { ecosystemBenchmarkRollup?: { findMany?: unknown } }
  ).ecosystemBenchmarkRollup;
  if (!delegate || typeof delegate.findMany !== "function") return [];

  const rows = await prisma.ecosystemBenchmarkRollup.findMany({
    where: {
      metricId: { in: metricIds },
      periodKey,
    },
  });

  return rows.map((row) => ({
    metricId: row.metricId,
    periodKey: row.periodKey,
    sampleSize: row.sampleSize,
    p25: row.p25,
    p50: row.p50,
    p75: row.p75,
    computedAt: row.computedAt.toISOString(),
    anonymous: true as const,
  }));
}

/**
 * Platform job hook (not wired in V1) — aggregate anonymous quartiles across tenants.
 * Intentionally unimplemented; schema + types only.
 */
export async function computeEcosystemBenchmarkRollups(_periodKey: string): Promise<{
  ok: false;
  reason: string;
}> {
  return {
    ok: false,
    reason:
      "Ecosystem benchmark aggregation is not enabled in V1. Schema is prepared only.",
  };
}
