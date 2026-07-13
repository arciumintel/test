"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAnalyticsHelp,
  type AnalyticsHelpKey,
} from "@/lib/analytics-help";
import { cn } from "@/lib/utils";

export function AnalyticsInfoTip({
  helpKey,
  className,
  side = "top",
}: {
  helpKey: AnalyticsHelpKey;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const entry = getAnalyticsHelp(helpKey);
  const label = entry.title
    ? `About ${entry.title}`
    : "More information";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              className
            )}
            aria-label={label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={6}
          className="max-w-[16rem] px-3 py-2 text-left text-xs leading-relaxed text-balance"
        >
          {entry.title ? (
            <p className="mb-1 font-medium text-background">{entry.title}</p>
          ) : null}
          <p>{entry.body}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Label row with an optional info tip beside the text. */
export function MetricHelpLabel({
  children,
  helpKey,
  className,
}: {
  children: ReactNode;
  helpKey?: AnalyticsHelpKey;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{children}</span>
      {helpKey ? <AnalyticsInfoTip helpKey={helpKey} /> : null}
    </span>
  );
}
