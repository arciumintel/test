"use client";

import { RootProvider } from "fumadocs-ui/provider/next";

type AppRootProviderProps = {
  children: React.ReactNode;
};

export function AppRootProvider({ children }: AppRootProviderProps) {
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const);

  return (
    <RootProvider
      theme={{
        storageKey: "arcademy-theme",
        scriptProps,
      }}
      search={{
        options: {
          api: "/partners/docs/api/search",
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
