export type ProjectStatus =
  | "mainnet"
  | "testnet"
  | "coming_soon"
  | "deprecated"
  | "experimental";

export type RelationshipType =
  | "sdk"
  | "infrastructure"
  | "partnership"
  | "tooling";

export type EcosystemSort =
  | "featured"
  | "trending"
  | "recent"
  | "alphabetical";

export type ViewLevel = "ecosystem" | "category" | "project";

export type ViewMode = "galaxy" | "list";

export interface EcosystemCategory {
  id: string;
  label: string;
  blurb: string;
}

export interface ProjectLinks {
  website?: string;
  docs?: string;
  github?: string;
  twitter?: string;
}

export interface ProjectRelationship {
  targetId: string;
  type: RelationshipType;
}

export interface EcosystemLearningSurface {
  slug: string;
  available: boolean;
}

export interface EcosystemProject {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  categoryId: string;
  status: ProjectStatus;
  featured: boolean;
  trending?: boolean;
  addedAt: string;
  tags: string[];
  links: ProjectLinks;
  relationships: ProjectRelationship[];
  /** Present when entry is linked to an Arcademy product. */
  learningSurface?: EcosystemLearningSurface;
}

export interface GalaxyViewport {
  width: number;
  height: number;
}

export interface GalaxyCore {
  x: number;
  y: number;
  radius: number;
}

export interface GalaxyHub {
  categoryId: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface GalaxyNode {
  projectId: string;
  categoryId: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  ring: number;
  angle: number;
  driftPhase: number;
}

export interface GalaxyLayout {
  core: GalaxyCore;
  hubs: GalaxyHub[];
  nodes: GalaxyNode[];
  hubRingRadius: number;
}

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  sdk: "SDK integration",
  infrastructure: "Infrastructure",
  partnership: "Partnership",
  tooling: "Shared tooling",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  mainnet: "Mainnet",
  testnet: "Testnet",
  coming_soon: "Coming Soon",
  deprecated: "Deprecated",
  experimental: "Experimental",
};
