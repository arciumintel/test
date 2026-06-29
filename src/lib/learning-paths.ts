import { prisma } from "@/lib/prisma";
import { coursePath } from "@/lib/paths";

export type PublishedLearningPath = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  courses: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    level: string;
    estimatedDuration: number | null;
    productSlug: string;
    order: number;
  }[];
};

export async function getPublishedLearningPaths(
  productSlug: string
): Promise<PublishedLearningPath[]> {
  const paths = await prisma.learningPath.findMany({
    where: {
      status: "published",
      product: { slug: productSlug, status: "published" },
    },
    orderBy: { order: "asc" },
    include: {
      courses: {
        orderBy: { order: "asc" },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              level: true,
              estimatedDuration: true,
              status: true,
              product: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  return paths
    .map((path) => ({
      id: path.id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      courses: path.courses
        .filter((pc) => pc.course.status === "published")
        .map((pc) => ({
          id: pc.course.id,
          slug: pc.course.slug,
          title: pc.course.title,
          summary: pc.course.summary,
          level: pc.course.level,
          estimatedDuration: pc.course.estimatedDuration,
          productSlug: pc.course.product.slug,
          order: pc.order,
        })),
    }))
    .filter((path) => path.courses.length > 0);
}

export function learningPathCourseHref(
  productSlug: string,
  courseSlug: string
): string {
  return coursePath(productSlug, courseSlug);
}

export async function getAdminLearningPaths(productId: string) {
  return prisma.learningPath.findMany({
    where: { productId },
    orderBy: { order: "asc" },
    include: {
      courses: {
        orderBy: { order: "asc" },
        include: {
          course: { select: { id: true, title: true, slug: true, status: true } },
        },
      },
    },
  });
}

export async function getPublishedLearningPathBySlug(
  productSlug: string,
  pathSlug: string
): Promise<PublishedLearningPath | null> {
  const path = await prisma.learningPath.findFirst({
    where: {
      slug: pathSlug,
      status: "published",
      product: { slug: productSlug, status: "published" },
    },
    include: {
      courses: {
        orderBy: { order: "asc" },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              level: true,
              estimatedDuration: true,
              status: true,
              product: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  if (!path) return null;

  const courses = path.courses
    .filter((pc) => pc.course.status === "published")
    .map((pc) => ({
      id: pc.course.id,
      slug: pc.course.slug,
      title: pc.course.title,
      summary: pc.course.summary,
      level: pc.course.level,
      estimatedDuration: pc.course.estimatedDuration,
      productSlug: pc.course.product.slug,
      order: pc.order,
    }));

  if (courses.length === 0) return null;

  return {
    id: path.id,
    title: path.title,
    slug: path.slug,
    description: path.description,
    courses,
  };
}
