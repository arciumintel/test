import { prisma } from "@/lib/prisma";
import {
  resolveCategoryLabelFromSlug,
  sortCategoryLabels,
} from "@/lib/project-categories";
import {
  collectLearningOutcomes,
  deriveProductDifficulty,
  type ProductCatalogItem,
} from "@/lib/product-catalog";
import { coursePath, learningPathPath, productPath } from "@/lib/paths";
import type { CourseLevel, ProductRole } from "@prisma/client";

export type ProductLink = {
  label: string;
  url: string;
};

export type ArciumOnboardingEntry = {
  href: string;
  productSlug: string;
  productName: string;
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

const publishedCourseSelect = {
  estimatedDuration: true,
  level: true,
  learningOutcomes: true,
  updatedAt: true,
  _count: {
    select: { lessons: { where: { status: "published" as const } } },
  },
} as const;

const catalogProductInclude = {
  courses: {
    where: { status: "published" as const },
    select: publishedCourseSelect,
  },
  _count: {
    select: { courses: { where: { status: "published" as const } } },
  },
} as const;

function mapProductToCatalogItem(
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    category: string | null;
    role: ProductRole;
    learningOutcomes: string[];
    featured: boolean;
    featuredOrder: number | null;
    updatedAt: Date;
    courses: {
      estimatedDuration: number | null;
      level: CourseLevel;
      learningOutcomes: string[];
      updatedAt: Date;
      _count: { lessons: number };
    }[];
    _count: { courses: number };
  }
): ProductCatalogItem {
  const lessonCount = product.courses.reduce(
    (sum, course) => sum + course._count.lessons,
    0
  );
  const durationTotal = product.courses.reduce(
    (sum, course) => sum + (course.estimatedDuration ?? 0),
    0
  );
  const courseOutcomes = product.courses.flatMap(
    (course) => course.learningOutcomes
  );
  const latestCourseUpdate = product.courses.reduce<Date | null>(
    (latest, course) =>
      !latest || course.updatedAt > latest ? course.updatedAt : latest,
    null
  );
  const updatedAt = latestCourseUpdate
    ? new Date(
        Math.max(product.updatedAt.getTime(), latestCourseUpdate.getTime())
      )
    : product.updatedAt;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    logoUrl: product.logoUrl,
    bannerUrl: product.bannerUrl,
    category: product.category,
    role: product.role,
    featured: product.featured,
    featuredOrder: product.featuredOrder,
    updatedAt: updatedAt.toISOString(),
    courseCount: product._count.courses,
    lessonCount,
    estimatedDurationMinutes: durationTotal > 0 ? durationTotal : null,
    learningOutcomes: collectLearningOutcomes(
      product.learningOutcomes,
      courseOutcomes
    ),
    difficulty: deriveProductDifficulty(
      product.courses.map((course) => course.level)
    ),
  };
}

export async function getProductCatalogItems(options?: {
  category?: string;
  featuredOnly?: boolean;
  role?: ProductRole;
}): Promise<ProductCatalogItem[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "published",
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.featuredOnly ? { featured: true, role: "ecosystem" } : {}),
      ...(options?.role ? { role: options.role } : {}),
    },
    orderBy: options?.featuredOnly
      ? [{ featuredOrder: "asc" }, { name: "asc" }]
      : { name: "asc" },
    include: catalogProductInclude,
  });

  return products.map(mapProductToCatalogItem);
}

export async function getFoundationProducts(): Promise<ProductCatalogItem[]> {
  return getProductCatalogItems({ role: "foundation" });
}

export async function getEcosystemProductCatalogItems(options?: {
  category?: string;
}): Promise<ProductCatalogItem[]> {
  return getProductCatalogItems({ ...options, role: "ecosystem" });
}

export async function getFeaturedProductCatalogItems(): Promise<
  ProductCatalogItem[]
> {
  return getProductCatalogItems({ featuredOnly: true });
}

export async function getArciumOnboardingEntry(): Promise<ArciumOnboardingEntry | null> {
  const foundation = await prisma.product.findFirst({
    where: { status: "published", role: "foundation" },
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      learningPaths: {
        where: { status: "published" },
        orderBy: { order: "asc" },
        take: 1,
        select: { slug: true },
      },
      courses: {
        where: { status: "published", courseType: "foundational" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { slug: true },
      },
    },
  });

  if (!foundation) return null;

  const path = foundation.learningPaths[0];
  if (path) {
    return {
      href: learningPathPath(foundation.slug, path.slug),
      productSlug: foundation.slug,
      productName: foundation.name,
    };
  }

  const course = foundation.courses[0];
  if (course) {
    return {
      href: coursePath(foundation.slug, course.slug),
      productSlug: foundation.slug,
      productName: foundation.name,
    };
  }

  return {
    href: productPath(foundation.slug),
    productSlug: foundation.slug,
    productName: foundation.name,
  };
}

export async function getPublishedProducts(options?: {
  category?: string;
  role?: ProductRole;
}) {
  const products = await prisma.product.findMany({
    where: {
      status: "published",
      ...(options?.category ? { category: options.category } : {}),
      ...(options?.role ? { role: options.role } : {}),
    },
    orderBy: { name: "asc" },
    include: catalogProductInclude,
  });

  return products.map((product) => ({
    ...product,
    links: normalizeLinks(product.links),
  }));
}

export async function getPublishedProductCategoryLabels(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "published",
      role: "ecosystem",
      category: { not: null },
    },
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
    where: {
      status: "published",
      role: "ecosystem",
      category: { not: null },
    },
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
