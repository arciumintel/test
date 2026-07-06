import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, PackageOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrackView } from "@/components/analytics/track-view";
import { ProductReferralLinks } from "@/components/analytics/product-referral-links";
import { getProductBySlug } from "@/lib/products";
import { getPublishedLearningPaths } from "@/lib/learning-paths";
import { LearningPathTimeline } from "@/components/learning-path-timeline";
import { productPath } from "@/lib/paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product || product.status !== "published")
    return { title: "Ecosystem Project" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product || product.status !== "published") notFound();

  const learningPaths = await getPublishedLearningPaths(productSlug);

  const pagePath = productPath(product.slug);
  const isFoundation = product.role === "foundation";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <TrackView
        eventName="ecosystem_project_viewed"
        path={pagePath}
        ecosystemProjectId={product.id}
        ecosystemProjectSlug={product.slug}
        metadata={{ visibleCourseCount: product.courses.length }}
      />
      <Breadcrumbs
        items={[
          isFoundation
            ? { label: "Learn Arcium", href: "/start" }
            : { label: "Ecosystem Projects", href: "/products" },
          { label: product.name },
        ]}
      />

      <section className="grid gap-8 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-[1fr_280px] md:p-8">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="default">
              {isFoundation ? "Core learning" : "Ecosystem Project"}
            </Badge>
            {!isFoundation && product.category && (
              <Badge variant="muted">{product.category}</Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          {product.partnerName && product.partnerName !== product.name && (
            <p className="mt-2 text-sm text-muted-foreground">
              Maintained by {product.partnerName}
            </p>
          )}
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Official Arcademy learning for {product.name}.
              {product.partnerName && product.partnerName !== product.name
                ? ` Curated in partnership with ${product.partnerName}.`
                : " Start with a structured course and earn recognition tied to your wallet."}
            </p>
          </div>
          <ProductReferralLinks
            links={product.links}
            ecosystemProjectId={product.id}
            ecosystemProjectSlug={product.slug}
            path={pagePath}
          />
        </div>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border bg-media-placeholder">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={`${product.name} logo`}
              fill
              sizes="280px"
              className="object-cover"
            />
          ) : (
            <PackageOpen className="size-16 text-primary/50" />
          )}
        </div>
      </section>

      <section className="mt-12">
        {learningPaths.length > 0 ? (
          <>
            <LearningPathTimeline paths={learningPaths} productSlug={product.slug} />
            <div className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">All courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse every published course for {product.name}.
              </p>
            </div>
          </>
        ) : (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with the official learning paths for {product.name}.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/courses">
                View all courses
                <ArrowRight />
              </Link>
            </Button>
          </div>
        )}

        {learningPaths.length > 0 && (
          <div className="mb-6 mt-4 flex justify-end">
            <Button variant="ghost" asChild>
              <Link href="/courses">
                View all courses
                <ArrowRight />
              </Link>
            </Button>
          </div>
        )}

        {product.courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={{
                  productSlug: product.slug,
                  productName: product.name,
                  slug: course.slug,
                  title: course.title,
                  summary: course.summary,
                  level: course.level,
                  courseType: course.courseType,
                  thumbnailUrl: course.thumbnailUrl,
                  estimatedDuration: course.estimatedDuration,
                  lessonCount: course._count.lessons,
                  hasBadge: Boolean(course.badge),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <PackageOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Courses are coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The Arcademy team is preparing learning paths for this ecosystem
              project.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
