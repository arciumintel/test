"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import { normalizeCategory } from "@/lib/project-categories";
import {
  ACCESS_MESSAGES,
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";

import { resolveProductSlugOnRename } from "@/lib/slugs";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const productLinkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().url().max(500),
});

const partnerProductSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  description: z.string().min(2, "Description is required").max(800),
  logoUrl: z.string().optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  partnerName: z.string().max(120).optional().nullable(),
  links: z.array(productLinkSchema).max(8).optional(),
});

export async function updatePartnerProduct(
  productId: string,
  raw: z.input<typeof partnerProductSchema>
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const parsed = partnerProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "Ecosystem project not found." };

  const nextSlug = await resolveProductSlugOnRename(
    parsed.data.name,
    current.slug,
    productId
  );

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      slug: nextSlug,
      description: parsed.data.description,
      logoUrl: parsed.data.logoUrl || null,
      category: normalizeCategory(parsed.data.category),
      partnerName: parsed.data.partnerName?.trim() || null,
      links: parsed.data.links ?? [],
    },
  });

  revalidatePath("/partner-console");
  revalidatePath(`/partner-console/${productId}/project`);
  revalidatePath("/products");
  revalidatePath(productPath(current.slug));
  revalidatePath(productPath(nextSlug));
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function getPartnerProduct(
  productId: string
): Promise<
  Result<{
    product: {
      id: string;
      name: string;
      description: string;
      logoUrl: string | null;
      category: string | null;
      partnerName: string | null;
      links: { label: string; url: string }[];
      status: string;
    };
  }>
> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      description: true,
      logoUrl: true,
      category: true,
      partnerName: true,
      links: true,
      status: true,
    },
  });
  if (!product) return { error: "Ecosystem project not found." };

  return {
    ok: true,
    product: {
      ...product,
      links: (product.links as { label: string; url: string }[]) ?? [],
    },
  };
}
