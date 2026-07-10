import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  ambient?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  ambient = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed border-border-subtle bg-muted/30 p-10 text-center",
        className
      )}
    >
      {ambient ? (
        <div className="bg-ambient pointer-events-none absolute inset-0" aria-hidden />
      ) : null}
      {Icon ? (
        <Icon
          className="relative z-10 mx-auto size-8 text-muted-foreground"
          aria-hidden
        />
      ) : null}
      <p className="relative z-10 mt-3 font-medium text-foreground">{title}</p>
      {description ? (
        <p className="relative z-10 mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative z-10 mt-5">{action}</div> : null}
    </div>
  );
}
