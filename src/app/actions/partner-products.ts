"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import { requireProjectAdmin } from "@/lib/project-admin";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "product";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

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
  try {
    await requireProjectAdmin(productId);
  } catch {
    return { error: "You do not have permission to manage this project." };
  }

  const parsed = partnerProductSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "Ecosystem project not found." };

  const nextSlug =
    slugify(parsed.data.name) === current.slug
      ? current.slug
      : await uniqueSlug(parsed.data.name, productId);

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      slug: nextSlug,
      description: parsed.data.description,
      logoUrl: parsed.data.logoUrl || null,
      category: parsed.data.category?.trim() || null,
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
  try {
    await requireProjectAdmin(productId);
  } catch {
    return { error: "You do not have permission to manage this project." };
  }

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
