/**
 * Analytics Pack manifests.
 *
 * Developer Education is the default. Documentation, Community, and Hackathon
 * are full installable definitions (Phase 4).
 *
 * Partner conversion stubs (`conversionStubs`) are deferred to Analytics V2 —
 * packs keep an empty array so installs do not seed untracked conversion keys.
 *
 * @see docs/adr/2026-07-13-configurable-analytics-platform.md
 */

export const ANALYTICS_SECTION_IDS = [
  "overview",
  "courses",
  "concepts",
  "assessments",
  "readiness",
  "certifications",
  "recommendations",
  "funnel",
  "conversions",
  "behaviour",
  "cohorts",
  "opportunity",
  "trends",
] as const;

export type AnalyticsSectionId = (typeof ANALYTICS_SECTION_IDS)[number];

export type PackStarterConcept = {
  slug: string;
  name: string;
  category?: string;
  importance?: "critical" | "core" | "supporting";
  description?: string;
};

export type PackSkillCategory = {
  slug: string;
  name: string;
  order: number;
};

export type PackConversionStub = {
  key: string;
  label: string;
  eventName: string;
  description?: string;
};

export type PackRecommendationThresholds = {
  funnelStageConversionMinPct: number;
  criticalConceptMasteryMinPct: number;
  questionMissRateMaxPct: number;
  completionRateMinPct: number;
  minVolumeForAlerts: number;
};

/**
 * Default Learning Readiness weights (ADR locked).
 * Packs may relabel but should preserve equal weights unless Owner customizes later.
 */
export type LearningReadinessRequirementType =
  | "course_completion"
  | "quiz_performance"
  | "concept_mastery"
  | "required_path_completion"
  | "partner_conversion_events";

export type PackReadinessSeed = {
  name: string;
  description: string;
  requirements: Array<{
    type: LearningReadinessRequirementType;
    weight: number;
  }>;
  levels: Array<{ id: string; label: string; minScore: number }>;
  readyThreshold: number;
};

export type AnalyticsPackManifest = {
  id: string;
  version: string;
  displayName: string;
  description: string;
  /** When true, manifest is a named placeholder without full contents. */
  stub: boolean;
  sectionVisibility: AnalyticsSectionId[];
  kpiSet: string[];
  funnelStages: string[];
  starterConcepts: PackStarterConcept[];
  skillCategories: PackSkillCategory[];
  recommendationThresholds: PackRecommendationThresholds | null;
  enabledProviderIds: string[];
  conversionStubs: PackConversionStub[];
  readiness: PackReadinessSeed | null;
  terminology?: Record<string, string>;
};

export const DEFAULT_LEARNING_READINESS: PackReadinessSeed = {
  name: "Learning Readiness",
  description:
    "Generic equal-weight readiness model. Partners rename and reweight for their ecosystem.",
  requirements: [
    { type: "course_completion", weight: 0.25 },
    { type: "quiz_performance", weight: 0.25 },
    { type: "concept_mastery", weight: 0.25 },
    { type: "required_path_completion", weight: 0.25 },
  ],
  levels: [
    { id: "exploring", label: "Exploring", minScore: 0 },
    { id: "building", label: "Building", minScore: 40 },
    { id: "ready", label: "Ready", minScore: 70 },
  ],
  readyThreshold: 70,
};

export const DEFAULT_RECOMMENDATION_THRESHOLDS: PackRecommendationThresholds = {
  funnelStageConversionMinPct: 50,
  criticalConceptMasteryMinPct: 60,
  questionMissRateMaxPct: 40,
  completionRateMinPct: 20,
  minVolumeForAlerts: 10,
};

/**
 * Default pack for new Products (ADR): Developer Education + Learning Readiness.
 */
export const DEVELOPER_EDUCATION_PACK: AnalyticsPackManifest = {
  id: "developer_education",
  version: "1.0.0",
  displayName: "Developer Education Pack",
  description:
    "Concept mastery, readiness, certifications, learning funnel, and developer journey analytics.",
  stub: false,
  sectionVisibility: [
    "overview",
    "opportunity",
    "funnel",
    "courses",
    "concepts",
    "assessments",
    "readiness",
    "certifications",
    "cohorts",
    "behaviour",
    "recommendations",
    "trends",
  ],
  kpiSet: [
    "active_learners",
    "completion_rate",
    "quiz_pass_rate",
    "concept_coverage",
    "readiness_score_avg",
    "certifications_awarded",
    "badges_awarded",
  ],
  funnelStages: [
    "course_detail_viewed",
    "start_course_clicked",
    "wallet_connect_started",
    "wallet_connected",
    "course_started",
    "lesson_completed",
    "quiz_passed",
    "course_completed",
    "badge_awarded",
  ],
  starterConcepts: [
    {
      slug: "ecosystem-basics",
      name: "Ecosystem basics",
      category: "fundamentals",
      importance: "critical",
      description: "Core product and ecosystem vocabulary for new learners.",
    },
    {
      slug: "security-and-privacy",
      name: "Security and privacy",
      category: "fundamentals",
      importance: "critical",
    },
    {
      slug: "developer-workflow",
      name: "Developer workflow",
      category: "building",
      importance: "core",
    },
    {
      slug: "integration-patterns",
      name: "Integration patterns",
      category: "building",
      importance: "core",
    },
    {
      slug: "production-readiness",
      name: "Production readiness",
      category: "shipping",
      importance: "supporting",
    },
  ],
  skillCategories: [
    { slug: "fundamentals", name: "Fundamentals", order: 0 },
    { slug: "building", name: "Building", order: 1 },
    { slug: "shipping", name: "Shipping", order: 2 },
  ],
  recommendationThresholds: DEFAULT_RECOMMENDATION_THRESHOLDS,
  enabledProviderIds: ["core"],
  // Partner conversion stubs deferred to Analytics V2.
  conversionStubs: [],
  readiness: DEFAULT_LEARNING_READINESS,
  terminology: {
    learnerLabel: "Learner",
    readinessLabel: "Learning Readiness",
    certificationLabel: "Certification",
    badgeLabel: "Badge",
  },
};

/** Documentation Pack — installable definition. */
export const DOCUMENTATION_PACK: AnalyticsPackManifest = {
  id: "documentation",
  version: "1.0.0",
  displayName: "Documentation Pack",
  description:
    "Documentation completion, search analytics, glossary usage, and knowledge gap detection.",
  stub: false,
  sectionVisibility: [
    "overview",
    "concepts",
    "assessments",
    "behaviour",
    "recommendations",
    "trends",
  ],
  kpiSet: [
    "active_learners",
    "concept_coverage",
    "concept_mastery",
    "glossary_lookups",
    "search_performed_count",
  ],
  funnelStages: [
    "course_detail_viewed",
    "lesson_viewed",
    "glossary_lookup",
    "search_performed",
  ],
  starterConcepts: [
    {
      slug: "getting-started-docs",
      name: "Getting started docs",
      category: "docs",
      importance: "critical",
    },
    {
      slug: "api-reference",
      name: "API reference",
      category: "docs",
      importance: "core",
    },
    {
      slug: "troubleshooting",
      name: "Troubleshooting",
      category: "docs",
      importance: "supporting",
    },
  ],
  skillCategories: [{ slug: "docs", name: "Documentation", order: 0 }],
  recommendationThresholds: {
    ...DEFAULT_RECOMMENDATION_THRESHOLDS,
    criticalConceptMasteryMinPct: 65,
    questionMissRateMaxPct: 35,
  },
  enabledProviderIds: ["core"],
  // Partner conversion stubs deferred to Analytics V2.
  conversionStubs: [],
  readiness: {
    ...DEFAULT_LEARNING_READINESS,
    name: "Documentation Readiness",
    description:
      "Equal-weight readiness oriented to docs comprehension. Rename and reweight as needed.",
  },
  terminology: {
    learnerLabel: "Reader",
    readinessLabel: "Documentation Readiness",
    certificationLabel: "Docs certification",
    badgeLabel: "Progress badge",
  },
};

/** Community Pack — installable definition. */
export const COMMUNITY_PACK: AnalyticsPackManifest = {
  id: "community",
  version: "1.0.0",
  displayName: "Community Pack",
  description:
    "Community engagement, badge sharing, event participation, and ambassador-oriented learning.",
  stub: false,
  sectionVisibility: [
    "overview",
    "courses",
    "certifications",
    "cohorts",
    "behaviour",
    "recommendations",
  ],
  kpiSet: [
    "active_learners",
    "completion_rate",
    "badges_awarded",
    "certifications_awarded",
    "cohort_completion_rate",
  ],
  funnelStages: [
    "course_detail_viewed",
    "course_started",
    "lesson_completed",
    "badge_awarded",
    "badge_shared",
  ],
  starterConcepts: [
    {
      slug: "community-norms",
      name: "Community norms",
      category: "community",
      importance: "critical",
    },
    {
      slug: "ambassador-basics",
      name: "Ambassador basics",
      category: "community",
      importance: "core",
    },
    {
      slug: "event-participation",
      name: "Event participation",
      category: "community",
      importance: "supporting",
    },
  ],
  skillCategories: [{ slug: "community", name: "Community", order: 0 }],
  recommendationThresholds: {
    ...DEFAULT_RECOMMENDATION_THRESHOLDS,
    completionRateMinPct: 25,
    funnelStageConversionMinPct: 45,
  },
  enabledProviderIds: ["core"],
  // Partner conversion stubs deferred to Analytics V2.
  conversionStubs: [],
  readiness: {
    ...DEFAULT_LEARNING_READINESS,
    name: "Community Readiness",
    description:
      "Equal-weight readiness for community contributors. Rename and reweight as needed.",
  },
  terminology: {
    learnerLabel: "Member",
    readinessLabel: "Community Readiness",
    certificationLabel: "Community certification",
    badgeLabel: "Achievement badge",
  },
};

/** Hackathon Pack — installable definition. */
export const HACKATHON_PACK: AnalyticsPackManifest = {
  id: "hackathon",
  version: "1.0.0",
  displayName: "Hackathon Pack",
  description:
    "Team formation signals, SDK adoption, project submission funnel, and demo completion.",
  stub: false,
  sectionVisibility: [
    "overview",
    "funnel",
    "courses",
    "concepts",
    "readiness",
    "certifications",
    "recommendations",
  ],
  kpiSet: [
    "active_learners",
    "start_conversion_rate",
    "completion_rate",
    "quiz_pass_rate",
    "readiness_score_avg",
    "certifications_awarded",
  ],
  funnelStages: [
    "course_detail_viewed",
    "start_course_clicked",
    "course_started",
    "lesson_completed",
    "quiz_passed",
  ],
  starterConcepts: [
    {
      slug: "sdk-basics",
      name: "SDK basics",
      category: "build",
      importance: "critical",
    },
    {
      slug: "team-formation",
      name: "Team formation",
      category: "build",
      importance: "core",
    },
    {
      slug: "demo-day",
      name: "Demo day",
      category: "ship",
      importance: "core",
    },
  ],
  skillCategories: [
    { slug: "build", name: "Build", order: 0 },
    { slug: "ship", name: "Ship", order: 1 },
  ],
  recommendationThresholds: {
    ...DEFAULT_RECOMMENDATION_THRESHOLDS,
    funnelStageConversionMinPct: 40,
    completionRateMinPct: 15,
    minVolumeForAlerts: 5,
  },
  enabledProviderIds: ["core"],
  // Partner conversion stubs deferred to Analytics V2.
  conversionStubs: [],
  readiness: {
    ...DEFAULT_LEARNING_READINESS,
    name: "Builder Readiness",
    description:
      "Equal-weight readiness for hackathon builders. Rename and reweight as needed.",
  },
  terminology: {
    learnerLabel: "Builder",
    readinessLabel: "Builder Readiness",
    certificationLabel: "Builder certification",
    badgeLabel: "Progress badge",
  },
};

/** @deprecated Use DOCUMENTATION_PACK */
export const DOCUMENTATION_PACK_STUB = DOCUMENTATION_PACK;
/** @deprecated Use COMMUNITY_PACK */
export const COMMUNITY_PACK_STUB = COMMUNITY_PACK;
/** @deprecated Use HACKATHON_PACK */
export const HACKATHON_PACK_STUB = HACKATHON_PACK;

export const ANALYTICS_PACKS: readonly AnalyticsPackManifest[] = [
  DEVELOPER_EDUCATION_PACK,
  DOCUMENTATION_PACK,
  COMMUNITY_PACK,
  HACKATHON_PACK,
] as const;

/** Default pack id installed on new Products (ADR). */
export const DEFAULT_ANALYTICS_PACK_ID = DEVELOPER_EDUCATION_PACK.id;

export function getAnalyticsPack(
  id: string
): AnalyticsPackManifest | undefined {
  return ANALYTICS_PACKS.find((pack) => pack.id === id);
}

export function listInstallableAnalyticsPacks(): AnalyticsPackManifest[] {
  return ANALYTICS_PACKS.filter((pack) => !pack.stub);
}

export function listAnalyticsPackStubs(): AnalyticsPackManifest[] {
  return ANALYTICS_PACKS.filter((pack) => pack.stub);
}
