"use client";

import * as React from "react";
import { ProjectCard } from "@/components/ecosystem/project-card";
import { getCategoryLabel } from "@/lib/ecosystem";
import type { EcosystemProject } from "@/lib/ecosystem/types";
import { cn } from "@/lib/utils";

type EcosystemListViewProps = {
  projects: EcosystemProject[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
  className?: string;
};

export function EcosystemListView({
  projects,
  selectedProjectId,
  onSelect,
  className,
}: EcosystemListViewProps) {
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  React.useEffect(() => {
    if (!selectedProjectId) return;
    itemRefs.current.get(selectedProjectId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedProjectId]);

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    projectId: string,
    index: number
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(projectId);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = projects[index + 1];
      if (next) itemRefs.current.get(next.id)?.focus();
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const prev = projects[index - 1];
      if (prev) itemRefs.current.get(prev.id)?.focus();
    }
  }

  if (projects.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-12 text-center",
          className
        )}
      >
        <p className="font-medium">No projects match your filters</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try adjusting search, category, or status filters to discover more of
          the ecosystem.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
      role="list"
      aria-label="Ecosystem projects"
    >
      {projects.map((project, index) => {
        const selected = selectedProjectId === project.id;
        return (
          <button
            key={project.id}
            ref={(node) => {
              if (node) itemRefs.current.set(project.id, node);
              else itemRefs.current.delete(project.id);
            }}
            type="button"
            role="listitem"
            aria-current={selected ? "true" : undefined}
            aria-label={`${project.name}, ${getCategoryLabel(project.categoryId)}`}
            onClick={() => onSelect(project.id)}
            onKeyDown={(event) => handleKeyDown(event, project.id, index)}
            className={cn(
              "rounded-xl text-left transition-shadow focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            <ProjectCard project={project} compact className="h-full" />
          </button>
        );
      })}
    </div>
  );
}
