"use client";

import * as React from "react";
import { useStore } from "zustand";
import {
  createEcosystemExplorerStore,
  type EcosystemExplorerState,
} from "@/stores/ecosystem-explorer-store";
import type { EcosystemProject } from "@/lib/ecosystem/types";

type EcosystemExplorerStore = ReturnType<typeof createEcosystemExplorerStore>;

const EcosystemExplorerContext =
  React.createContext<EcosystemExplorerStore | null>(null);

export function EcosystemExplorerProvider({
  projects,
  children,
}: {
  projects: EcosystemProject[];
  children: React.ReactNode;
}) {
  const storeRef = React.useRef<EcosystemExplorerStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createEcosystemExplorerStore(projects);
  }

  return (
    <EcosystemExplorerContext.Provider value={storeRef.current}>
      {children}
    </EcosystemExplorerContext.Provider>
  );
}

export function useEcosystemExplorerStore<T>(
  selector: (state: EcosystemExplorerState) => T
): T {
  const store = React.useContext(EcosystemExplorerContext);
  if (!store) {
    throw new Error(
      "useEcosystemExplorerStore must be used within EcosystemExplorerProvider"
    );
  }
  return useStore(store, selector);
}

export function useEcosystemExplorerStoreApi(): EcosystemExplorerStore {
  const store = React.useContext(EcosystemExplorerContext);
  if (!store) {
    throw new Error(
      "useEcosystemExplorerStoreApi must be used within EcosystemExplorerProvider"
    );
  }
  return store;
}

export { ECOSYSTEM_CATEGORIES } from "@/stores/ecosystem-explorer-store";
