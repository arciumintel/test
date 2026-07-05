"use client";

import { LayoutGrid, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/lib/ecosystem/types";
import { cn } from "@/lib/utils";

type ViewToggleProps = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
};

export function ViewToggle({ viewMode, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border bg-card p-1 shadow-sm",
        className
      )}
      role="group"
      aria-label="Visualization view"
    >
      <Button
        type="button"
        variant={viewMode === "galaxy" ? "default" : "ghost"}
        size="sm"
        className="rounded-lg"
        aria-pressed={viewMode === "galaxy"}
        onClick={() => onChange("galaxy")}
      >
        <Orbit className="size-4" aria-hidden />
        Galaxy
      </Button>
      <Button
        type="button"
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-lg"
        aria-pressed={viewMode === "list"}
        onClick={() => onChange("list")}
      >
        <LayoutGrid className="size-4" aria-hidden />
        List
      </Button>
    </div>
  );
}
