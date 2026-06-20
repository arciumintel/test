"use client";

import { Button } from "@/components/ui/button";

type HomeCatalogErrorProps = {
  title?: string;
  description?: string;
};

export function HomeCatalogError({
  title = "Catalog did not load",
  description = "We could not load courses or projects. Refresh the page to try again.",
}: HomeCatalogErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Refresh page
      </Button>
    </div>
  );
}
