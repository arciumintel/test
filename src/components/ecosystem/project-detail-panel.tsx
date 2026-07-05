"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ecosystem/project-card";
import { useEcosystemExplorerStore } from "@/stores/ecosystem-explorer";

export function ProjectDetailPanel() {
  const selectedProjectId = useEcosystemExplorerStore(
    (state) => state.selectedProjectId
  );
  const reducedMotion = useEcosystemExplorerStore((state) => state.reducedMotion);
  const closePanel = useEcosystemExplorerStore((state) => state.closePanel);
  const selectProject = useEcosystemExplorerStore((state) => state.selectProject);
  const allProjects = useEcosystemExplorerStore((state) => state.allProjects);
  const project = useEcosystemExplorerStore((state) =>
    state.selectedProjectId
      ? state.getProjectById(state.selectedProjectId)
      : undefined
  );

  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.8 };

  return (
    <AnimatePresence mode="wait">
      {selectedProjectId && project ? (
        <>
          <motion.button
            type="button"
            aria-label="Close project details"
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={closePanel}
          />
          <motion.aside
            key={project.id}
            role="dialog"
            aria-labelledby="eco-project-title"
            aria-modal="true"
            className="eco-panel fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-t lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[min(100%,28rem)] lg:border-t-0 lg:border-l"
            initial={reducedMotion ? false : { x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? undefined : { x: "100%", opacity: 0 }}
            transition={transition}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-md">
              <p className="text-sm font-medium text-muted-foreground">
                Project details
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                aria-label="Close panel"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="p-4">
              <ProjectCard
                project={project}
                allProjects={allProjects}
                onSelectRelated={(projectId) => selectProject(projectId)}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
