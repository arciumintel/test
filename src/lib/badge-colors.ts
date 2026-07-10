import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { CourseType } from "@prisma/client";

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const ECOSYSTEM_CATEGORY_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  infrastructure: "slate",
  privacy: "cyan",
  ai: "purple",
  gaming: "amber",
  education: "emerald",
  wallets: "blue",
  analytics: "indigo",
  defi: "green",
  tooling: "steel",
};

const PRODUCT_CATEGORY_BADGE_VARIANTS: Array<[RegExp, BadgeVariant]> = [
  [/(wallet|payment)/i, "blue"],
  [/(artificial intelligence|ai)/i, "purple"],
  [/(defi|trading|prediction market)/i, "green"],
  [/(consumer app|education|learning)/i, "emerald"],
];

const GLOSSARY_CATEGORY_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  arcademy: "emerald",
  privacy: "cyan",
  operations: "slate",
  execution: "steel",
  network: "indigo",
};

const COURSE_TYPE_BADGE_VARIANTS: Record<CourseType, BadgeVariant> = {
  foundational: "emerald",
  product_onboarding: "blue",
  builder_intro: "steel",
};

export function getEcosystemCategoryBadgeVariant(categoryId: string): BadgeVariant {
  return ECOSYSTEM_CATEGORY_BADGE_VARIANTS[categoryId] ?? "secondary";
}

export function getProductCategoryBadgeVariant(categoryLabel: string | null | undefined): BadgeVariant {
  const label = categoryLabel?.trim();
  if (!label) return "secondary";

  for (const [pattern, variant] of PRODUCT_CATEGORY_BADGE_VARIANTS) {
    if (pattern.test(label)) return variant;
  }

  return "secondary";
}

export function getGlossaryCategoryBadgeVariant(categoryId: string): BadgeVariant {
  return GLOSSARY_CATEGORY_BADGE_VARIANTS[categoryId] ?? "secondary";
}

export function getCourseTypeBadgeVariant(courseType: CourseType): BadgeVariant {
  return COURSE_TYPE_BADGE_VARIANTS[courseType] ?? "secondary";
}
