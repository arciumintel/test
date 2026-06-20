import Image from "next/image";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productPath } from "@/lib/paths";

type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  category?: string | null;
  courseCount: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={productPath(product.slug)} className="group block">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {product.logoUrl ? (
                <Image
                  src={product.logoUrl}
                  alt={`${product.name} logo`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <PackageOpen className="size-6 text-primary" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-pretty font-semibold tracking-tight group-hover:text-primary">
                {product.name}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                {product.category && (
                  <span className="text-xs font-medium text-foreground/80">
                    {product.category}
                  </span>
                )}
                <Badge variant="muted">
                  {product.courseCount} course
                  {product.courseCount === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>
          </div>

          <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
