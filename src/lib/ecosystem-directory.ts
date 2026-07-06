/**
 * Maps `EcosystemDirectoryEntry` rows (and optional linked `Product` identity) to explorer UI.
 * For the learning vs ecosystem catalog seam, see `@/lib/ecosystem-catalog`.
 */
import type {
  DirectoryNetworkStatus,
  EcosystemDirectoryEntry,
  Prisma,
  Product,
  ProductStatus,
} from "@prisma/client";
import { ECOSYSTEM_CATEGORIES } from "@/lib/ecosystem/data";
import type {
  EcosystemProject,
  ProjectLinks,
  ProjectRelationship,
  ProjectStatus,
} from "@/lib/ecosystem/types";
import { categoryToSlug } from "@/lib/project-categories";
import { normalizeLinks } from "@/lib/products";
import { prisma } from "@/lib/prisma";

const PRODUCT_CATEGORY_TO_EXPLORER: Record<string, string> = {
  "DeFi & Trading": "defi",
  "Artificial Intelligence": "ai",
  "Payments & Wallets": "wallets",
  "Consumer Apps": "gaming",
  "Prediction Markets": "defi",
};

const EXPLORER_CATEGORY_IDS = new Set(
  ECOSYSTEM_CATEGORIES.map((category) => category.id)
);

type DirectoryEntryWithProduct = EcosystemDirectoryEntry & {
  product: Pick<
    Product,
    | "id"
    | "slug"
    | "name"
    | "description"
    | "logoUrl"
    | "links"
    | "featured"
    | "status"
    | "category"
  > | null;
};

export function mapProductCategoryToExplorerCategory(
  category: string | null | undefined
): string {
  if (!category) return "infrastructure";
  const mapped = PRODUCT_CATEGORY_TO_EXPLORER[category];
  if (mapped) return mapped;

  const slug = categoryToSlug(category);
  if (EXPLORER_CATEGORY_IDS.has(slug)) return slug;

  return "tooling";
}

export function deriveTagline(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (sentence && sentence.length <= 160) return sentence;

  return trimmed.length <= 160 ? trimmed : `${trimmed.slice(0, 157).trim()}…`;
}

export function productLinksToProjectLinks(links: unknown): ProjectLinks {
  const normalized = normalizeLinks(links);
  const result: ProjectLinks = {};

  for (const link of normalized) {
    const label = link.label.toLowerCase();
    if (label.includes("doc")) {
      result.docs = link.url;
    } else if (label.includes("github") || label.includes("code")) {
      result.github = link.url;
    } else if (label.includes("twitter") || label === "x") {
      result.twitter = link.url;
    } else if (!result.website) {
      result.website = link.url;
    }
  }

  return result;
}

function mergeProjectLinks(
  primary: ProjectLinks,
  fallback: ProjectLinks
): ProjectLinks {
  return {
    website: primary.website ?? fallback.website,
    docs: primary.docs ?? fallback.docs,
    github: primary.github ?? fallback.github,
    twitter: primary.twitter ?? fallback.twitter,
  };
}

function networkStatusToProjectStatus(
  status: DirectoryNetworkStatus
): ProjectStatus {
  return status;
}

function parseProjectLinks(value: unknown): ProjectLinks {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const links: ProjectLinks = {};

  for (const key of ["website", "docs", "github", "twitter"] as const) {
    const url = record[key];
    if (typeof url === "string" && url.trim()) {
      links[key] = url;
    }
  }

  return links;
}

function parseRelationships(value: unknown): ProjectRelationship[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const targetId = record.targetId;
    const type = record.type;
    if (typeof targetId !== "string" || typeof type !== "string") return [];

    if (
      type !== "sdk" &&
      type !== "infrastructure" &&
      type !== "partnership" &&
      type !== "tooling"
    ) {
      return [];
    }

    return [{ targetId, type }];
  });
}

function formatAddedAt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function identitySnapshotFromProduct(product: {
  name: string;
  description: string;
  logoUrl: string | null;
  links: unknown;
}): Pick<EcosystemProject, "name" | "tagline" | "description" | "logoUrl" | "links"> {
  return {
    name: product.name,
    tagline: deriveTagline(product.description),
    description: product.description,
    logoUrl: product.logoUrl,
    links: productLinksToProjectLinks(product.links),
  };
}

export function mergeDirectoryEntryForExplorer(
  entry: DirectoryEntryWithProduct
): EcosystemProject {
  const fallbackLinks = parseProjectLinks(entry.links);
  const relationships = parseRelationships(entry.relationships);
  const product = entry.product;
  const published = product?.status === "published";

  const identity =
    published && product
      ? identitySnapshotFromProduct(product)
      : {
          name: entry.name,
          tagline: entry.tagline,
          description: entry.description,
          logoUrl: entry.logoUrl,
          links: fallbackLinks,
        };

  const links =
    published && product
      ? mergeProjectLinks(
          productLinksToProjectLinks(product.links),
          fallbackLinks
        )
      : fallbackLinks;

  return {
    id: entry.slug,
    slug: entry.slug,
    name: identity.name,
    tagline: identity.tagline,
    description: identity.description,
    logoUrl: identity.logoUrl,
    categoryId: entry.categoryId,
    status: networkStatusToProjectStatus(entry.networkStatus),
    featured: entry.featured || Boolean(published && product?.featured),
    trending: entry.trending,
    addedAt: formatAddedAt(entry.addedAt),
    tags: entry.tags,
    links,
    relationships,
    learningSurface: product
      ? { slug: product.slug, available: published }
      : undefined,
  };
}

export async function getExplorerProjects(): Promise<EcosystemProject[]> {
  const entries = await prisma.ecosystemDirectoryEntry.findMany({
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          logoUrl: true,
          links: true,
          featured: true,
          status: true,
          category: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  return entries.map(mergeDirectoryEntryForExplorer);
}

function directoryIdentityPayload(product: {
  name: string;
  description: string;
  logoUrl: string | null;
  links: unknown;
}) {
  const snapshot = identitySnapshotFromProduct(product);
  return {
    name: snapshot.name,
    tagline: snapshot.tagline,
    description: snapshot.description,
    logoUrl: snapshot.logoUrl,
    links: snapshot.links,
  };
}

export async function syncEcosystemDirectoryFromProduct(
  productId: string,
  options?: { syncIdentity?: boolean }
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logoUrl: true,
      links: true,
      featured: true,
      status: true,
      category: true,
      role: true,
    },
  });

  if (!product) return;

  const syncIdentity =
    options?.syncIdentity ?? product.status === ("published" as ProductStatus);
  const categoryId = mapProductCategoryToExplorerCategory(product.category);
  const identity = syncIdentity ? directoryIdentityPayload(product) : undefined;

  await prisma.ecosystemDirectoryEntry.upsert({
    where: { productId: product.id },
    create: {
      slug: product.slug,
      productId: product.id,
      categoryId,
      featured: product.featured,
      networkStatus: "mainnet",
      name: identity?.name ?? product.name,
      tagline: identity?.tagline ?? deriveTagline(product.description),
      description: identity?.description ?? product.description,
      logoUrl: identity?.logoUrl ?? product.logoUrl,
      links: (identity?.links ??
        productLinksToProjectLinks(product.links)) as Prisma.InputJsonValue,
    },
    update: {
      slug: product.slug,
      categoryId,
      featured: product.featured,
      ...(identity
        ? {
            ...identity,
            links: identity.links as Prisma.InputJsonValue,
          }
        : {}),
    },
  });
}

export async function ensureEcosystemDirectoryOnProductPublish(
  productId: string
): Promise<void> {
  await syncEcosystemDirectoryFromProduct(productId, { syncIdentity: true });
}

export type SeedDirectoryEntryInput = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  categoryId: string;
  networkStatus: DirectoryNetworkStatus;
  featured: boolean;
  trending: boolean;
  tags: string[];
  links: ProjectLinks;
  relationships: ProjectRelationship[];
  addedAt: string;
  productSlug?: string;
};

export async function upsertSeedDirectoryEntry(
  input: SeedDirectoryEntryInput
): Promise<void> {
  const product = input.productSlug
    ? await prisma.product.findUnique({
        where: { slug: input.productSlug },
        select: { id: true },
      })
    : await prisma.product.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

  await prisma.ecosystemDirectoryEntry.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      productId: product?.id ?? null,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      logoUrl: input.logoUrl,
      categoryId: input.categoryId,
      networkStatus: input.networkStatus,
      featured: input.featured,
      trending: input.trending,
      tags: input.tags,
      links: input.links as unknown as Prisma.InputJsonValue,
      relationships: input.relationships as unknown as Prisma.InputJsonValue,
      addedAt: new Date(input.addedAt),
    },
    update: {
      productId: product?.id ?? undefined,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      logoUrl: input.logoUrl,
      categoryId: input.categoryId,
      networkStatus: input.networkStatus,
      featured: input.featured,
      trending: input.trending,
      tags: input.tags,
      links: input.links as unknown as Prisma.InputJsonValue,
      relationships: input.relationships as unknown as Prisma.InputJsonValue,
      addedAt: new Date(input.addedAt),
    },
  });
}
