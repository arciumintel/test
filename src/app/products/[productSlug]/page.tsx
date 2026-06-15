import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getProductBySlug } from "@/lib/products";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Ecosystem Projects", href: "/products" },
          { label: product.name },
        ]}
      />

      <section className="grid gap-8 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-[1fr_280px] md:p-8">
        <div>
          <Badge variant="default" className="mb-4">
            Ecosystem Project
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {product.description}
          </p>
          {product.links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {product.links.map((link) => (
                <Button key={link.url} variant="outline" size="sm" asChild>
                  <Link href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-accent to-secondary">
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
        <div className="mb-6 flex items-end justify-between gap-4">
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
