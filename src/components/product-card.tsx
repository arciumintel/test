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
  courseCount: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={productPath(product.slug)} className="group block">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
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
                  <PackageOpen className="size-6 text-primary" />
                )}
              </span>
              <div>
                <h3 className="font-semibold tracking-tight group-hover:text-primary">
                  {product.name}
                </h3>
                <Badge variant="muted" className="mt-1">
                  {product.courseCount} course
                  {product.courseCount === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>
          </div>

          <p className="line-clamp-3 text-sm text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
