import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors w-fit whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/12 text-warning",
        info: "border-transparent bg-info/12 text-info",
        outline: "border-border/80 text-foreground bg-background",
        destructive: "border-transparent bg-destructive/12 text-destructive",
        muted: "border-transparent bg-muted text-muted-foreground",
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
    default: "bg-primary",
    secondary: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
    outline: "bg-foreground/50",
    destructive: "bg-destructive",
    muted: "bg-muted-foreground",
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
