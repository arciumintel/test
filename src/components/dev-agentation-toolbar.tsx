"use client";

import { Agentation } from "agentation";

const AGENTATION_ENDPOINT =
  process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT ?? "http://localhost:4747";

export function DevAgentationToolbar() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <Agentation endpoint={AGENTATION_ENDPOINT} />;
}
