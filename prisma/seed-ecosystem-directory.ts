import type { DirectoryNetworkStatus } from "@prisma/client";
import { ECOSYSTEM_PROJECTS } from "@/lib/ecosystem/data";
import type { ProjectStatus } from "@/lib/ecosystem/types";
import {
  upsertSeedDirectoryEntry,
  type SeedDirectoryEntryInput,
} from "@/lib/ecosystem-directory";

function toNetworkStatus(status: ProjectStatus): DirectoryNetworkStatus {
  return status;
}

export async function seedEcosystemDirectory(): Promise<void> {
  for (const project of ECOSYSTEM_PROJECTS) {
    const input: SeedDirectoryEntryInput = {
      slug: project.slug,
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      logoUrl: project.logoUrl,
      categoryId: project.categoryId,
      networkStatus: toNetworkStatus(project.status),
      featured: project.featured,
      trending: project.trending ?? false,
      tags: project.tags,
      links: project.links,
      relationships: project.relationships,
      addedAt: project.addedAt,
    };

    await upsertSeedDirectoryEntry(input);
  }

  console.log(`✓ Ecosystem directory: ${ECOSYSTEM_PROJECTS.length} entries`);
}
