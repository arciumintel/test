"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, RotateCcw } from "lucide-react";
import { EcosystemListView } from "@/components/ecosystem/ecosystem-list-view";
import { ExplorerSidebar } from "@/components/ecosystem/explorer-sidebar";
import { GalaxyCanvas } from "@/components/ecosystem/galaxy-canvas";
import { ProjectDetailPanel } from "@/components/ecosystem/project-detail-panel";
import { ViewToggle } from "@/components/ecosystem/view-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEcosystemExplorerStore } from "@/stores/ecosystem-explorer";

export function EcosystemExplorer() {
  const viewMode = useEcosystemExplorerStore((state) => state.viewMode);
  const viewLevel = useEcosystemExplorerStore((state) => state.viewLevel);
  const filteredProjects = useEcosystemExplorerStore(
    (state) => state.filteredProjects
  );
  const allProjects = useEcosystemExplorerStore((state) => state.allProjects);
  const selectedProjectId = useEcosystemExplorerStore(
    (state) => state.selectedProjectId
  );
  const focusedCategoryId = useEcosystemExplorerStore(
    (state) => state.focusedCategoryId
  );
  const setViewMode = useEcosystemExplorerStore((state) => state.setViewMode);
  const setReducedMotion = useEcosystemExplorerStore(
    (state) => state.setReducedMotion
  );
  const selectProject = useEcosystemExplorerStore((state) => state.selectProject);
  const resetView = useEcosystemExplorerStore((state) => state.resetView);
  const closePanel = useEcosystemExplorerStore((state) => state.closePanel);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [setReducedMotion]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (selectedProjectId) {
          closePanel();
        } else if (viewLevel !== "ecosystem") {
          resetView();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, resetView, selectedProjectId, viewLevel]);

  const breadcrumb =
    viewLevel === "project"
      ? "Project detail"
      : viewLevel === "category"
        ? "Category cluster"
        : "Full ecosystem";

  return (
    <div className="eco-shell flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-b bg-page-header px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Arcium ecosystem</p>
            <h1
              id="ecosystem-heading"
              className="mt-1 text-3xl font-semibold tracking-tight text-balance"
            >
              Ecosystem Explorer
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
              Discover projects building on Arcium. Explore categories, follow
              connections, and learn about each team without leaving the map.{" "}
              <Link
                href="/products"
                className="text-primary underline-offset-4 hover:underline"
              >
                Browse courses by project
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="size-4" aria-hidden />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
                <ExplorerSidebar className="h-full border-0" />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        <ExplorerSidebar className="hidden w-72 shrink-0 lg:flex" />

        <div className="relative min-h-[28rem] flex-1 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{breadcrumb}</span>
              <span className="mx-2" aria-hidden>
                ·
              </span>
              {filteredProjects.length} of {allProjects.length} projects
              {focusedCategoryId ? (
                <>
                  <span className="mx-2" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={resetView}
                    className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    Back to full map
                  </button>
                </>
              ) : null}
            </div>
            {viewLevel !== "ecosystem" ? (
              <Button variant="ghost" size="sm" onClick={resetView}>
                <RotateCcw className="size-4" aria-hidden />
                Reset zoom
              </Button>
            ) : null}
          </div>

          {viewMode === "galaxy" ? (
            <GalaxyCanvas className="eco-viz-frame h-[min(70vh,720px)] min-h-[420px] w-full" />
          ) : (
            <EcosystemListView
              projects={filteredProjects}
              selectedProjectId={selectedProjectId}
              onSelect={selectProject}
            />
          )}
        </div>
      </div>

      <ProjectDetailPanel />
    </div>
  );
}
