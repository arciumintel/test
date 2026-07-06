import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, PackageOpen } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { productPath } from "@/lib/paths";
import {
  foundationStartCtaLabel,
  type ProductCatalogItem,
  type ProductProgressState,
} from "@/lib/product-catalog";

type FoundationStartHeroProps = {
  product: ProductCatalogItem;
  onboardingHref: string;
  progress?: ProductProgressState | null;
};

export function FoundationStartHero({
  product,
  onboardingHref,
  progress,
}: FoundationStartHeroProps) {
  const ctaLabel = foundationStartCtaLabel(progress);
  const ctaHref = progress?.resumeHref ?? onboardingHref;

  return (
    <section
      aria-labelledby="foundation-start-heading"
      className="bg-hero-panel overflow-hidden rounded-2xl border"
    >
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-5 p-6 sm:p-8 md:pr-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted shadow-sm">
              {product.logoUrl ? (
                <Image
                  src={product.logoUrl}
                  alt={`${product.name} logo`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <PackageOpen className="size-6 text-primary" aria-hidden />
              )}
            </span>
            <Badge variant="default">Core learning</Badge>
          </div>

          <div>
            <h2
              id="foundation-start-heading"
              className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {product.name}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>
          </div>

          {product.learningOutcomes.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-foreground/80">
                You&apos;ll learn:
              </p>
              <ul className="mt-2 space-y-1.5">
                {product.learningOutcomes.slice(0, 3).map((outcome) => (
                  <li
                    key={outcome}
                    className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {progress ? (
            progress.completed ? (
              <StatusBadge variant="success">Completed</StatusBadge>
            ) : (
              <div className="max-w-md">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground/80">
                    Your progress
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {progress.pct}%
                  </span>
                </div>
                <Progress value={progress.pct} className="mt-2" aria-hidden />
              </div>
            )
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" asChild>
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight />
              </Link>
            </Button>
            <Link
              href={productPath(product.slug)}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              View full {product.name} page
            </Link>
          </div>
        </div>

        {product.bannerUrl ? (
          <div className="relative hidden min-h-[12rem] md:block md:min-h-0 md:w-72 lg:w-80">
            <Image
              src={product.bannerUrl}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
            <div
              className="bg-banner-edge-fade absolute inset-0"
              aria-hidden
            />
          </div>
        ) : (
          <div
            className="bg-media-placeholder hidden md:block md:w-48 lg:w-56"
            aria-hidden
          />
        )}
      </div>
    </section>
  );
}
