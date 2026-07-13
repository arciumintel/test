/**
 * Pack merge rules: union sections/KPIs/funnel; last-write terminology with Owner review.
 */

import "server-only";

import type { Prisma } from "@prisma/client";
import type { AnalyticsPackManifest } from "@/lib/analytics-packs";
import { prisma } from "@/lib/prisma";

export type PackTerminologyConflict = {
  key: string;
  current: string;
  incoming: string;
};

export type PackMergePreview = {
  packId: string;
  packVersion: string;
  sectionUnion: string[];
  kpiUnion: string[];
  funnelUnion: string[];
  terminologyConflicts: PackTerminologyConflict[];
  newConcepts: number;
  newConversions: number;
  newCategories: number;
};

function asInputJson(
  value: Record<string, unknown> | unknown[]
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export async function previewPackMerge(
  productId: string,
  pack: AnalyticsPackManifest
): Promise<PackMergePreview> {
  const profile = await prisma.analyticsProfile.findUnique({
    where: { productId },
  });
  const existingConcepts = await prisma.concept.findMany({
    where: { productId },
    select: { slug: true },
  });
  const existingConversions = await prisma.conversionDefinition.findMany({
    where: { productId },
    select: { key: true },
  });
  const existingCategories = await prisma.skillCategory.findMany({
    where: { productId },
    select: { slug: true },
  });

  const currentTerm =
    (profile?.terminology as Record<string, string> | null) ?? {};
  const incoming = pack.terminology ?? {};
  const terminologyConflicts: PackTerminologyConflict[] = [];
  for (const [key, value] of Object.entries(incoming)) {
    if (
      currentTerm[key] != null &&
      currentTerm[key] !== "" &&
      currentTerm[key] !== value
    ) {
      terminologyConflicts.push({
        key,
        current: currentTerm[key],
        incoming: value,
      });
    }
  }

  const conceptSlugs = new Set(existingConcepts.map((c) => c.slug));
  const conversionKeys = new Set(existingConversions.map((c) => c.key));
  const categorySlugs = new Set(existingCategories.map((c) => c.slug));

  return {
    packId: pack.id,
    packVersion: pack.version,
    sectionUnion: uniqueStrings([
      ...(profile?.sectionVisibility ?? []),
      ...pack.sectionVisibility,
    ]),
    kpiUnion: uniqueStrings([...(profile?.kpiSet ?? []), ...pack.kpiSet]),
    funnelUnion: uniqueStrings([
      ...(profile?.funnelStages ?? []),
      ...pack.funnelStages,
    ]),
    terminologyConflicts,
    newConcepts: pack.starterConcepts.filter((c) => !conceptSlugs.has(c.slug))
      .length,
    newConversions: pack.conversionStubs.filter((c) => !conversionKeys.has(c.key))
      .length,
    newCategories: pack.skillCategories.filter((c) => !categorySlugs.has(c.slug))
      .length,
  };
}

/**
 * Merge pack into existing profile.
 * terminologyResolution: keep existing on conflict, or overwrite with pack values.
 */
export async function mergePackIntoProfile(
  productId: string,
  pack: AnalyticsPackManifest,
  terminologyResolution: "keep" | "overwrite" = "keep"
): Promise<PackMergePreview> {
  const preview = await previewPackMerge(productId, pack);
  const profile = await prisma.analyticsProfile.findUniqueOrThrow({
    where: { productId },
  });

  const currentTerm =
    (profile.terminology as Record<string, string> | null) ?? {};
  const incoming = pack.terminology ?? {};
  const nextTerm = { ...currentTerm };
  for (const [key, value] of Object.entries(incoming)) {
    if (currentTerm[key] == null || currentTerm[key] === "") {
      nextTerm[key] = value;
    } else if (terminologyResolution === "overwrite") {
      nextTerm[key] = value;
    }
  }

  const nextProviders = uniqueStrings([
    ...profile.enabledProviderIds,
    ...pack.enabledProviderIds,
  ]);

  const nextPolicy =
    pack.recommendationThresholds != null
      ? {
          ...((profile.recommendationPolicy as Record<string, unknown> | null) ??
            {}),
          ...pack.recommendationThresholds,
        }
      : (profile.recommendationPolicy as Record<string, unknown> | null) ?? {};

  await prisma.$transaction(async (tx) => {
    await tx.analyticsProfile.update({
      where: { productId },
      data: {
        sectionVisibility: preview.sectionUnion,
        kpiSet: preview.kpiUnion,
        funnelStages: preview.funnelUnion,
        terminology: asInputJson(nextTerm),
        enabledProviderIds: nextProviders,
        recommendationPolicy: asInputJson(nextPolicy),
      },
    });

    await tx.analyticsPackInstall.upsert({
      where: { productId_packId: { productId, packId: pack.id } },
      create: {
        productId,
        packId: pack.id,
        packVersion: pack.version,
      },
      update: { packVersion: pack.version },
    });

    for (const cat of pack.skillCategories) {
      await tx.skillCategory.upsert({
        where: { productId_slug: { productId, slug: cat.slug } },
        create: {
          productId,
          slug: cat.slug,
          name: cat.name,
          sortOrder: cat.order,
        },
        update: {},
      });
    }

    const categories = await tx.skillCategory.findMany({ where: { productId } });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    for (const concept of pack.starterConcepts) {
      await tx.concept.upsert({
        where: { productId_slug: { productId, slug: concept.slug } },
        create: {
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
        update: {},
      });
    }

    for (const conversion of pack.conversionStubs) {
      await tx.conversionDefinition.upsert({
        where: { productId_key: { productId, key: conversion.key } },
        create: {
          productId,
          key: conversion.key,
          label: conversion.label,
          eventName: conversion.eventName,
          description: conversion.description ?? null,
        },
        update: {},
      });
    }
  });

  return preview;
}
