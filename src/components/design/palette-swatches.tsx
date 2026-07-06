"use client";

import type { PaletteAlternative, PaletteModeTokens } from "@/lib/palette-alternatives";
import { PALETTE_ALTERNATIVES } from "@/lib/palette-alternatives";
import { cn } from "@/lib/utils";

function SwatchChip({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor?: string;
}) {
  return (
    <div className="min-w-0">
      <div
        className="h-10 rounded-md border border-black/10"
        style={{ backgroundColor: color }}
        title={color}
      />
      <p className="mt-1 truncate text-[10px] font-medium text-foreground/80">
        {label}
      </p>
      <p className="truncate font-mono text-[10px] text-muted-foreground">
        {color}
      </p>
      {textColor ? (
        <p
          className="truncate text-[10px] font-medium"
          style={{ color: textColor }}
        >
          Aa sample
        </p>
      ) : null}
    </div>
  );
}

function ModePreview({
  mode,
  tokens,
}: {
  mode: "light" | "dark";
  tokens: PaletteModeTokens;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-black/10"
      style={{
        backgroundColor: tokens.background,
        color: tokens.foreground,
      }}
    >
      <div className="border-b border-black/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">
        {mode}
      </div>

      <div className="space-y-3 p-3">
        <div
          className="rounded-lg border p-3 shadow-sm"
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
        >
          <p className="text-sm font-semibold leading-snug">Sealed Classroom</p>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: tokens.mutedForeground }}
          >
            Learn Arcium with calm, trustworthy surfaces.
          </p>
          <p className="mt-2 text-xs">
            <span style={{ color: tokens.primary }}>Continue course →</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium"
              style={{
                backgroundColor: tokens.primary,
                color: tokens.primaryForeground,
              }}
            >
              Start lesson
            </span>
            <span
              className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium"
              style={{
                backgroundColor: tokens.secondary,
                borderColor: tokens.border,
                color: tokens.foreground,
              }}
            >
              Outline
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${tokens.seal} 16%, transparent)`,
              borderColor: `color-mix(in srgb, ${tokens.seal} 45%, transparent)`,
              color: tokens.earned,
            }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tokens.seal }}
            />
            Badge earned
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: tokens.success }}
          >
            Passed
          </span>
        </div>
      </div>
    </div>
  );
}

const TOKEN_ENTRIES: { key: keyof PaletteModeTokens; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "card", label: "Card" },
  { key: "foreground", label: "Foreground" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "seal", label: "Seal" },
  { key: "earned", label: "Earned" },
  { key: "success", label: "Success" },
];

function TokenGrid({
  mode,
  tokens,
}: {
  mode: "light" | "dark";
  tokens: PaletteModeTokens;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground capitalize">
        {mode} tokens
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {TOKEN_ENTRIES.map(({ key, label }) => (
          <SwatchChip
            key={key}
            label={label}
            color={tokens[key]}
            textColor={
              key === "foreground" || key === "earned"
                ? tokens[key]
                : key === "primary"
                  ? tokens.primary
                  : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function PaletteCard({ palette }: { palette: PaletteAlternative }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm",
        palette.id === "current" && "ring-2 ring-primary/30"
      )}
    >
      <header>
        <h2 className="text-base font-semibold">{palette.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{palette.tagline}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModePreview mode="light" tokens={palette.light} />
        <ModePreview mode="dark" tokens={palette.dark} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TokenGrid mode="light" tokens={palette.light} />
        <TokenGrid mode="dark" tokens={palette.dark} />
      </div>
    </article>
  );
}

export function PaletteSwatches() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {PALETTE_ALTERNATIVES.map((palette) => (
          <PaletteCard key={palette.id} palette={palette} />
        ))}
      </div>
    </div>
  );
}
