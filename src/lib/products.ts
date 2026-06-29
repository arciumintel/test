import { prisma } from "@/lib/prisma";
import {
  resolveCategoryLabelFromSlug,
  sortCategoryLabels,
} from "@/lib/project-categories";

export type ProductLink = {
  label: string;
  url: string;
};

export function normalizeLinks(value: unknown): ProductLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (link): link is ProductLink =>
        typeof link === "object" &&
        link !== null &&
        "label" in link &&
        "url" in link &&
        typeof link.label === "string" &&
        typeof link.url === "string"
    )
    .map((link) => ({ label: link.label, url: link.url }));
}

export async function getPublishedProducts(options?: { category?: string }) {
  const products = await prisma.product.findMany({
    where: {
      status: "published",
      ...(options?.category ? { category: options.category } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { courses: { where: { status: "published" } } },
      },
    },
  });

  return products.map((product) => ({
    ...product,
    links: normalizeLinks(product.links),
  }));
}

export async function getPublishedProductCategoryLabels(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { status: "published", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  const labels = rows
    .map((row) => row.category?.trim())
    .filter((label): label is string => Boolean(label));

  return sortCategoryLabels(labels);
}

export async function resolvePublishedCategoryFilter(
  categorySlug: string | undefined
): Promise<string | undefined> {
  if (!categorySlug?.trim()) return undefined;

  const rows = await prisma.product.findMany({
    where: { status: "published", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  const labels = rows
    .map((row) => row.category?.trim())
    .filter((label): label is string => Boolean(label));

  return resolveCategoryLabelFromSlug(categorySlug, labels) ?? undefined;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      courses: {
        where: { status: "published" },
        orderBy: { createdAt: "asc" },
        include: {
          badge: true,
          _count: { select: { lessons: { where: { status: "published" } } } },
        },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    links: normalizeLinks(product.links),
  };
}
