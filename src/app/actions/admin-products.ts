"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ensureEcosystemDirectoryOnProductPublish,
  syncEcosystemDirectoryFromProduct,
} from "@/lib/ecosystem-catalog";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import { getProductPublishReadiness } from "@/lib/publish-readiness";
import { authorizeStaff, toActionError } from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { normalizeCategory } from "@/lib/project-categories";
import { resolveProductSlugOnRename, uniqueProductSlug } from "@/lib/slugs";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const productLinkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().url().max(500),
});

const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  description: z.string().min(2, "Description is required").max(800),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  partnerName: z.string().max(120).optional().nullable(),
  links: z.array(productLinkSchema).max(8).optional(),
  learningOutcomes: z.array(z.string().max(280)).max(8).optional(),
  featured: z.boolean().optional(),
  featuredOrder: z.number().int().min(0).max(999).optional().nullable(),
  role: z.enum(["foundation", "ecosystem"]).optional(),
});

export async function createProduct(
  raw: z.input<typeof productSchema>
): Promise<Result<{ id: string }>> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  const role = data.role ?? "ecosystem";
  const category = role === "foundation" ? null : normalizeCategory(data.category);
  const featured = role === "foundation" ? false : (data.featured ?? false);
  const featuredOrder =
    role === "foundation" || !featured ? null : (data.featuredOrder ?? null);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: await uniqueProductSlug(data.name),
      description: data.description,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      category,
      role,
      partnerName: data.partnerName?.trim() || null,
      links: data.links ?? [],
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
      featured,
      featuredOrder,
    },
  });

  const { ensureAnalyticsProfileForProduct } = await import(
    "@/lib/analytics-profile"
  );
  await ensureAnalyticsProfileForProduct(product.id);

  const staff = auth.user;
  trackEventFireAndForget({
    eventName: "admin_ecosystem_project_created",
      source: "admin",
      path: "/admin/products/new",
      userId: staff.id,
      ecosystemProjectId: product.id,
      ecosystemProjectSlug: product.slug,
      metadata: { adminUserId: staff.id },
    });

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/start");
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  raw: z.input<typeof productSchema>
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return { error: "Product not found." };
  const nextSlug = await resolveProductSlugOnRename(data.name, current.slug, id);
  const role = data.role ?? current.role;
  const category = role === "foundation" ? null : normalizeCategory(data.category);
  const featured = role === "foundation" ? false : (data.featured ?? false);
  const featuredOrder =
    role === "foundation" || !featured ? null : (data.featuredOrder ?? null);

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: nextSlug,
      description: data.description,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      category,
      role,
      partnerName: data.partnerName?.trim() || null,
      links: data.links ?? [],
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
      featured,
      featuredOrder,
    },
  });

  if (current.status === "published") {
    await syncEcosystemDirectoryFromProduct(id, { syncIdentity: true });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/ecosystem");
  revalidatePath("/start");
  revalidatePath(productPath(current.slug));
  revalidatePath(productPath(nextSlug));
  return { ok: true };
}

export async function setProductStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  if (status === "published") {
    const readiness = await getProductPublishReadiness(id);
    if (!readiness.ready) {
      return { error: readiness.blockers[0] };
    }
  }

  const current = await prisma.product.findUnique({
    where: { id },
    select: { status: true, slug: true },
  });
  if (!current) return { error: "Product not found." };

  const product = await prisma.product.update({
    where: { id },
    data: { status },
    select: { slug: true },
  });

  if (status === "published" && current.status !== "published") {
    const staff = auth.user;
    trackEventFireAndForget({
      eventName: "admin_ecosystem_project_published",
      source: "admin",
      path: `/admin/products/${id}`,
      userId: staff.id,
      ecosystemProjectId: id,
      ecosystemProjectSlug: product.slug,
      metadata: {
        adminUserId: staff.id,
        previousStatus: current.status,
        nextStatus: status,
      },
    });
  }

  if (status === "published") {
    await ensureEcosystemDirectoryOnProductPublish(id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/ecosystem");
  revalidatePath("/start");
  revalidatePath(productPath(product.slug));
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });
  if (!product) return { error: "Product not found." };
  if (product._count.courses > 0) {
    return { error: "Move or delete courses before deleting this product." };
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/start");
  revalidatePath(productPath(product.slug));
  return { ok: true };
}
