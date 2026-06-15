import { prisma } from "@/lib/prisma";

export type ProductLink = {
  label: string;
  url: string;
};

function normalizeLinks(value: unknown): ProductLink[] {
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

export async function getPublishedProducts() {
  const products = await prisma.product.findMany({
    where: { status: "published" },
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
