import Fuse from "fuse.js";
import {
  ECOSYSTEM_CATEGORIES,
  ECOSYSTEM_PROJECTS,
  getCategoryById,
  getProjectById,
} from "./data";
import type {
  EcosystemCategory,
  EcosystemProject,
  EcosystemSort,
  ProjectRelationship,
  ProjectStatus,
  RelationshipType,
} from "./types";

export type EcosystemFilters = {
  categoryIds: string[];
  statuses: ProjectStatus[];
};

export {
  ECOSYSTEM_CATEGORIES,
  ECOSYSTEM_PROJECTS,
  getCategoryById,
  getProjectById,
} from "./data";
export * from "./layout";
export * from "./types";

const fuseOptions = {
  keys: [
    { name: "name", weight: 0.35 },
    { name: "tagline", weight: 0.25 },
    { name: "description", weight: 0.15 },
    { name: "tags", weight: 0.15 },
    { name: "categoryId", weight: 0.1 },
  ],
  threshold: 0.38,
  includeScore: true,
};

export function searchProjects(
  projects: EcosystemProject[],
  query: string
): EcosystemProject[] {
  const trimmed = query.trim();
  if (!trimmed) return projects;

  const fuseIndex = new Fuse(projects, fuseOptions);
  const allowedIds = new Set(projects.map((project) => project.id));
  const results = fuseIndex.search(trimmed);
  const matched: EcosystemProject[] = [];

  for (const result of results) {
    if (allowedIds.has(result.item.id)) {
      matched.push(result.item);
    }
  }

  return matched;
}

export function filterProjects(
  projects: EcosystemProject[],
  filters: EcosystemFilters
): EcosystemProject[] {
  return projects.filter((project) => {
    if (
      filters.categoryIds.length > 0 &&
      !filters.categoryIds.includes(project.categoryId)
    ) {
      return false;
    }
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(project.status)
    ) {
      return false;
    }
    return true;
  });
}

export function sortProjects(
  projects: EcosystemProject[],
  sort: EcosystemSort
): EcosystemProject[] {
  const copy = [...projects];

  switch (sort) {
    case "featured":
      return copy.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.trending !== b.trending) return a.trending ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    case "trending":
      return copy.sort((a, b) => {
        if (a.trending !== b.trending) return a.trending ? -1 : 1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    case "alphabetical":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function groupByCategory(
  projects: EcosystemProject[],
  categories: EcosystemCategory[] = ECOSYSTEM_CATEGORIES
): { category: EcosystemCategory; projects: EcosystemProject[] }[] {
  const buckets = new Map<string, EcosystemProject[]>();

  for (const project of projects) {
    const list = buckets.get(project.categoryId) ?? [];
    list.push(project);
    buckets.set(project.categoryId, list);
  }

  return categories
    .filter((category) => buckets.has(category.id))
    .map((category) => ({
      category,
      projects: buckets.get(category.id) ?? [],
    }));
}

export function getRelationshipsFor(
  project: EcosystemProject,
  allProjects: EcosystemProject[]
): Array<ProjectRelationship & { target: EcosystemProject }> {
  const byId = new Map(allProjects.map((item) => [item.id, item]));

  return project.relationships
    .map((relationship) => {
      const target = byId.get(relationship.targetId);
      if (!target) return null;
      return { ...relationship, target };
    })
    .filter(
      (
        item
      ): item is ProjectRelationship & { target: EcosystemProject } =>
        item !== null
    );
}

export function getBidirectionalRelationships(
  projectId: string,
  allProjects: EcosystemProject[]
): Array<{
  source: EcosystemProject;
  target: EcosystemProject;
  type: RelationshipType;
}> {
  const byId = new Map(allProjects.map((project) => [project.id, project]));
  const edges: Array<{
    source: EcosystemProject;
    target: EcosystemProject;
    type: RelationshipType;
  }> = [];

  for (const source of allProjects) {
    for (const relationship of source.relationships) {
      if (
        source.id === projectId ||
        relationship.targetId === projectId
      ) {
        const target = byId.get(relationship.targetId);
        if (!target) continue;
        if (source.id === projectId || target.id === projectId) {
          edges.push({
            source,
            target,
            type: relationship.type,
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = [edge.source.id, edge.target.id].sort().join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function applyExplorerQuery(
  projects: EcosystemProject[],
  filters: EcosystemFilters,
  query: string,
  sort: EcosystemSort
): EcosystemProject[] {
  const filtered = filterProjects(projects, filters);
  const searched = searchProjects(filtered, query);
  return sortProjects(searched, sort);
}

export function countByCategory(
  projects: EcosystemProject[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const project of projects) {
    counts[project.categoryId] = (counts[project.categoryId] ?? 0) + 1;
  }
  return counts;
}

export function countByStatus(
  projects: EcosystemProject[]
): Record<ProjectStatus, number> {
  return projects.reduce(
    (acc, project) => {
      acc[project.status] += 1;
      return acc;
    },
    {
      mainnet: 0,
      testnet: 0,
      coming_soon: 0,
      deprecated: 0,
      experimental: 0,
    }
  );
}

export function getCategoryLabel(categoryId: string): string {
  return getCategoryById(categoryId)?.label ?? categoryId;
}
