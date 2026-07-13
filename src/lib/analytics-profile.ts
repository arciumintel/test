/**
 * Analytics profile load / ensure / pack seed (Phase 1).
 *
 * @see docs/adr/2026-07-13-configurable-analytics-platform.md
 */

import "server-only";

import type { Prisma } from "@prisma/client";
import {
  DEVELOPER_EDUCATION_PACK,
  DEFAULT_ANALYTICS_PACK_ID,
  DEFAULT_LEARNING_READINESS,
  type AnalyticsPackManifest,
  getAnalyticsPack,
} from "@/lib/analytics-packs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export type AnalyticsProfileBundle = {
  profile: NonNullable<
    Awaited<ReturnType<typeof prisma.analyticsProfile.findUnique>>
  >;
  concepts: Awaited<ReturnType<typeof prisma.concept.findMany>>;
  skillCategories: Awaited<ReturnType<typeof prisma.skillCategory.findMany>>;
  conversions: Awaited<ReturnType<typeof prisma.conversionDefinition.findMany>>;
  readinessModels: Awaited<ReturnType<typeof prisma.readinessModel.findMany>>;
  packInstalls: Awaited<ReturnType<typeof prisma.analyticsPackInstall.findMany>>;
};

function asInputJson(
  value: Record<string, unknown> | unknown[]
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/**
 * Ensures Analytics Profile + Developer Education Pack + Learning Readiness
 * exist for a product. Idempotent — safe on every product create / settings load.
 */
export async function ensureAnalyticsProfileForProduct(
  productId: string,
  packId: string = DEFAULT_ANALYTICS_PACK_ID
): Promise<AnalyticsProfileBundle> {
  const pack = getAnalyticsPack(packId);
  if (!pack || pack.stub) {
    return ensureAnalyticsProfileForProduct(productId, DEVELOPER_EDUCATION_PACK.id);
  }

  const existing = await prisma.analyticsProfile.findUnique({
    where: { productId },
  });

  if (!existing) {
    await applyPackSeed(productId, pack);
  } else {
    // Ensure default readiness + pack install rows exist even if profile was partial.
    await ensureDefaultReadiness(productId, pack);
    await ensurePackInstallRow(productId, pack);
  }

  return loadAnalyticsProfileBundle(productId);
}

export async function loadAnalyticsProfileBundle(
  productId: string
): Promise<AnalyticsProfileBundle> {
  const [profile, concepts, skillCategories, conversions, readinessModels, packInstalls] =
    await Promise.all([
      prisma.analyticsProfile.findUniqueOrThrow({ where: { productId } }),
      prisma.concept.findMany({
        where: { productId },
        orderBy: [{ importance: "asc" }, { name: "asc" }],
      }),
      prisma.skillCategory.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.conversionDefinition.findMany({
        where: { productId },
        orderBy: { label: "asc" },
      }),
      prisma.readinessModel.findMany({
        where: { productId },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      }),
      prisma.analyticsPackInstall.findMany({
        where: { productId },
        orderBy: { installedAt: "asc" },
      }),
    ]);

  return {
    profile,
    concepts,
    skillCategories,
    conversions,
    readinessModels,
    packInstalls,
  };
}

async function applyPackSeed(
  productId: string,
  pack: AnalyticsPackManifest
): Promise<void> {
  const terminology = pack.terminology ?? {};
  const recommendationPolicy = pack.recommendationThresholds ?? {};

  await prisma.$transaction(async (tx) => {
    await tx.analyticsProfile.create({
      data: {
        productId,
        schemaVersion: 1,
        terminology: asInputJson(terminology),
        kpiSet: pack.kpiSet,
        funnelStages: pack.funnelStages,
        sectionVisibility: pack.sectionVisibility,
        recommendationPolicy: asInputJson(
          recommendationPolicy as unknown as Record<string, unknown>
        ),
        enabledProviderIds: pack.enabledProviderIds,
        featureFlags: asInputJson({}),
      },
    });

    await tx.analyticsPackInstall.create({
      data: {
        productId,
        packId: pack.id,
        packVersion: pack.version,
      },
    });

    for (const cat of pack.skillCategories) {
      await tx.skillCategory.create({
        data: {
          productId,
          slug: cat.slug,
          name: cat.name,
          sortOrder: cat.order,
        },
      });
    }

    const categories = await tx.skillCategory.findMany({ where: { productId } });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    for (const concept of pack.starterConcepts) {
      await tx.concept.create({
        data: {
          productId,
          slug: concept.slug,
          name: concept.name,
          description: concept.description ?? null,
          category: concept.category ?? null,
          skillCategoryId: concept.category
            ? (categoryBySlug.get(concept.category) ?? null)
            : null,
          importance: concept.importance ?? "core",
        },
      });
    }

    for (const conversion of pack.conversionStubs) {
      await tx.conversionDefinition.create({
        data: {
          productId,
          key: conversion.key,
          label: conversion.label,
          eventName: conversion.eventName,
          description: conversion.description ?? null,
        },
      });
    }

    const readiness = pack.readiness ?? DEFAULT_LEARNING_READINESS;
    await tx.readinessModel.create({
      data: {
        productId,
        name: readiness.name,
        description: readiness.description,
        requirements: asInputJson(readiness.requirements),
        levels: asInputJson(readiness.levels),
        readyThreshold: readiness.readyThreshold,
        isDefault: true,
      },
    });
  });
}

async function ensureDefaultReadiness(
  productId: string,
  pack: AnalyticsPackManifest
): Promise<void> {
  const count = await prisma.readinessModel.count({ where: { productId } });
  if (count > 0) return;

  const readiness = pack.readiness ?? DEFAULT_LEARNING_READINESS;
  await prisma.readinessModel.create({
    data: {
      productId,
      name: readiness.name,
      description: readiness.description,
      requirements: asInputJson(readiness.requirements),
      levels: asInputJson(readiness.levels),
      readyThreshold: readiness.readyThreshold,
      isDefault: true,
    },
  });
}

async function ensurePackInstallRow(
  productId: string,
  pack: AnalyticsPackManifest
): Promise<void> {
  await prisma.analyticsPackInstall.upsert({
    where: {
      productId_packId: { productId, packId: pack.id },
    },
    create: {
      productId,
      packId: pack.id,
      packVersion: pack.version,
    },
    update: {},
  });
}

export function uniqueConceptSlug(name: string, existing: string[]): string {
  const base = slugify(name) || "concept";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
