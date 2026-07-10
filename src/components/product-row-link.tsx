import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { productPath } from "@/lib/paths";

export type ProductRowData = {
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  category?: string | null;
  courseCount: number;
};

export function ProductRowLink({ product }: { product: ProductRowData }) {
  return (
    <Link
      href={productPath(product.slug)}
      aria-label={`View ${product.name} courses`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:px-5"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {product.logoUrl ? (
          <Image
            src={product.logoUrl}
            alt={`${product.name} logo`}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <PackageOpen className="size-5 text-muted-foreground" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate font-medium group-hover:text-foreground">
            {product.name}
          </span>
          {product.category && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {product.category}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {product.description}
        </span>
      </span>
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
        {product.courseCount} course{product.courseCount === 1 ? "" : "s"}
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
