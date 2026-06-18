import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/course-schemas";

export async function uniqueCourseSlug(
  base: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  const root = slugify(base) || "course";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.course.findUnique({
      where: { productId_slug: { productId, slug } },
    });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}
