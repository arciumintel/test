/**
 * Experimental Arcademy palette options for side-by-side preview.
 * Live theme is Option C (Midnight Ink + Signal Cyan) in globals.css.
 */

export type PaletteTokens = {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  border: string;
  ring: string;
  "brand-secondary": string;
  destructive: string;
  success: string;
};

export type PaletteMode = {
  label: "Light" | "Dark";
  tokens: PaletteTokens;
};

export type PaletteOption = {
  id: string;
  name: string;
  pitch: string;
  why: string;
  light: PaletteMode;
  dark: PaletteMode;
};

const SEMANTIC_LIGHT = {
  destructive: "oklch(0.58 0.22 27)",
  success: "oklch(0.55 0.15 155)",
} as const;

const SEMANTIC_DARK = {
  destructive: "oklch(0.70 0.16 25)",
  success: "oklch(0.72 0.14 155)",
} as const;

/** Live production palette (Option C). */
export const CURRENT_PALETTE: PaletteOption = {
  id: "current",
  name: "Current (Option C)",
  pitch: "Midnight ink + signal cyan; orchid for XP — live theme.",
  why: "Near-neutral canvas, cyan CTAs, orchid progress — dual hue breaks monoculture.",
  light: {
    label: "Light",
    tokens: {
      background: "oklch(0.985 0.004 100)",
      foreground: "oklch(0.20 0.02 260)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.20 0.02 260)",
      primary: "oklch(0.48 0.12 230)",
      "primary-foreground": "oklch(0.99 0.01 230)",
      secondary: "oklch(0.94 0.01 100)",
      "secondary-foreground": "oklch(0.28 0.03 260)",
      muted: "oklch(0.96 0.008 100)",
      "muted-foreground": "oklch(0.48 0.015 260)",
      accent: "oklch(0.94 0.04 200)",
      "accent-foreground": "oklch(0.35 0.08 230)",
      border: "oklch(0.90 0.01 100)",
      ring: "oklch(0.48 0.12 230)",
      "brand-secondary": "oklch(0.55 0.14 320)",
      ...SEMANTIC_LIGHT,
    },
  },
  dark: {
    label: "Dark",
    tokens: {
      background: "oklch(0.14 0.015 260)",
      foreground: "oklch(0.95 0.008 100)",
      card: "oklch(0.18 0.02 255)",
      "card-foreground": "oklch(0.95 0.008 100)",
      primary: "oklch(0.75 0.11 210)",
      "primary-foreground": "oklch(0.14 0.015 260)",
      secondary: "oklch(0.24 0.02 255)",
      "secondary-foreground": "oklch(0.95 0.008 100)",
      muted: "oklch(0.23 0.02 255)",
      "muted-foreground": "oklch(0.70 0.015 260)",
      accent: "oklch(0.26 0.05 210)",
      "accent-foreground": "oklch(0.95 0.01 210)",
      border: "oklch(0.30 0.02 255)",
      ring: "oklch(0.75 0.11 210)",
      "brand-secondary": "oklch(0.72 0.12 320)",
      ...SEMANTIC_DARK,
    },
  },
};

export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: "a",
    name: "A — Encrypted Teal + Warm Chalk",
    pitch: "Privacy / trust feel; farthest from generic AI purple.",
    why: "Warm chalk neutrals vs cool teal brand + copper for earned moments.",
    light: {
      label: "Light",
      tokens: {
        background: "oklch(0.985 0.008 85)",
        foreground: "oklch(0.22 0.025 250)",
        card: "oklch(0.995 0.004 85)",
        "card-foreground": "oklch(0.22 0.025 250)",
        primary: "oklch(0.42 0.09 195)",
        "primary-foreground": "oklch(0.98 0.01 195)",
        secondary: "oklch(0.94 0.02 90)",
        "secondary-foreground": "oklch(0.28 0.04 250)",
        muted: "oklch(0.96 0.012 85)",
        "muted-foreground": "oklch(0.48 0.02 250)",
        accent: "oklch(0.93 0.04 175)",
        "accent-foreground": "oklch(0.32 0.06 195)",
        border: "oklch(0.90 0.015 85)",
        ring: "oklch(0.42 0.09 195)",
        "brand-secondary": "oklch(0.62 0.12 55)",
        ...SEMANTIC_LIGHT,
      },
    },
    dark: {
      label: "Dark",
      tokens: {
        background: "oklch(0.16 0.02 230)",
        foreground: "oklch(0.95 0.01 90)",
        card: "oklch(0.20 0.025 225)",
        "card-foreground": "oklch(0.95 0.01 90)",
        primary: "oklch(0.72 0.10 185)",
        "primary-foreground": "oklch(0.16 0.02 230)",
        secondary: "oklch(0.26 0.03 225)",
        "secondary-foreground": "oklch(0.95 0.01 90)",
        muted: "oklch(0.25 0.025 225)",
        "muted-foreground": "oklch(0.72 0.02 230)",
        accent: "oklch(0.28 0.05 180)",
        "accent-foreground": "oklch(0.95 0.01 90)",
        border: "oklch(0.32 0.025 225)",
        ring: "oklch(0.72 0.10 185)",
        "brand-secondary": "oklch(0.75 0.11 60)",
        ...SEMANTIC_DARK,
      },
    },
  },
  {
    id: "b",
    name: "B — Violet Heritage + Copper Credential",
    pitch: "Keep Arcium violet; copper kills the monotone wash.",
    why: "Warm neutrals + copper accent (not pale violet) as second brand voice.",
    light: {
      label: "Light",
      tokens: {
        background: "oklch(0.99 0.006 75)",
        foreground: "oklch(0.22 0.03 275)",
        card: "oklch(1 0.002 75)",
        "card-foreground": "oklch(0.22 0.03 275)",
        primary: "oklch(0.48 0.20 285)",
        "primary-foreground": "oklch(0.99 0.01 285)",
        secondary: "oklch(0.95 0.015 80)",
        "secondary-foreground": "oklch(0.30 0.04 275)",
        muted: "oklch(0.96 0.01 80)",
        "muted-foreground": "oklch(0.48 0.025 275)",
        accent: "oklch(0.94 0.05 55)",
        "accent-foreground": "oklch(0.38 0.08 50)",
        border: "oklch(0.91 0.012 80)",
        ring: "oklch(0.48 0.20 285)",
        "brand-secondary": "oklch(0.58 0.14 50)",
        ...SEMANTIC_LIGHT,
      },
    },
    dark: {
      label: "Dark",
      tokens: {
        background: "oklch(0.15 0.02 280)",
        foreground: "oklch(0.96 0.01 80)",
        card: "oklch(0.19 0.03 275)",
        "card-foreground": "oklch(0.96 0.01 80)",
        primary: "oklch(0.72 0.14 290)",
        "primary-foreground": "oklch(0.15 0.02 280)",
        secondary: "oklch(0.25 0.03 275)",
        "secondary-foreground": "oklch(0.96 0.01 80)",
        muted: "oklch(0.24 0.025 275)",
        "muted-foreground": "oklch(0.72 0.02 280)",
        accent: "oklch(0.28 0.06 55)",
        "accent-foreground": "oklch(0.92 0.04 70)",
        border: "oklch(0.30 0.03 275)",
        ring: "oklch(0.72 0.14 290)",
        "brand-secondary": "oklch(0.74 0.12 55)",
        ...SEMANTIC_DARK,
      },
    },
  },
  {
    id: "c",
    name: "C — Midnight Ink + Signal Cyan",
    pitch: "Computation / clarity without crypto hype.",
    why: "Near-neutral canvas + cyan signal + rare orchid spark.",
    light: {
      label: "Light",
      tokens: {
        background: "oklch(0.985 0.004 100)",
        foreground: "oklch(0.20 0.02 260)",
        card: "oklch(1 0 0)",
        "card-foreground": "oklch(0.20 0.02 260)",
        primary: "oklch(0.48 0.12 230)",
        "primary-foreground": "oklch(0.99 0.01 230)",
        secondary: "oklch(0.94 0.01 100)",
        "secondary-foreground": "oklch(0.28 0.03 260)",
        muted: "oklch(0.96 0.008 100)",
        "muted-foreground": "oklch(0.48 0.015 260)",
        accent: "oklch(0.94 0.04 200)",
        "accent-foreground": "oklch(0.35 0.08 230)",
        border: "oklch(0.90 0.01 100)",
        ring: "oklch(0.48 0.12 230)",
        "brand-secondary": "oklch(0.55 0.14 320)",
        ...SEMANTIC_LIGHT,
      },
    },
    dark: {
      label: "Dark",
      tokens: {
        background: "oklch(0.14 0.015 260)",
        foreground: "oklch(0.95 0.008 100)",
        card: "oklch(0.18 0.02 255)",
        "card-foreground": "oklch(0.95 0.008 100)",
        primary: "oklch(0.75 0.11 210)",
        "primary-foreground": "oklch(0.14 0.015 260)",
        secondary: "oklch(0.24 0.02 255)",
        "secondary-foreground": "oklch(0.95 0.008 100)",
        muted: "oklch(0.23 0.02 255)",
        "muted-foreground": "oklch(0.70 0.015 260)",
        accent: "oklch(0.26 0.05 210)",
        "accent-foreground": "oklch(0.95 0.01 210)",
        border: "oklch(0.30 0.02 255)",
        ring: "oklch(0.75 0.11 210)",
        "brand-secondary": "oklch(0.72 0.12 320)",
        ...SEMANTIC_DARK,
      },
    },
  },
  {
    id: "d",
    name: "D — Academic Forest + Soft Lilac",
    pitch: "Trusted classroom with a gentle Arcademy wink.",
    why: "Forest structure + lilac accent — dual hue, soft campus feel.",
    light: {
      label: "Light",
      tokens: {
        background: "oklch(0.985 0.01 120)",
        foreground: "oklch(0.22 0.03 150)",
        card: "oklch(0.995 0.005 120)",
        "card-foreground": "oklch(0.22 0.03 150)",
        primary: "oklch(0.40 0.08 155)",
        "primary-foreground": "oklch(0.98 0.01 155)",
        secondary: "oklch(0.94 0.025 130)",
        "secondary-foreground": "oklch(0.30 0.04 150)",
        muted: "oklch(0.96 0.015 125)",
        "muted-foreground": "oklch(0.47 0.03 150)",
        accent: "oklch(0.94 0.04 300)",
        "accent-foreground": "oklch(0.35 0.08 300)",
        border: "oklch(0.90 0.02 130)",
        ring: "oklch(0.40 0.08 155)",
        "brand-secondary": "oklch(0.58 0.14 300)",
        ...SEMANTIC_LIGHT,
      },
    },
    dark: {
      label: "Dark",
      tokens: {
        background: "oklch(0.15 0.02 160)",
        foreground: "oklch(0.95 0.01 120)",
        card: "oklch(0.19 0.025 155)",
        "card-foreground": "oklch(0.95 0.01 120)",
        primary: "oklch(0.72 0.09 155)",
        "primary-foreground": "oklch(0.15 0.02 160)",
        secondary: "oklch(0.25 0.03 155)",
        "secondary-foreground": "oklch(0.95 0.01 120)",
        muted: "oklch(0.24 0.025 155)",
        "muted-foreground": "oklch(0.72 0.02 150)",
        accent: "oklch(0.28 0.05 300)",
        "accent-foreground": "oklch(0.95 0.02 300)",
        border: "oklch(0.30 0.03 155)",
        ring: "oklch(0.72 0.09 155)",
        "brand-secondary": "oklch(0.74 0.10 305)",
        ...SEMANTIC_DARK,
      },
    },
  },
];

export const ALL_PALETTE_PREVIEWS: PaletteOption[] = [
  CURRENT_PALETTE,
  ...PALETTE_OPTIONS,
];
