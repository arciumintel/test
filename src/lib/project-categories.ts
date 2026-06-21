/** Staff-curated categories shown in partner/admin pickers and catalog filters. */
export const PROJECT_CATEGORIES = [
  "DeFi & Trading",
  "Artificial Intelligence",
  "Payments & Wallets",
  "Consumer Apps",
  "Prediction Markets",
] as const;

export type PredefinedProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_CATEGORY_CUSTOM = "__custom__" as const;

const PREDEFINED_SET = new Set<string>(PROJECT_CATEGORIES);

export function isPredefinedCategory(
  category: string
): category is PredefinedProjectCategory {
  return PREDEFINED_SET.has(category);
}

export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

/** Normalize user input: trim, match predefined labels case-insensitively, preserve custom labels. */
export function normalizeCategory(
  input: string | null | undefined
): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  if (trimmed.length > 80) return trimmed.slice(0, 80);

  const predefined = PROJECT_CATEGORIES.find(
    (label) => label.toLowerCase() === trimmed.toLowerCase()
  );
  return predefined ?? trimmed;
}

export function resolveCategoryLabelFromSlug(
  slug: string,
  customLabels: string[] = []
): string | null {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const predefined = PROJECT_CATEGORIES.find(
    (label) => categoryToSlug(label) === normalizedSlug
  );
  if (predefined) return predefined;

  return (
    customLabels.find((label) => categoryToSlug(label) === normalizedSlug) ??
    null
  );
}

export function sortCategoryLabels(labels: Iterable<string>): string[] {
  const unique = [...new Set(labels)];
  const predefined = PROJECT_CATEGORIES.filter((label) => unique.includes(label));
  const custom = unique
    .filter((label) => !isPredefinedCategory(label))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return [...predefined, ...custom];
}

export function groupProductsByCategory<T extends { category: string | null }>(
  products: T[]
): { label: string; products: T[] }[] {
  const buckets = new Map<string, T[]>();

  for (const product of products) {
    const label = product.category?.trim() || "Other";
    const list = buckets.get(label) ?? [];
    list.push(product);
    buckets.set(label, list);
  }

  const labels = sortCategoryLabels(
    [...buckets.keys()].filter((label) => label !== "Other")
  );
  if (buckets.has("Other")) {
    labels.push("Other");
  }

  return labels.map((label) => ({
    label,
    products: buckets.get(label) ?? [],
  }));
}

export const projectCategorySchema = {
  maxLength: 80,
  normalize: normalizeCategory,
};
