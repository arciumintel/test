/**
 * Analytics V2 feature flag (Phase 2 parallel with Partner Analytics Plus).
 */

import "server-only";

import { prisma } from "@/lib/prisma";

export const ANALYTICS_V2_FLAG = "analyticsV2" as const;

function envDefaultEnabled(): boolean {
  const raw = process.env.ANALYTICS_V2_DEFAULT?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export async function isAnalyticsV2Enabled(productId: string): Promise<boolean> {
  const profile = await prisma.analyticsProfile.findUnique({
    where: { productId },
    select: { featureFlags: true },
  });
  if (!profile) return envDefaultEnabled();

  const flags = (profile.featureFlags as Record<string, unknown> | null) ?? {};
  if (typeof flags[ANALYTICS_V2_FLAG] === "boolean") {
    return flags[ANALYTICS_V2_FLAG] as boolean;
  }
  return envDefaultEnabled();
}

export async function setAnalyticsV2Enabled(
  productId: string,
  enabled: boolean
): Promise<void> {
  const profile = await prisma.analyticsProfile.findUnique({
    where: { productId },
    select: { featureFlags: true },
  });
  if (!profile) return;

  const flags = {
    ...((profile.featureFlags as Record<string, unknown> | null) ?? {}),
    [ANALYTICS_V2_FLAG]: enabled,
  };

  await prisma.analyticsProfile.update({
    where: { productId },
    data: { featureFlags: flags },
  });
}
