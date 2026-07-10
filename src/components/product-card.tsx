"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  FileText,
  PackageOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/level-badge";
import { productPath } from "@/lib/paths";
import {
  formatDurationHours,
  formatRelativeUpdate,
  productCtaLabel,
  type ProductCatalogItem,
  type ProductProgressState,
} from "@/lib/product-catalog";
import { cn } from "@/lib/utils";
import { getProductCategoryBadgeVariant } from "@/lib/badge-colors";

export type ProductCardData = ProductCatalogItem & {
  progress?: ProductProgressState | null;
};

function ProductCardArtwork({
  product,
  className,
}: {
  product: Pick<ProductCardData, "name" | "bannerUrl" | "logoUrl">;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-media-placeholder",
        className
      )}
    >
      {product.bannerUrl ? (
        <Image
          src={product.bannerUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      ) : null}
      <div
        className="bg-media-fade absolute inset-0"
        aria-hidden
      />
    </div>
  );
}

function ProductCardLogo({
  product,
  className,
}: {
  product: Pick<ProductCardData, "name" | "logoUrl">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-card bg-muted shadow-sm",
        className
      )}
    >
      {product.logoUrl ? (
        <Image
          src={product.logoUrl}
          alt={`${product.name} logo`}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <PackageOpen className="size-6 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

function ProductMetadata({ product }: { product: ProductCardData }) {
  const durationLabel = formatDurationHours(product.estimatedDurationMinutes);
  const items = [
    {
      show: product.courseCount > 0,
      icon: BookOpen,
      label: `${product.courseCount} Course${product.courseCount === 1 ? "" : "s"}`,
    },
    {
      show: Boolean(durationLabel),
      icon: Clock,
      label: durationLabel ?? "",
    },
    {
      show: product.lessonCount > 0,
      icon: FileText,
      label: `${product.lessonCount} Lesson${product.lessonCount === 1 ? "" : "s"}`,
    },
  ].filter((item) => item.show);

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {formatRelativeUpdate(product.updatedAt)}
      </p>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="text-border" aria-hidden>
              •
            </span>
          ) : null}
          <item.icon className="size-3.5 shrink-0" aria-hidden />
          {item.label}
        </span>
      ))}
      <span className="text-border" aria-hidden>
        •
      </span>
      <span>{formatRelativeUpdate(product.updatedAt)}</span>
    </p>
  );
}

function ProductLearningOutcomes({ outcomes }: { outcomes: string[] }) {
  if (outcomes.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="text-xs font-medium text-foreground/80">You&apos;ll learn:</p>
      <ul className="mt-2 space-y-1.5">
        {outcomes.map((outcome) => (
          <li
            key={outcome}
            className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="line-clamp-2">{outcome}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductProgressSection({
  progress,
}: {
  progress: ProductProgressState;
}) {
  if (progress.completed) {
    return (
      <div className="mt-4 border-t border-border/60 pt-4">
        <StatusBadge variant="success">Completed</StatusBadge>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground/80">Your progress</span>
        <span className="tabular-nums text-muted-foreground">{progress.pct}%</span>
      </div>
      <Progress value={progress.pct} className="mt-2" aria-hidden />
    </div>
  );
}

function ProductCardCta({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 group-hover:text-foreground",
        className
      )}
    >
      {label}
      <ArrowRight
        className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
        aria-hidden
      />
    </span>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const ctaLabel = productCtaLabel(product.progress);
  const href = product.progress?.resumeHref ?? productPath(product.slug);

  return (
    <Link
      href={href}
      aria-label={`${ctaLabel} — ${product.name}`}
      className="group block min-w-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <Card className="product-card h-full min-w-0 gap-0 overflow-hidden p-0 motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5">
        <ProductCardArtwork product={product} className="h-28 w-full" />
        <CardContent className="flex min-w-0 flex-1 flex-col p-6 pt-0">
          <div className="-mt-7 mb-4 flex items-end justify-between gap-3">
            <ProductCardLogo product={product} />
            {product.difficulty ? (
              <LevelBadge level={product.difficulty} />
            ) : null}
          </div>

          <div className="min-w-0 space-y-2">
            <h3 className="line-clamp-2 text-pretty text-lg font-semibold leading-snug tracking-tight group-hover:text-foreground">
              {product.name}
            </h3>
            {product.category ? (
              <Badge
                variant={getProductCategoryBadgeVariant(product.category)}
                className="max-w-full truncate"
              >
                {product.category}
              </Badge>
            ) : null}
          </div>

          <p className="mt-3 line-clamp-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-4">
            <ProductMetadata product={product} />
          </div>

          <ProductLearningOutcomes outcomes={product.learningOutcomes} />

          {product.progress ? (
            <ProductProgressSection progress={product.progress} />
          ) : null}

          <div className="mt-auto pt-1">
            <ProductCardCta label={ctaLabel} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function FeaturedProductCard({ product }: { product: ProductCardData }) {
  const ctaLabel = productCtaLabel(product.progress);
  const href = product.progress?.resumeHref ?? productPath(product.slug);

  return (
    <Link
      href={href}
      aria-label={`${ctaLabel} — ${product.name}`}
      className="group block min-w-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <Card className="product-card h-full min-w-0 gap-0 overflow-hidden p-0 motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1">
        <ProductCardArtwork
          product={product}
          className="relative aspect-[16/9] w-full"
        />
        <CardContent className="flex min-w-0 flex-col gap-4 p-6 sm:p-7">
          <div className="-mt-12 flex items-end gap-4">
            <ProductCardLogo product={product} className="size-16" />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="featured">Featured</Badge>
                {product.category ? (
                  <Badge
                    variant={getProductCategoryBadgeVariant(product.category)}
                    className="max-w-full truncate"
                  >
                    {product.category}
                  </Badge>
                ) : null}
              </div>
              <h3 className="mt-2 text-pretty text-xl font-semibold tracking-tight group-hover:text-foreground sm:text-2xl">
                {product.name}
              </h3>
            </div>
          </div>

          <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {product.description}
          </p>

          {product.progress ? (
            <ProductProgressSection progress={product.progress} />
          ) : null}

          <ProductCardCta label={ctaLabel} className="mt-1" />
        </CardContent>
      </Card>
    </Link>
  );
}
