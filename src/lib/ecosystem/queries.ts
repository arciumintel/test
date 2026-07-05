import { ECOSYSTEM_PROJECTS } from "@/lib/ecosystem/data";
import type { EcosystemProject } from "@/lib/ecosystem/types";
import { getExplorerProjects } from "@/lib/ecosystem-directory";

export async function loadExplorerProjects(): Promise<EcosystemProject[]> {
  try {
    const projects = await getExplorerProjects();
    if (projects.length > 0) {
      return projects;
    }
  } catch (error) {
    console.error("[ecosystem] Failed to load directory entries:", error);
  }

  return ECOSYSTEM_PROJECTS;
}
