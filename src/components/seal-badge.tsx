import { cn } from "@/lib/utils";

type SealBadgeProps = {
  /** Accessible label for the seal graphic */
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Subtle entrance animation for quiz-pass / badge-earn moments */
  celebrate?: boolean;
};

const sizeClasses = {
  sm: "size-12",
  md: "size-20",
  lg: "size-28",
} as const;

/**
 * Lock/key seal badge — decorative credential mark using Vault brass + teal tokens.
 * Body text and controls stay on opaque surfaces; seal is illustrative only.
 */
export function SealBadge({
  label = "Earned credential seal",
  size = "md",
  className,
  celebrate = false,
}: SealBadgeProps) {
  return (
    <div
      className={cn(
        "relative shrink-0",
        sizeClasses[size],
        celebrate && "quiz-pass-celebrate",
        className
      )}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 100 100"
        className="size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="var(--seal)"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="var(--primary)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <rect
          x="38"
          y="46"
          width="24"
          height="20"
          rx="3"
          fill="var(--seal)"
        />
        <path
          d="M42 46v-6a8 8 0 0 1 16 0v6"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="56" r="2.5" fill="var(--primary-foreground)" />
        <path
          d="M50 58.5v5"
          stroke="var(--primary-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
