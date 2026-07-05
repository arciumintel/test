"use client";

import * as React from "react";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ECOSYSTEM_CATEGORIES,
  countByCategory,
  countByStatus,
} from "@/lib/ecosystem";
import {
  RELATIONSHIP_LABELS,
  STATUS_LABELS,
  type EcosystemSort,
  type ProjectStatus,
} from "@/lib/ecosystem/types";
import { useEcosystemExplorerStore } from "@/stores/ecosystem-explorer";
import { cn } from "@/lib/utils";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}

type ExplorerSidebarProps = {
  className?: string;
  onClose?: () => void;
};

export function ExplorerSidebar({ className, onClose }: ExplorerSidebarProps) {
  const query = useEcosystemExplorerStore((state) => state.query);
  const sort = useEcosystemExplorerStore((state) => state.sort);
  const filters = useEcosystemExplorerStore((state) => state.filters);
  const filteredProjects = useEcosystemExplorerStore(
    (state) => state.filteredProjects
  );
  const allProjects = useEcosystemExplorerStore((state) => state.allProjects);
  const setQuery = useEcosystemExplorerStore((state) => state.setQuery);
  const setSort = useEcosystemExplorerStore((state) => state.setSort);
  const toggleCategoryFilter = useEcosystemExplorerStore(
    (state) => state.toggleCategoryFilter
  );
  const toggleStatusFilter = useEcosystemExplorerStore(
    (state) => state.toggleStatusFilter
  );
  const clearAllFilters = useEcosystemExplorerStore(
    (state) => state.clearAllFilters
  );
  const resetView = useEcosystemExplorerStore((state) => state.resetView);

  const categoryCounts = countByCategory(allProjects);
  const statusCounts = countByStatus(
    filters.categoryIds.length > 0
      ? allProjects.filter((project) =>
          filters.categoryIds.includes(project.categoryId)
        )
      : allProjects
  );
  const hasActiveFilters =
    Boolean(query.trim()) ||
    filters.categoryIds.length > 0 ||
    filters.statuses.length > 0;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card/80 backdrop-blur-md",
        className
      )}
      aria-label="Ecosystem filters"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold">Discover</h2>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close filters">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <label htmlFor="eco-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="eco-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find any project…"
              className="pl-9"
              aria-describedby="eco-results-count"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="eco-sort" className="text-xs font-medium text-muted-foreground">
            Sort by
          </label>
          <Select
            id="eco-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as EcosystemSort)}
          >
            <option value="featured">Featured</option>
            <option value="trending">Trending</option>
            <option value="recent">Recently added</option>
            <option value="alphabetical">Alphabetical</option>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Categories</p>
          <div className="flex flex-wrap gap-2">
            {ECOSYSTEM_CATEGORIES.map((category) => (
              <FilterChip
                key={category.id}
                active={filters.categoryIds.includes(category.id)}
                onClick={() => toggleCategoryFilter(category.id)}
              >
                {category.label}
                <span className="ml-1 opacity-70">
                  ({categoryCounts[category.id] ?? 0})
                </span>
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
              <FilterChip
                key={status}
                active={filters.statuses.includes(status)}
                onClick={() => toggleStatusFilter(status)}
              >
                {STATUS_LABELS[status]}
                <span className="ml-1 opacity-70">({statusCounts[status]})</span>
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Relationship types
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {Object.entries(RELATIONSHIP_LABELS).map(([type, label]) => (
              <li key={type} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full bg-primary/70"
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Connections appear when you hover or select a project.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t px-4 py-4">
        <p id="eco-results-count" className="text-sm" aria-live="polite">
          <span className="font-medium text-foreground">
            {filteredProjects.length}
          </span>{" "}
          project{filteredProjects.length === 1 ? "" : "s"} visible
        </p>
        <div className="flex flex-wrap gap-2">
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear filters
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={resetView}>
            <RotateCcw className="size-4" aria-hidden />
            Reset view
          </Button>
        </div>
      </div>
    </aside>
  );
}
