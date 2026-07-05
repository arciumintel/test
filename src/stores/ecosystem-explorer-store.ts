import { createStore } from "zustand";
import { applyExplorerQuery, ECOSYSTEM_CATEGORIES } from "@/lib/ecosystem";
import type { EcosystemFilters } from "@/lib/ecosystem";
import type {
  EcosystemProject,
  EcosystemSort,
  ProjectStatus,
  ViewLevel,
  ViewMode,
} from "@/lib/ecosystem/types";

export type CanvasTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type EcosystemExplorerState = {
  allProjects: EcosystemProject[];
  query: string;
  sort: EcosystemSort;
  filters: EcosystemFilters;
  viewMode: ViewMode;
  viewLevel: ViewLevel;
  selectedProjectId: string | null;
  hoveredProjectId: string | null;
  hoveredCategoryId: string | null;
  focusedCategoryId: string | null;
  reducedMotion: boolean;
  sidebarOpen: boolean;
  canvasTransform: CanvasTransform;
  filteredProjects: EcosystemProject[];
  setQuery: (query: string) => void;
  setSort: (sort: EcosystemSort) => void;
  toggleCategoryFilter: (categoryId: string) => void;
  clearCategoryFilters: () => void;
  toggleStatusFilter: (status: ProjectStatus) => void;
  clearStatusFilters: () => void;
  clearAllFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setReducedMotion: (value: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCanvasTransform: (transform: CanvasTransform) => void;
  hoverProject: (projectId: string | null) => void;
  hoverCategory: (categoryId: string | null) => void;
  selectProject: (projectId: string) => void;
  focusCategory: (categoryId: string) => void;
  resetView: () => void;
  closePanel: () => void;
  getProjectById: (projectId: string) => EcosystemProject | undefined;
  getSelectedProject: () => EcosystemProject | undefined;
};

const defaultFilters: EcosystemFilters = {
  categoryIds: [],
  statuses: [],
};

const defaultTransform: CanvasTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function recompute(
  allProjects: EcosystemProject[],
  filters: EcosystemFilters,
  query: string,
  sort: EcosystemSort
) {
  return applyExplorerQuery(allProjects, filters, query, sort);
}

export function createEcosystemExplorerStore(allProjects: EcosystemProject[]) {
  return createStore<EcosystemExplorerState>((set, get) => ({
    allProjects,
    query: "",
    sort: "featured",
    filters: defaultFilters,
    viewMode: "galaxy",
    viewLevel: "ecosystem",
    selectedProjectId: null,
    hoveredProjectId: null,
    hoveredCategoryId: null,
    focusedCategoryId: null,
    reducedMotion: false,
    sidebarOpen: false,
    canvasTransform: defaultTransform,
    filteredProjects: recompute(allProjects, defaultFilters, "", "featured"),

    setQuery: (query) =>
      set((state) => ({
        query,
        filteredProjects: recompute(
          state.allProjects,
          state.filters,
          query,
          state.sort
        ),
      })),

    setSort: (sort) =>
      set((state) => ({
        sort,
        filteredProjects: recompute(
          state.allProjects,
          state.filters,
          state.query,
          sort
        ),
      })),

    toggleCategoryFilter: (categoryId) =>
      set((state) => {
        const exists = state.filters.categoryIds.includes(categoryId);
        const categoryIds = exists
          ? state.filters.categoryIds.filter((id) => id !== categoryId)
          : [...state.filters.categoryIds, categoryId];
        const filters = { ...state.filters, categoryIds };
        return {
          filters,
          filteredProjects: recompute(
            state.allProjects,
            filters,
            state.query,
            state.sort
          ),
          viewLevel:
            categoryIds.length === 1
              ? "category"
              : state.viewLevel === "project"
                ? "project"
                : "ecosystem",
          focusedCategoryId:
            categoryIds.length === 1 ? categoryIds[0] : state.focusedCategoryId,
        };
      }),

    clearCategoryFilters: () =>
      set((state) => {
        const filters = { ...state.filters, categoryIds: [] };
        return {
          filters,
          filteredProjects: recompute(
            state.allProjects,
            filters,
            state.query,
            state.sort
          ),
          focusedCategoryId: null,
          viewLevel: state.selectedProjectId ? "project" : "ecosystem",
        };
      }),

    toggleStatusFilter: (status) =>
      set((state) => {
        const exists = state.filters.statuses.includes(status);
        const statuses = exists
          ? state.filters.statuses.filter((item) => item !== status)
          : [...state.filters.statuses, status];
        const filters = { ...state.filters, statuses };
        return {
          filters,
          filteredProjects: recompute(
            state.allProjects,
            filters,
            state.query,
            state.sort
          ),
        };
      }),

    clearStatusFilters: () =>
      set((state) => {
        const filters = { ...state.filters, statuses: [] };
        return {
          filters,
          filteredProjects: recompute(
            state.allProjects,
            filters,
            state.query,
            state.sort
          ),
        };
      }),

    clearAllFilters: () =>
      set((state) => ({
        query: "",
        sort: "featured",
        filters: defaultFilters,
        filteredProjects: recompute(
          state.allProjects,
          defaultFilters,
          "",
          "featured"
        ),
        focusedCategoryId: null,
        viewLevel: state.selectedProjectId ? "project" : "ecosystem",
      })),

    setViewMode: (viewMode) => set({ viewMode }),

    setReducedMotion: (reducedMotion) =>
      set({
        reducedMotion,
        viewMode: reducedMotion ? "list" : "galaxy",
      }),

    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

    setCanvasTransform: (canvasTransform) => set({ canvasTransform }),

    hoverProject: (hoveredProjectId) => set({ hoveredProjectId }),

    hoverCategory: (hoveredCategoryId) => set({ hoveredCategoryId }),

    selectProject: (projectId) => {
      const project = get().getProjectById(projectId);
      set({
        selectedProjectId: projectId,
        viewLevel: "project",
        focusedCategoryId: project?.categoryId ?? null,
      });
    },

    focusCategory: (categoryId) =>
      set({
        focusedCategoryId: categoryId,
        viewLevel: "category",
        selectedProjectId: null,
      }),

    resetView: () =>
      set({
        viewLevel: "ecosystem",
        focusedCategoryId: null,
        selectedProjectId: null,
        hoveredProjectId: null,
        hoveredCategoryId: null,
        canvasTransform: defaultTransform,
      }),

    closePanel: () =>
      set((state) => ({
        selectedProjectId: null,
        viewLevel: state.focusedCategoryId ? "category" : "ecosystem",
      })),

    getProjectById: (projectId) =>
      get().allProjects.find((project) => project.id === projectId),

    getSelectedProject: () => {
      const id = get().selectedProjectId;
      return id ? get().getProjectById(id) : undefined;
    },
  }));
}

export { ECOSYSTEM_CATEGORIES };
