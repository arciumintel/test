"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ConceptImportance, Prisma } from "@prisma/client";
import {
  authorizeAnalyticsConfig,
  authorizeAnalyticsPlatformAdmin,
  authorizeAnalyticsRead,
  authorizeAnalyticsSensitiveConfig,
  toAnalyticsActionError,
  toActionError,
} from "@/lib/access-control";
import {
  ensureAnalyticsProfileForProduct,
  loadAnalyticsProfileBundle,
  uniqueConceptSlug,
} from "@/lib/analytics-profile";
import {
  ANALYTICS_PACKS,
  getAnalyticsPack,
  listInstallableAnalyticsPacks,
} from "@/lib/analytics-packs";
import { prisma } from "@/lib/prisma";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function asInputJson(
  value: Record<string, unknown> | unknown[]
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function revalidateAnalyticsSettings(productId: string) {
  revalidatePath(`/partner-console/${productId}/analytics`);
  revalidatePath(`/partner-console/${productId}/analytics/settings`);
  revalidatePath(`/admin/products/${productId}`);
}

export async function getAnalyticsSettingsData(productId: string) {
  const auth = await authorizeAnalyticsRead(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  await ensureAnalyticsProfileForProduct(productId);
  const bundle = await loadAnalyticsProfileBundle(productId);
  const { isAnalyticsV2Enabled } = await import("@/lib/analytics-feature-flags");
  const analyticsV2Enabled = await isAnalyticsV2Enabled(productId);

  return {
    ok: true as const,
    accessLevel: auth.level,
    canEditConfig: auth.level !== "analyst",
    canEditSensitive:
      auth.level === "platform_admin" || auth.level === "owner",
    canEditPlatformTemplates: auth.level === "platform_admin",
    analyticsV2Enabled,
    bundle,
    certifications: await prisma.certification.findMany({
      where: { productId },
      include: {
        requirements: { orderBy: { sortOrder: "asc" } },
        _count: { select: { awards: true } },
      },
      orderBy: { name: "asc" },
    }),
    courses: await prisma.course.findMany({
      where: { productId, status: "published" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    installablePacks: listInstallableAnalyticsPacks().map((p) => ({
      id: p.id,
      displayName: p.displayName,
      description: p.description,
      version: p.version,
    })),
    enableableProviders: (await import("@/lib/analytics-custom-providers"))
      .listEnableableMetricProviders(),
    enabledProviderIds: bundle.profile.enabledProviderIds,
  };
}

const terminologySchema = z.object({
  learnerLabel: z.string().max(80).optional(),
  readinessLabel: z.string().max(80).optional(),
  certificationLabel: z.string().max(80).optional(),
  badgeLabel: z.string().max(80).optional(),
});

const profileConfigSchema = z.object({
  terminology: terminologySchema.optional(),
  kpiSet: z.array(z.string().max(80)).max(40).optional(),
  sectionVisibility: z.array(z.string().max(80)).max(40).optional(),
  funnelStages: z.array(z.string().max(80)).max(40).optional(),
});

/** Manager+: terminology, dashboard layout (sections / KPIs / funnel labels). */
export async function updateAnalyticsProfileConfig(
  productId: string,
  raw: z.input<typeof profileConfigSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = profileConfigSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await ensureAnalyticsProfileForProduct(productId);
  const current = await prisma.analyticsProfile.findUniqueOrThrow({
    where: { productId },
  });

  const nextTerminology = {
    ...((current.terminology as Record<string, string> | null) ?? {}),
    ...(parsed.data.terminology ?? {}),
  };

  await prisma.analyticsProfile.update({
    where: { productId },
    data: {
      terminology: asInputJson(nextTerminology),
      ...(parsed.data.kpiSet ? { kpiSet: parsed.data.kpiSet } : {}),
      ...(parsed.data.sectionVisibility
        ? { sectionVisibility: parsed.data.sectionVisibility }
        : {}),
      ...(parsed.data.funnelStages
        ? { funnelStages: parsed.data.funnelStages }
        : {}),
    },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

const recommendationPolicySchema = z.object({
  funnelStageConversionMinPct: z.number().min(0).max(100).optional(),
  criticalConceptMasteryMinPct: z.number().min(0).max(100).optional(),
  questionMissRateMaxPct: z.number().min(0).max(100).optional(),
  completionRateMinPct: z.number().min(0).max(100).optional(),
  minVolumeForAlerts: z.number().int().min(0).max(100000).optional(),
  readinessScoreMin: z.number().min(0).max(100).optional(),
  certificationAttainmentMinPct: z.number().min(0).max(100).optional(),
});

/** Owner+: recommendation thresholds. */
export async function updateRecommendationPolicy(
  productId: string,
  raw: z.input<typeof recommendationPolicySchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = recommendationPolicySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await ensureAnalyticsProfileForProduct(productId);
  const current = await prisma.analyticsProfile.findUniqueOrThrow({
    where: { productId },
  });

  const next = {
    ...((current.recommendationPolicy as Record<string, number> | null) ?? {}),
    ...parsed.data,
  };

  await prisma.analyticsProfile.update({
    where: { productId },
    data: { recommendationPolicy: asInputJson(next) },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

const enabledProvidersSchema = z.object({
  providerIds: z.array(z.string().min(1)).max(20),
});

/** Owner+: enable/disable custom metric providers (core always on). */
export async function updateEnabledMetricProviders(
  productId: string,
  raw: z.input<typeof enabledProvidersSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = enabledProvidersSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { listEnableableMetricProviders } = await import(
    "@/lib/analytics-custom-providers"
  );
  const { CORE_PROVIDER_ID } = await import("@/lib/analytics-providers");
  const allow = new Set(
    listEnableableMetricProviders().map((p) => p.id)
  );
  const next = parsed.data.providerIds.filter(
    (id) => id !== CORE_PROVIDER_ID && allow.has(id)
  );

  await ensureAnalyticsProfileForProduct(productId);
  await prisma.analyticsProfile.update({
    where: { productId },
    data: { enabledProviderIds: next },
  });

  revalidateAnalyticsSettings(productId);
  revalidatePath(`/partner-console/${productId}/analytics`);
  return { ok: true };
}

const conceptSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  skillCategoryId: z.string().optional().nullable(),
  importance: z.enum(["critical", "core", "supporting"]).optional(),
});

/** Manager+: create concept. */
export async function createConcept(
  productId: string,
  raw: z.input<typeof conceptSchema>
): Promise<Result<{ id: string }>> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = conceptSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await ensureAnalyticsProfileForProduct(productId);
  const existing = await prisma.concept.findMany({
    where: { productId },
    select: { slug: true },
  });
  const slug = uniqueConceptSlug(
    parsed.data.name,
    existing.map((c) => c.slug)
  );

  const concept = await prisma.concept.create({
    data: {
      productId,
      slug,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      category: parsed.data.category?.trim() || null,
      skillCategoryId: parsed.data.skillCategoryId || null,
      importance: (parsed.data.importance ?? "core") as ConceptImportance,
    },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true, id: concept.id };
}

/** Manager+: update concept. */
export async function updateConcept(
  productId: string,
  conceptId: string,
  raw: z.input<typeof conceptSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = conceptSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.concept.findFirst({
    where: { id: conceptId, productId },
  });
  if (!existing) return { error: "Concept not found." };

  await prisma.concept.update({
    where: { id: conceptId },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      category: parsed.data.category?.trim() || null,
      skillCategoryId: parsed.data.skillCategoryId || null,
      importance: (parsed.data.importance ?? existing.importance) as ConceptImportance,
    },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

/** Manager+: delete concept. */
export async function deleteConcept(
  productId: string,
  conceptId: string
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  await prisma.concept.deleteMany({ where: { id: conceptId, productId } });
  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

const conversionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/, "Use lowercase snake_case keys."),
  label: z.string().min(1).max(120),
  eventName: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
});

/** Owner+: create conversion definition — deferred to Analytics V2 (kept for schema stubs). */
export async function createConversionDefinition(
  productId: string,
  raw: z.input<typeof conversionSchema>
): Promise<Result<{ id: string }>> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = conversionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await ensureAnalyticsProfileForProduct(productId);

  try {
    const row = await prisma.conversionDefinition.create({
      data: {
        productId,
        key: parsed.data.key,
        label: parsed.data.label.trim(),
        eventName: parsed.data.eventName.trim(),
        description: parsed.data.description?.trim() || null,
      },
    });
    revalidateAnalyticsSettings(productId);
    return { ok: true, id: row.id };
  } catch {
    return { error: "A conversion with this key already exists." };
  }
}

/** Owner+: update conversion — deferred to Analytics V2. */
export async function updateConversionDefinition(
  productId: string,
  conversionId: string,
  raw: z.input<typeof conversionSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = conversionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.conversionDefinition.findFirst({
    where: { id: conversionId, productId },
  });
  if (!existing) return { error: "Conversion not found." };

  await prisma.conversionDefinition.update({
    where: { id: conversionId },
    data: {
      key: parsed.data.key,
      label: parsed.data.label.trim(),
      eventName: parsed.data.eventName.trim(),
      description: parsed.data.description?.trim() || null,
    },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

/** Owner+: delete conversion — deferred to Analytics V2. */
export async function deleteConversionDefinition(
  productId: string,
  conversionId: string
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  await prisma.conversionDefinition.deleteMany({
    where: { id: conversionId, productId },
  });
  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

const readinessSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  readyThreshold: z.number().min(0).max(100),
  requirements: z
    .array(
      z.object({
        type: z.enum([
          "course_completion",
          "quiz_performance",
          "concept_mastery",
          "required_path_completion",
          "partner_conversion_events",
        ]),
        weight: z.number().min(0).max(1),
      })
    )
    .min(1)
    .max(20),
  levels: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        label: z.string().min(1).max(80),
        minScore: z.number().min(0).max(100),
      })
    )
    .min(1)
    .max(10),
});

/** Owner+: update readiness model (formulas / weights). */
export async function updateReadinessModel(
  productId: string,
  readinessModelId: string,
  raw: z.input<typeof readinessSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = readinessSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const weightSum = parsed.data.requirements.reduce((s, r) => s + r.weight, 0);
  if (Math.abs(weightSum - 1) > 0.01) {
    return { error: "Requirement weights must sum to 1.0." };
  }

  const existing = await prisma.readinessModel.findFirst({
    where: { id: readinessModelId, productId },
  });
  if (!existing) return { error: "Readiness model not found." };

  await prisma.readinessModel.update({
    where: { id: readinessModelId },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      readyThreshold: parsed.data.readyThreshold,
      requirements: asInputJson(parsed.data.requirements),
      levels: asInputJson(parsed.data.levels),
    },
  });

  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

/** Owner+: install / merge an analytics pack (union sections; terminology with Owner resolution). */
export async function installAnalyticsPack(
  productId: string,
  packId: string,
  options?: { terminologyResolution?: "keep" | "overwrite" }
): Promise<Result<{ conflicts: number; preview?: unknown }>> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const pack = getAnalyticsPack(packId);
  if (!pack || pack.stub) {
    return { error: "That analytics pack is not available yet." };
  }

  await ensureAnalyticsProfileForProduct(productId);

  const { mergePackIntoProfile, previewPackMerge } = await import(
    "@/lib/analytics-pack-merge"
  );
  const preview = await previewPackMerge(productId, pack);
  await mergePackIntoProfile(
    productId,
    pack,
    options?.terminologyResolution ?? "keep"
  );

  revalidateAnalyticsSettings(productId);
  return {
    ok: true,
    conflicts: preview.terminologyConflicts.length,
    preview,
  };
}

/** Owner+: preview pack merge conflicts before install. */
export async function previewAnalyticsPackInstall(
  productId: string,
  packId: string
): Promise<Result<{ preview: unknown }>> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const pack = getAnalyticsPack(packId);
  if (!pack || pack.stub) {
    return { error: "That analytics pack is not available yet." };
  }

  await ensureAnalyticsProfileForProduct(productId);
  const { previewPackMerge } = await import("@/lib/analytics-pack-merge");
  const preview = await previewPackMerge(productId, pack);
  return { ok: true, preview };
}

const contentTagSchema = z.object({
  conceptIds: z.array(z.string().min(1)).max(40),
});

/** Manager+: replace lesson concept tags. */
export async function setLessonConceptTags(
  productId: string,
  lessonId: string,
  raw: z.input<typeof contentTagSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = contentTagSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, course: { productId } },
    select: { id: true },
  });
  if (!lesson) return { error: "Lesson not found for this project." };

  const concepts = await prisma.concept.findMany({
    where: { productId, id: { in: parsed.data.conceptIds } },
    select: { id: true },
  });
  const validIds = new Set(concepts.map((c) => c.id));

  await prisma.$transaction(async (tx) => {
    await tx.contentConceptTag.deleteMany({ where: { lessonId } });
    if (validIds.size > 0) {
      await tx.contentConceptTag.createMany({
        data: [...validIds].map((conceptId) => ({
          conceptId,
          lessonId,
        })),
      });
    }
  });

  revalidatePath(`/partner-console/${productId}/courses`);
  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

/** Manager+: replace question concept tags. */
export async function setQuestionConceptTags(
  productId: string,
  questionId: string,
  raw: z.input<typeof contentTagSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = contentTagSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      quiz: { course: { productId } },
    },
    select: { id: true },
  });
  if (!question) return { error: "Question not found for this project." };

  const concepts = await prisma.concept.findMany({
    where: { productId, id: { in: parsed.data.conceptIds } },
    select: { id: true },
  });
  const validIds = new Set(concepts.map((c) => c.id));

  await prisma.$transaction(async (tx) => {
    await tx.contentConceptTag.deleteMany({ where: { questionId } });
    if (validIds.size > 0) {
      await tx.contentConceptTag.createMany({
        data: [...validIds].map((conceptId) => ({
          conceptId,
          questionId,
        })),
      });
    }
  });

  revalidatePath(`/partner-console/${productId}/courses`);
  revalidateAnalyticsSettings(productId);
  return { ok: true };
}

/** Manager+: list concepts for tagging UI. */
export async function listConceptsForTagging(productId: string) {
  const auth = await authorizeAnalyticsRead(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  await ensureAnalyticsProfileForProduct(productId);
  const concepts = await prisma.concept.findMany({
    where: { productId },
    orderBy: [{ importance: "asc" }, { name: "asc" }],
    select: { id: true, name: true, importance: true },
  });
  return {
    ok: true as const,
    concepts,
    canEditTags: auth.level !== "analyst",
  };
}

/** Read selected concept ids for a lesson or question. */
export async function getContentConceptTagIds(
  productId: string,
  target:
    | { type: "lesson"; lessonId: string }
    | { type: "question"; questionId: string }
) {
  const auth = await authorizeAnalyticsRead(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const tags = await prisma.contentConceptTag.findMany({
    where:
      target.type === "lesson"
        ? { lessonId: target.lessonId, concept: { productId } }
        : { questionId: target.questionId, concept: { productId } },
    select: { conceptId: true },
  });
  return { ok: true as const, conceptIds: tags.map((t) => t.conceptId) };
}

/** Staff: list pack definitions (platform templates). */
export async function listAnalyticsPackDefinitions(): Promise<
  Result<{
    packs: Array<{
      id: string;
      displayName: string;
      version: string;
      stub: boolean;
    }>;
  }>
> {
  const auth = await authorizeAnalyticsPlatformAdmin();
  if (!auth.ok) return toActionError(auth);

  return {
    ok: true,
    packs: ANALYTICS_PACKS.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      version: p.version,
      stub: p.stub,
    })),
  };
}
