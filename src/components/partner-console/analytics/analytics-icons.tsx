import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Brain,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Medal,
  MousePointerClick,
  PieChart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ANALYTICS_TAB_ICONS = {
  overview: LayoutDashboard,
  courses: BookOpen,
  concepts: Brain,
  assessments: ClipboardCheck,
  readiness: Gauge,
  certifications: Medal,
  recommendations: Sparkles,
} as const;

export type AnalyticsTabId = keyof typeof ANALYTICS_TAB_ICONS;

export const OVERVIEW_METRIC_ICONS = {
  health_score: HeartPulse,
  learners_started: Users,
  completion_rate: PieChart,
  badges_awarded: Award,
  quiz_pass_rate: Target,
  start_conversion: MousePointerClick,
} as const;

export type OverviewMetricId = keyof typeof OVERVIEW_METRIC_ICONS;

export function AnalyticsIconBadge({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary",
        size === "sm" ? "size-8" : "size-10",
        className
      )}
    >
      <Icon
        className={size === "sm" ? "size-4" : "size-5"}
        aria-hidden
      />
    </div>
  );
}

export function AnalyticsPageHeading({
  tab,
  title,
  description,
}: {
  tab: AnalyticsTabId;
  title: string;
  description?: ReactNode;
}) {
  const Icon = ANALYTICS_TAB_ICONS[tab];

  return (
    <div className="flex items-start gap-3">
      <AnalyticsIconBadge icon={Icon} className="mt-0.5" />
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
