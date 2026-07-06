import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

async function nextUniqueSlug(
  base: string,
  fallback: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || fallback;
  let slug = root;
  let n = 1;
  for (;;) {
    if (!(await isTaken(slug))) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

/** Globally unique product slug. */
export async function uniqueProductSlug(
  base: string,
  ignoreId?: string
): Promise<string> {
  return nextUniqueSlug(base, "product", async (slug) => {
    const existing = await prisma.product.findUnique({ where: { slug } });
    return Boolean(existing && existing.id !== ignoreId);
  });
}

/** Keep slug when the display name still maps to it; otherwise allocate a new one. */
export async function resolveProductSlugOnRename(
  name: string,
  currentSlug: string,
  ignoreId?: string
): Promise<string> {
  return slugify(name) === currentSlug
    ? currentSlug
    : uniqueProductSlug(name, ignoreId);
}

/** Unique course slug within a product. */
export async function uniqueCourseSlug(
  base: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  return nextUniqueSlug(base, "course", async (slug) => {
    const existing = await prisma.course.findUnique({
      where: { productId_slug: { productId, slug } },
    });
    return Boolean(existing && existing.id !== ignoreId);
  });
}

/** Keep course slug when title still maps to it; otherwise allocate within product. */
export async function resolveCourseSlugOnRename(
  title: string,
  currentSlug: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  return slugify(title) === currentSlug
    ? currentSlug
    : uniqueCourseSlug(title, productId, ignoreId);
}

/** Unique learning path slug within a product. */
export async function uniqueLearningPathSlug(
  base: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  return nextUniqueSlug(base, "path", async (slug) => {
    const existing = await prisma.learningPath.findUnique({
      where: { productId_slug: { productId, slug } },
    });
    return Boolean(existing && existing.id !== ignoreId);
  });
}

/** Suggested path slug from title when staff leaves slug blank. */
export async function suggestLearningPathSlug(
  title: string,
  productId: string
): Promise<string> {
  const candidate = slugify(title);
  if (!candidate) return uniqueLearningPathSlug(`path-${Date.now()}`, productId);
  return uniqueLearningPathSlug(candidate, productId);
}

export { slugify };
