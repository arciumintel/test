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
import { normalizeCategory } from "@/lib/project-categories";
import {
  authorizeProjectAdmin,
  toActionError,
} from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";
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

  if (current.status === "published") {
    await syncEcosystemDirectoryFromProduct(productId, { syncIdentity: true });
  }

  revalidatePath("/partner-console");
  revalidatePath(`/partner-console/${productId}/project`);
  revalidatePath("/products");
  revalidatePath("/ecosystem");
  revalidatePath(productPath(current.slug));
  revalidatePath(productPath(nextSlug));
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function setPartnerProductStatus(
  productId: string,
  status: "draft" | "published"
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  if (status === "published") {
    const readiness = await getProductPublishReadiness(productId);
    if (!readiness.ready) {
      return { error: readiness.blockers[0] };
    }
  }

  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { status: true, slug: true },
  });
  if (!current) return { error: "Ecosystem project not found." };

  if (current.status === "archived") {
    return {
      error: "This project is archived. Contact Arcademy staff to restore it.",
    };
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { status },
    select: { slug: true },
  });

  if (status === "published" && current.status !== "published") {
    trackEventFireAndForget({
      eventName: "partner_ecosystem_project_published",
      source: "server_action",
      path: `/partner-console/${productId}/project`,
      userId: auth.user.id,
      ecosystemProjectId: productId,
      ecosystemProjectSlug: product.slug,
      metadata: {
        partnerUserId: auth.user.id,
        previousStatus: current.status,
        nextStatus: status,
      },
    });
    await ensureEcosystemDirectoryOnProductPublish(productId);
  }

  revalidatePath("/partner-console");
  revalidatePath(`/partner-console/${productId}`);
  revalidatePath(`/partner-console/${productId}/project`);
  revalidatePath("/products");
  revalidatePath("/ecosystem");
  revalidatePath("/start");
  revalidatePath(productPath(product.slug));
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
