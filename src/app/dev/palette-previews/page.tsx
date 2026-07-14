import type { Metadata } from "next";
import { PalettePreviewBoard } from "@/components/dev/palette-preview-board";

export const metadata: Metadata = {
  title: "Palette previews",
  robots: { index: false, follow: false },
};

export default function PalettePreviewsPage() {
  return <PalettePreviewBoard />;
}
