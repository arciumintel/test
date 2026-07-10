import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors w-fit whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-border-subtle bg-surface-secondary text-text-secondary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        featured: "border-featured-border bg-featured-background text-featured",
        official:
          "border-featured-border bg-featured-background text-featured",
        premium: "border-featured-border bg-featured-background text-featured",
        slate: "border-label-slate-border bg-label-slate-background text-label-slate",
        cyan: "border-label-cyan-border bg-label-cyan-background text-label-cyan",
        purple:
          "border-label-purple-border bg-label-purple-background text-label-purple",
        amber: "border-label-amber-border bg-label-amber-background text-label-amber",
        emerald:
          "border-label-emerald-border bg-label-emerald-background text-label-emerald",
        blue: "border-label-blue-border bg-label-blue-background text-label-blue",
        indigo:
          "border-label-indigo-border bg-label-indigo-background text-label-indigo",
        green: "border-label-green-border bg-label-green-background text-label-green",
        steel: "border-label-steel-border bg-label-steel-background text-label-steel",
        mainnet: "border-transparent bg-success text-success-foreground",
        testnet: "border-info/40 bg-transparent text-info",
        comingSoon:
          "border-transparent bg-warning/14 text-warning-subtle-foreground",
        deprecated:
          "border-destructive/30 bg-destructive/10 text-destructive-subtle-foreground",
        experimental: "border-featured-border bg-featured-background text-featured",
        streak: "border-earned-border bg-earned-background text-earned",
        milestone:
          "border-[color:color-mix(in_srgb,var(--warning)_42%,transparent)] bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)] text-warning-subtle-foreground",
        certification:
          "border-earned-border bg-[color:color-mix(in_srgb,var(--earned-background)_82%,white)] text-earned",
        success: "border-transparent bg-success/12 text-success-subtle-foreground",
        warning: "border-transparent bg-warning/12 text-warning-subtle-foreground",
        info: "border-transparent bg-info/12 text-info-subtle-foreground",
        outline: "border-border/80 text-foreground bg-background",
        destructive:
          "border-transparent bg-destructive/12 text-destructive-subtle-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        earned: "border-earned-border bg-earned-background text-earned",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

function StatusDot({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: VariantProps<typeof badgeVariants>["variant"];
}) {
  const dotColor: Record<NonNullable<typeof variant>, string> = {
    default: "bg-text-secondary",
    secondary: "bg-muted-foreground",
    featured: "bg-featured",
    official: "bg-featured",
    premium: "bg-featured",
    slate: "bg-label-slate",
    cyan: "bg-label-cyan",
    purple: "bg-label-purple",
    amber: "bg-label-amber",
    emerald: "bg-label-emerald",
    blue: "bg-label-blue",
    indigo: "bg-label-indigo",
    green: "bg-label-green",
    steel: "bg-label-steel",
    mainnet: "bg-success-foreground",
    testnet: "bg-info",
    comingSoon: "bg-warning",
    deprecated: "bg-destructive",
    experimental: "bg-featured",
    streak: "bg-earned",
    milestone: "bg-warning",
    certification: "bg-earned",
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
    outline: "bg-foreground/50",
    destructive: "bg-destructive",
    muted: "bg-muted-foreground",
    earned: "bg-earned",
  };

  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        dotColor[variant ?? "default"],
        className
      )}
    />
  );
}

function StatusBadge({
  children,
  variant = "secondary",
  className,
  dotClassName,
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dotClassName?: string;
  }) {
  return (
    <Badge variant={variant} className={className}>
      <StatusDot variant={variant} className={dotClassName} />
      {children}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, StatusDot };
