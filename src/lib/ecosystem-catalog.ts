import "server-only";

import { ECOSYSTEM_PROJECTS } from "@/lib/ecosystem/data";
import type { EcosystemProject } from "@/lib/ecosystem/types";
import { getExplorerProjects } from "@/lib/ecosystem-directory";

/**
 * Arcademy exposes two related but distinct public catalogs.
 *
 * **Learning catalog** (`Product` → `/products`, `/courses`)
 * - Answers: "Where can I take courses and earn badges?"
 * - Source of truth: published `Product` rows and their courses.
 * - Read API: `src/lib/products.ts`, `src/lib/courses.ts`.
 *
 * **Ecosystem directory** (`EcosystemDirectoryEntry` → `/ecosystem`)
 * - Answers: "What projects exist in the Arcium ecosystem, and how do they connect?"
 * - Source of truth: `EcosystemDirectoryEntry` in Postgres.
 * - Read API: `loadEcosystemExplorerProjects()` in this file.
 * - Explorer-only fields: network status, relationships, galaxy layout categories.
 *
 * **Bridge**
 * - Optional `EcosystemDirectoryEntry.productId` links a directory row to a learning product.
 * - On product publish, `syncEcosystemDirectoryFromProduct` upserts identity and sets
 *   `learningSurface.available` when the linked product is published.
 * - Directory rows may exist without a product (discovery before courses ship).
 *
 * **Static seed**
 * - `src/lib/ecosystem/data.ts` seeds directory rows in dev/CI (`prisma/seed-ecosystem-directory.ts`).
 * - Runtime prefers the database; static data is a last-resort fallback when the directory is empty.
 */

export type EcosystemCatalogSurface = "learning" | "ecosystem";

/** Canonical read path for `/ecosystem` and the explorer UI. */
export async function loadEcosystemExplorerProjects(): Promise<EcosystemProject[]> {
  try {
    const projects = await getExplorerProjects();
    if (projects.length > 0) {
      return projects;
    }
  } catch (error) {
    console.error(
      "[ecosystem-catalog] Failed to load directory entries:",
      error
    );
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[ecosystem-catalog] No directory entries found; using static seed fallback."
    );
  }

  return ECOSYSTEM_PROJECTS;
}

/** @deprecated Use `loadEcosystemExplorerProjects`. */
export const loadExplorerProjects = loadEcosystemExplorerProjects;

export {
  ensureEcosystemDirectoryOnProductPublish,
  getExplorerProjects,
  syncEcosystemDirectoryFromProduct,
} from "@/lib/ecosystem-directory";
