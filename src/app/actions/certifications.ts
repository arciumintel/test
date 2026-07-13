"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  authorizeAnalyticsConfig,
  authorizeAnalyticsSensitiveConfig,
  toAnalyticsActionError,
} from "@/lib/access-control";
import { slugify } from "@/lib/slugify";
import { prisma } from "@/lib/prisma";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function asInputJson(
  value: Record<string, unknown> | unknown[]
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function revalidateCert(productId: string) {
  revalidatePath(`/partner-console/${productId}/analytics/certifications`);
  revalidatePath(`/partner-console/${productId}/analytics/settings`);
  revalidatePath(`/partner-console/${productId}/analytics`);
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["draft", "published"]).optional(),
  readyThreshold: z.number().min(0).max(100).nullable().optional(),
  requirements: z
    .array(
      z.object({
        type: z.enum([
          "course_completion",
          "quiz_pass",
          "readiness_score",
          "learning_path_completion",
          "conversion_event",
          "concept_mastery",
        ]),
        label: z.string().max(120).optional(),
        config: z.record(z.string(), z.unknown()).default({}),
        weight: z.number().min(0).max(10).default(1),
      })
    )
    .max(20)
    .optional(),
});

/** Manager+: create a certification definition (not a badge). */
export async function createCertification(
  productId: string,
  raw: z.input<typeof createSchema>
): Promise<Result<{ certificationId: string }>> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const baseSlug = slugify(parsed.data.slug ?? parsed.data.name);
  let slug = baseSlug || "certification";
  const existing = await prisma.certification.findMany({
    where: { productId },
    select: { slug: true },
  });
  const used = new Set(existing.map((c) => c.slug));
  if (used.has(slug)) {
    let i = 2;
    while (used.has(`${slug}-${i}`)) i += 1;
    slug = `${slug}-${i}`;
  }

  const created = await prisma.certification.create({
    data: {
      productId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "draft",
      readyThreshold: parsed.data.readyThreshold ?? null,
      requirements: {
        create: (parsed.data.requirements ?? []).map((r, index) => ({
          type: r.type,
          label: r.label ?? null,
          config: asInputJson(r.config),
          weight: r.weight,
          sortOrder: index,
        })),
      },
    },
    select: { id: true },
  });

  revalidateCert(productId);
  return { ok: true, certificationId: created.id };
}

const updateSchema = createSchema.partial().extend({
  certificationId: z.string().min(1),
});

/** Manager+: update certification metadata / replace requirements. */
export async function updateCertification(
  productId: string,
  raw: z.input<typeof updateSchema>
): Promise<Result> {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const cert = await prisma.certification.findFirst({
    where: { id: parsed.data.certificationId, productId },
    select: { id: true },
  });
  if (!cert) return { error: "Certification not found." };

  await prisma.$transaction(async (tx) => {
    await tx.certification.update({
      where: { id: cert.id },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description ?? null }
          : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.readyThreshold !== undefined
          ? { readyThreshold: parsed.data.readyThreshold }
          : {}),
      },
    });

    if (parsed.data.requirements) {
      await tx.certificationRequirement.deleteMany({
        where: { certificationId: cert.id },
      });
      if (parsed.data.requirements.length > 0) {
        await tx.certificationRequirement.createMany({
          data: parsed.data.requirements.map((r, index) => ({
            certificationId: cert.id,
            type: r.type,
            label: r.label ?? null,
            config: asInputJson(r.config),
            weight: r.weight,
            sortOrder: index,
          })),
        });
      }
    }
  });

  revalidateCert(productId);
  return { ok: true };
}

/** Owner+: delete a certification definition (awards cascade). */
export async function deleteCertification(
  productId: string,
  certificationId: string
): Promise<Result> {
  const auth = await authorizeAnalyticsSensitiveConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const cert = await prisma.certification.findFirst({
    where: { id: certificationId, productId },
    select: { id: true },
  });
  if (!cert) return { error: "Certification not found." };

  await prisma.certification.delete({ where: { id: cert.id } });
  revalidateCert(productId);
  return { ok: true };
}

export async function listCertificationsForSettings(productId: string) {
  const auth = await authorizeAnalyticsConfig(productId);
  if (!auth.ok) return toAnalyticsActionError(auth);

  const certifications = await prisma.certification.findMany({
    where: { productId },
    include: {
      requirements: { orderBy: { sortOrder: "asc" } },
      _count: { select: { awards: true } },
    },
    orderBy: { name: "asc" },
  });
  return { ok: true as const, certifications };
}
