import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LearningPathTimeline } from "@/components/learning-path-timeline";
import { getPublishedLearningPathBySlug } from "@/lib/learning-paths";
import { getProductBySlug } from "@/lib/products";
import { productPath } from "@/lib/paths";

export default async function LearningPathPage({
  params,
}: {
  params: Promise<{ productSlug: string; pathSlug: string }>;
}) {
  const { productSlug, pathSlug } = await params;

  const [product, path] = await Promise.all([
    getProductBySlug(productSlug),
    getPublishedLearningPathBySlug(productSlug, pathSlug),
  ]);

  if (!product || product.status !== "published" || !path) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={productPath(product.slug)}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {product.name}
      </Link>
      <LearningPathTimeline paths={[path]} productSlug={product.slug} />
    </div>
  );
}
