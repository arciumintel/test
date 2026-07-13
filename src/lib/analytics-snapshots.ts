/**
 * AnalyticsSnapshot build / read / refresh (Phase 2).
 */

import "server-only";

import type {
  AnalyticsCompareBaseline,
  AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import {
  analyticsRangeKey,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import {
  ANALYTICS_ENGINE_SCHEMA_VERSION,
  runAnalyticsEngine,
  type AnalyticsEngineResult,
} from "@/lib/analytics-engine";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { prisma } from "@/lib/prisma";
import type { AnalyticsSnapshotStatus, Prisma } from "@prisma/client";

const FRESH_MS = 2 * 60 * 60 * 1000; // 2 hours
const SNAPSHOT_PRESETS: AnalyticsRangePreset[] = ["7d", "30d", "90d"];
const SNAPSHOT_COMPARES: AnalyticsCompareBaseline[] = [
  "none",
  "previous_month",
];

export type SnapshotFreshness = {
  status: AnalyticsSnapshotStatus;
  builtAt: Date | null;
  displayStatus: "fresh" | "building" | "queued" | "stale" | "error";
  label: string;
};

export function deriveDisplayStatus(
  status: AnalyticsSnapshotStatus,
  builtAt: Date | null
): SnapshotFreshness["displayStatus"] {
  if (status === "building" || status === "queued" || status === "error") {
    return status;
  }
  if (!builtAt) return "stale";
  if (Date.now() - builtAt.getTime() > FRESH_MS) return "stale";
  return "fresh";
}

export function snapshotFreshnessLabel(
  display: SnapshotFreshness["displayStatus"],
  builtAt: Date | null
): string {
  if (display === "building") return "Building";
  if (display === "queued") return "Queued";
  if (display === "error") return "Error";
  if (display === "stale") return "Stale";
  if (!builtAt) return "Fresh";
  return `Updated ${builtAt.toLocaleString()}`;
}

function asPayload(result: AnalyticsEngineResult): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
}

export async function buildAnalyticsSnapshot(input: {
  productId: string;
  preset: AnalyticsRangePreset;
  compare?: AnalyticsCompareBaseline;
  trigger: "hourly" | "manual";
  requestedByUserId?: string;
}): Promise<{ ok: true; snapshotId: string } | { ok: false; error: string }> {
  const compare = input.compare ?? "none";
  const { rangeKey, compareKey } = analyticsRangeKey(input.preset, compare);
  const range = resolveAnalyticsDateRange(input.preset);

  const existing = await prisma.analyticsSnapshot.findUnique({
    where: {
      productId_rangeKey_compareKey: {
        productId: input.productId,
        rangeKey,
        compareKey,
      },
    },
  });

  const snapshotId =
    existing?.id ??
    (
      await prisma.analyticsSnapshot.create({
        data: {
          productId: input.productId,
          rangeKey,
          compareKey,
          periodStart: range.from,
          periodEnd: range.to,
          status: "building",
          trigger: input.trigger,
          schemaVersion: ANALYTICS_ENGINE_SCHEMA_VERSION,
          payload: {},
        },
      })
    ).id;

  if (existing) {
    await prisma.analyticsSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: "building",
        trigger: input.trigger,
        errorMessage: null,
      },
    });
  }

  if (input.trigger === "manual" && input.requestedByUserId) {
    trackEventFireAndForget({
      eventName: "analytics_snapshot_refresh_requested",
      source: "server_action",
      path: `/partner-console/${input.productId}/analytics`,
      userId: input.requestedByUserId,
      ecosystemProjectId: input.productId,
      metadata: {
        rangeKey,
        compareKey,
        status: "queued",
      },
    });
  }

  try {
    const result = await runAnalyticsEngine({
      productId: input.productId,
      preset: input.preset,
      compare,
    });
    if (!result) {
      await prisma.analyticsSnapshot.update({
        where: { id: snapshotId },
        data: {
          status: "error",
          errorMessage: "Product not found or engine returned empty.",
        },
      });
      return { ok: false, error: "Could not build analytics snapshot." };
    }

    await prisma.analyticsSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: "fresh",
        builtAt: new Date(),
        periodStart: range.from,
        periodEnd: range.to,
        schemaVersion: ANALYTICS_ENGINE_SCHEMA_VERSION,
        payload: asPayload(result),
        errorMessage: null,
      },
    });

    trackEventFireAndForget({
      eventName: "analytics_snapshot_built",
      source: "server_action",
      path: `/partner-console/${input.productId}/analytics`,
      ecosystemProjectId: input.productId,
      metadata: {
        snapshotId,
        rangeKey,
        compareKey,
        builtAt: new Date().toISOString(),
        trigger: input.trigger,
        schemaVersion: ANALYTICS_ENGINE_SCHEMA_VERSION,
        metricCount: result.metrics.length,
      },
    });

    return { ok: true, snapshotId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.analyticsSnapshot.update({
      where: { id: snapshotId },
      data: { status: "error", errorMessage: message },
    });
    return { ok: false, error: message };
  }
}

export async function getLatestAnalyticsSnapshot(input: {
  productId: string;
  preset: AnalyticsRangePreset;
  compare?: AnalyticsCompareBaseline;
}): Promise<{
  snapshot: {
    id: string;
    status: AnalyticsSnapshotStatus;
    builtAt: Date;
    schemaVersion: number;
    errorMessage: string | null;
    payload: AnalyticsEngineResult | null;
  } | null;
  freshness: SnapshotFreshness;
}> {
  const compare = input.compare ?? "none";
  const { rangeKey, compareKey } = analyticsRangeKey(input.preset, compare);

  const row = await prisma.analyticsSnapshot.findUnique({
    where: {
      productId_rangeKey_compareKey: {
        productId: input.productId,
        rangeKey,
        compareKey,
      },
    },
  });

  if (!row) {
    return {
      snapshot: null,
      freshness: {
        status: "stale",
        builtAt: null,
        displayStatus: "stale",
        label: "No snapshot yet",
      },
    };
  }

  const displayStatus = deriveDisplayStatus(row.status, row.builtAt);
  return {
    snapshot: {
      id: row.id,
      status: row.status,
      builtAt: row.builtAt,
      schemaVersion: row.schemaVersion,
      errorMessage: row.errorMessage,
      payload: row.payload as unknown as AnalyticsEngineResult,
    },
    freshness: {
      status: row.status,
      builtAt: row.builtAt,
      displayStatus,
      label: snapshotFreshnessLabel(displayStatus, row.builtAt),
    },
  };
}

/**
 * Prefer snapshot payload when fresh enough; otherwise rebuild synchronously
 * for the request (keeps dashboard usable before cron runs).
 */
export async function getAnalyticsEngineView(input: {
  productId: string;
  preset: AnalyticsRangePreset;
  compare?: AnalyticsCompareBaseline;
  allowLiveFallback?: boolean;
}): Promise<{
  data: AnalyticsEngineResult | null;
  freshness: SnapshotFreshness;
  fromSnapshot: boolean;
}> {
  const compare = input.compare ?? "none";
  const latest = await getLatestAnalyticsSnapshot({
    productId: input.productId,
    preset: input.preset,
    compare,
  });

  if (
    latest.snapshot?.payload &&
    latest.freshness.displayStatus === "fresh" &&
    latest.snapshot.schemaVersion === ANALYTICS_ENGINE_SCHEMA_VERSION &&
    (latest.snapshot.payload as { overview?: { conversions?: unknown } })
      .overview?.conversions != null
  ) {
    return {
      data: latest.snapshot.payload,
      freshness: latest.freshness,
      fromSnapshot: true,
    };
  }

  if (input.allowLiveFallback === false) {
    return {
      data: latest.snapshot?.payload ?? null,
      freshness: latest.freshness,
      fromSnapshot: Boolean(latest.snapshot?.payload),
    };
  }

  // Live compute + persist so next read is snapshot-backed.
  const built = await buildAnalyticsSnapshot({
    productId: input.productId,
    preset: input.preset,
    compare,
    trigger: "manual",
  });

  if (!built.ok) {
    const live = await runAnalyticsEngine({
      productId: input.productId,
      preset: input.preset,
      compare,
    });
    return {
      data: live,
      freshness: {
        status: "error",
        builtAt: null,
        displayStatus: "error",
        label: built.error,
      },
      fromSnapshot: false,
    };
  }

  const refreshed = await getLatestAnalyticsSnapshot({
    productId: input.productId,
    preset: input.preset,
    compare,
  });

  return {
    data: refreshed.snapshot?.payload ?? null,
    freshness: refreshed.freshness,
    fromSnapshot: true,
  };
}

export async function runHourlyAnalyticsSnapshots(): Promise<{
  products: number;
  built: number;
  failed: number;
}> {
  const profiles = await prisma.analyticsProfile.findMany({
    select: { productId: true },
  });

  let built = 0;
  let failed = 0;

  for (const { productId } of profiles) {
    for (const preset of SNAPSHOT_PRESETS) {
      for (const compare of SNAPSHOT_COMPARES) {
        // Skip compare variants for all-time style if we add later; presets are finite.
        if (preset === "7d" && compare === "previous_month") continue;
        const result = await buildAnalyticsSnapshot({
          productId,
          preset,
          compare,
          trigger: "hourly",
        });
        if (result.ok) built += 1;
        else failed += 1;
      }
    }
  }

  return { products: profiles.length, built, failed };
}
