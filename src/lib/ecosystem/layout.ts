import type {
  EcosystemCategory,
  EcosystemProject,
  GalaxyHub,
  GalaxyLayout,
  GalaxyNode,
  GalaxyViewport,
} from "./types";

const CORE_RADIUS = 42;
const HUB_RADIUS = 28;
const NODE_RADIUS = 10;
const NODE_RADIUS_FEATURED = 14;
const MIN_HUB_RING = 140;
const MAX_HUB_RING = 0.38;
const ORBIT_GAP = 36;
const FIRST_ORBIT = 52;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function projectsPerRing(viewport: GalaxyViewport, ring: number): number {
  const circumference = 2 * Math.PI * (FIRST_ORBIT + ring * ORBIT_GAP);
  const spacing = NODE_RADIUS * 5;
  return Math.max(4, Math.floor(circumference / spacing));
}

function computeHubRingRadius(viewport: GalaxyViewport, hubCount: number): number {
  const minDim = Math.min(viewport.width, viewport.height);
  const byViewport = minDim * MAX_HUB_RING;
  const byCount = MIN_HUB_RING + hubCount * 8;
  return Math.min(byViewport, Math.max(MIN_HUB_RING, byCount));
}

export function computeGalaxyLayout(
  projects: EcosystemProject[],
  categories: EcosystemCategory[],
  viewport: GalaxyViewport
): GalaxyLayout {
  const core = {
    x: viewport.width / 2,
    y: viewport.height / 2,
    radius: CORE_RADIUS,
  };

  const activeCategoryIds = new Set(projects.map((project) => project.categoryId));
  const activeCategories = categories.filter((category) =>
    activeCategoryIds.has(category.id)
  );

  const hubRingRadius = computeHubRingRadius(viewport, activeCategories.length);
  const hubs: GalaxyHub[] = activeCategories.map((category, index) => {
    const angle =
      (index / Math.max(activeCategories.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      categoryId: category.id,
      label: category.label,
      x: core.x + Math.cos(angle) * hubRingRadius,
      y: core.y + Math.sin(angle) * hubRingRadius,
      radius: HUB_RADIUS,
      angle,
    };
  });

  const hubByCategory = new Map(hubs.map((hub) => [hub.categoryId, hub]));
  const nodes: GalaxyNode[] = [];

  const grouped = new Map<string, EcosystemProject[]>();
  for (const project of projects) {
    const list = grouped.get(project.categoryId) ?? [];
    list.push(project);
    grouped.set(project.categoryId, list);
  }

  for (const [categoryId, categoryProjects] of grouped) {
    const hub = hubByCategory.get(categoryId);
    if (!hub) continue;

    const sorted = [...categoryProjects].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    let slot = 0;
    for (const project of sorted) {
      let ring = 0;
      let ringCapacity = projectsPerRing(viewport, ring);
      while (slot >= ringCapacity) {
        slot -= ringCapacity;
        ring += 1;
        ringCapacity = projectsPerRing(viewport, ring);
      }

      const orbitRadius = FIRST_ORBIT + ring * ORBIT_GAP;
      const angleOffset = (hashString(project.id) % 360) * (Math.PI / 180) * 0.15;
      const angle =
        (slot / ringCapacity) * Math.PI * 2 + angleOffset + hub.angle * 0.02;
      const x = hub.x + Math.cos(angle) * orbitRadius;
      const y = hub.y + Math.sin(angle) * orbitRadius;

      nodes.push({
        projectId: project.id,
        categoryId,
        x,
        y,
        baseX: x,
        baseY: y,
        radius: project.featured ? NODE_RADIUS_FEATURED : NODE_RADIUS,
        ring,
        angle,
        driftPhase: (hashString(project.id) % 1000) / 1000,
      });

      slot += 1;
    }
  }

  return {
    core,
    hubs,
    nodes,
    hubRingRadius,
  };
}

export function getHubForCategory(
  layout: GalaxyLayout,
  categoryId: string
): GalaxyHub | undefined {
  return layout.hubs.find((hub) => hub.categoryId === categoryId);
}

export function getNodesForCategory(
  layout: GalaxyLayout,
  categoryId: string
): GalaxyNode[] {
  return layout.nodes.filter((node) => node.categoryId === categoryId);
}

export function getNodeForProject(
  layout: GalaxyLayout,
  projectId: string
): GalaxyNode | undefined {
  return layout.nodes.find((node) => node.projectId === projectId);
}

export function computeCategoryFocusTransform(
  layout: GalaxyLayout,
  categoryId: string,
  viewport: GalaxyViewport,
  padding = 80
): { scale: number; offsetX: number; offsetY: number } {
  const hub = getHubForCategory(layout, categoryId);
  const nodes = getNodesForCategory(layout, categoryId);
  if (!hub || nodes.length === 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const xs = [hub.x, ...nodes.map((node) => node.x)];
  const ys = [hub.y, ...nodes.map((node) => node.y)];
  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const scale = Math.min(
    viewport.width / boxWidth,
    viewport.height / boxHeight,
    2.2
  );

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const offsetX = viewport.width / 2 - centerX * scale;
  const offsetY = viewport.height / 2 - centerY * scale;

  return { scale, offsetX, offsetY };
}

export function computeSearchFocusTransform(
  layout: GalaxyLayout,
  projectId: string,
  viewport: GalaxyViewport
): { scale: number; offsetX: number; offsetY: number } {
  const node = getNodeForProject(layout, projectId);
  if (!node) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const scale = 1.8;
  const offsetX = viewport.width / 2 - node.x * scale;
  const offsetY = viewport.height / 2 - node.y * scale;
  return { scale, offsetX, offsetY };
}

export { CORE_RADIUS, HUB_RADIUS, NODE_RADIUS, NODE_RADIUS_FEATURED };
