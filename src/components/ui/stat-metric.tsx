import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatMetricProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
};

export function StatMetric({ label, value, hint, className }: StatMetricProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
