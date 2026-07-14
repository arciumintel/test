"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Award, BookOpen, Check } from "lucide-react";
import {
  ALL_PALETTE_PREVIEWS,
  type PaletteMode,
  type PaletteOption,
  type PaletteTokens,
} from "@/lib/palette-preview-options";
import { cn } from "@/lib/utils";

type ModeFilter = "both" | "light" | "dark";

const SWATCH_KEYS: { key: keyof PaletteTokens; label: string }[] = [
  { key: "background", label: "Bg" },
  { key: "foreground", label: "Ink" },
  { key: "card", label: "Card" },
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
  { key: "brand-secondary", label: "2nd" },
  { key: "muted", label: "Muted" },
  { key: "border", label: "Border" },
  { key: "success", label: "Success" },
];

function tokensToScopeStyle(tokens: PaletteTokens): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    style[`--${key}`] = value;
    style[`--color-${key}`] = value;
  }
  // brand-secondary is not a stock shadcn token; expose for previews
  style["--brand-secondary"] = tokens["brand-secondary"];
  style["--color-brand-secondary"] = tokens["brand-secondary"];
  return style as CSSProperties;
}

function ModePreview({
  optionId,
  mode,
}: {
  optionId: string;
  mode: PaletteMode;
}) {
  const style = tokensToScopeStyle(mode.tokens);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-neutral-300/80 shadow-sm dark:border-neutral-700"
      style={style}
      data-palette={`${optionId}-${mode.label.toLowerCase()}`}
    >
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {mode.label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: "color-mix(in oklch, var(--brand-secondary) 18%, transparent)",
            color: "var(--brand-secondary)",
          }}
        >
          brand 2nd
        </span>
      </div>

      <div className="space-y-4 bg-background p-4 text-foreground">
        {/* Swatches */}
        <div className="flex flex-wrap gap-1.5">
          {SWATCH_KEYS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span
                className="size-7 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: mode.tokens[key] }}
                title={`${key}: ${mode.tokens[key]}`}
              />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Mini product UI */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                Welcome to Arcium
              </p>
              <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-card-foreground">
                Private computation basics
              </h3>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BookOpen className="size-4" />
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Three lessons, one quiz. Earn a badge when you finish.
          </p>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Progress</span>
              <span>2 / 3 lessons</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "66%" }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
            >
              Continue
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground"
            >
              Outline
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground"
            >
              Accent
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-[10px] font-medium text-success">
              <Check className="size-3" />
              Quiz passed
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
              style={{
                backgroundColor:
                  "color-mix(in oklch, var(--brand-secondary) 16%, transparent)",
                color: "var(--brand-secondary)",
              }}
            >
              <Award className="size-3" />
              Badge earned
            </span>
          </div>
        </div>

        {/* Accent band */}
        <div className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
          Accent surface — should feel distinct from primary wash.
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  modeFilter,
}: {
  option: PaletteOption;
  modeFilter: ModeFilter;
}) {
  const showLight = modeFilter === "both" || modeFilter === "light";
  const showDark = modeFilter === "both" || modeFilter === "dark";

  return (
    <section
      id={`palette-${option.id}`}
      className="scroll-mt-24 rounded-3xl border border-border bg-card/40 p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight">{option.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{option.pitch}</p>
          <p className="mt-1 text-xs text-muted-foreground/90">{option.why}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium",
            option.id === "current"
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {option.id === "current" ? "Baseline" : `Option ${option.id.toUpperCase()}`}
        </span>
      </div>

      <div
        className={cn(
          "grid gap-4",
          showLight && showDark ? "md:grid-cols-2" : "max-w-xl"
        )}
      >
        {showLight ? (
          <ModePreview optionId={option.id} mode={option.light} />
        ) : null}
        {showDark ? (
          <ModePreview optionId={option.id} mode={option.dark} />
        ) : null}
      </div>
    </section>
  );
}

export function PalettePreviewBoard() {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("both");
  const [focusId, setFocusId] = useState<string>("all");

  const options = useMemo(() => {
    if (focusId === "all") return ALL_PALETTE_PREVIEWS;
    return ALL_PALETTE_PREVIEWS.filter((o) => o.id === focusId);
  }, [focusId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-primary">Dev · Design</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Palette previews
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Side-by-side light/dark mocks for the current system and options A–D.
          Each panel scopes its own tokens — site chrome around this page still
          uses the live theme.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["current", "Current"],
              ["a", "A"],
              ["b", "B"],
              ["c", "C"],
              ["d", "D"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFocusId(id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                focusId === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["both", "Light + Dark"],
              ["light", "Light only"],
              ["dark", "Dark only"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setModeFilter(id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                modeFilter === id
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            modeFilter={modeFilter}
          />
        ))}
      </div>
    </div>
  );
}
