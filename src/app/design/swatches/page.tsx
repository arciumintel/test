import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaletteSwatches } from "@/components/design/palette-swatches";

export const metadata: Metadata = {
  title: "Palette swatches",
  robots: { index: false, follow: false },
};

export default function PaletteSwatchesPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="bg-page-header bg-ambient">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-primary">Design · dev only</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Palette alternatives A–E
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Side-by-side comparison of the current Arcademy Vault tokens and five
            proposed directions. Each card shows light and dark mini-previews plus
            full token grids for both modes.
          </p>
        </header>

        <PaletteSwatches />
      </div>
    </div>
  );
}
