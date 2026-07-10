import Link from "next/link";
import { cn } from "@/lib/utils";

const filterChipBase =
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-45";

export const filterChipInactive =
  "border-border bg-background text-foreground hover:bg-muted/60";

export const filterChipActive =
  "border-[color:var(--featured-border)] bg-[color:color-mix(in_srgb,var(--featured-background)_62%,var(--surface-elevated))] text-foreground shadow-[inset_0_0_0_1px_var(--featured-border)]";

type FilterChipProps = {
  active: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

export function FilterChip({
  active,
  children,
  className,
  disabled,
  href,
  onClick,
}: FilterChipProps) {
  const chipClassName = cn(
    filterChipBase,
    active ? filterChipActive : filterChipInactive,
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={chipClassName}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={chipClassName}
    >
      {children}
    </button>
  );
}
