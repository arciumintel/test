import type { Metadata } from "next";
import { EcosystemExplorer } from "@/components/ecosystem/ecosystem-explorer";
import { EcosystemExplorerProvider } from "@/components/ecosystem/ecosystem-explorer-provider";
import { loadEcosystemExplorerProjects } from "@/lib/ecosystem-catalog";

export const metadata: Metadata = {
  title: "Ecosystem Explorer",
  description:
    "Explore the Arcium ecosystem interactively. Discover projects by category, status, and connections across DeFi, AI, privacy, wallets, and more.",
};

export default async function EcosystemPage() {
  const projects = await loadEcosystemExplorerProjects();

  return (
    <EcosystemExplorerProvider projects={projects}>
      <EcosystemExplorer />
    </EcosystemExplorerProvider>
  );
}
