export type PaletteModeTokens = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  mutedForeground: string;
  accent: string;
  border: string;
  seal: string;
  earned: string;
  success: string;
};

export type PaletteAlternative = {
  id: string;
  name: string;
  tagline: string;
  light: PaletteModeTokens;
  dark: PaletteModeTokens;
};

const currentLight: PaletteModeTokens = {
  background: "#f4f1e8",
  foreground: "#12201f",
  card: "#fffdf8",
  primary: "#1c7e79",
  primaryForeground: "#ffffff",
  secondary: "#e9e3d2",
  mutedForeground: "#5f6e6b",
  accent: "#e5dec9",
  border: "#e5dec9",
  seal: "#b8862a",
  earned: "#7a5812",
  success: "#166534",
};

const currentDark: PaletteModeTokens = {
  background: "#0a1011",
  foreground: "#e8edec",
  card: "#12181a",
  primary: "#32b5ae",
  primaryForeground: "#04100f",
  secondary: "#181f21",
  mutedForeground: "#8b9498",
  accent: "#1c2426",
  border: "#252d30",
  seal: "#c9a44e",
  earned: "#dcc07a",
  success: "#3dba6e",
};

/** Palette comparison set — current Vault plus alternatives A–E from color assessment. */
export const PALETTE_ALTERNATIVES: PaletteAlternative[] = [
  {
    id: "current",
    name: "Current Vault",
    tagline: "Security paper · teal · brass seal · Vault Prime dark",
    light: currentLight,
    dark: currentDark,
  },
  {
    id: "a",
    name: "A · Vault Prime",
    tagline: "Same DNA — tighter contrast on links & success",
    light: {
      ...currentLight,
      primary: "#007974",
      accent: "#e3ddc3",
      success: "#127e38",
    },
    dark: {
      background: "#0b191b",
      foreground: "#eaf3f1",
      card: "#0f2224",
      primary: "#2b9e98",
      primaryForeground: "#04100f",
      secondary: "#1c3838",
      mutedForeground: "#89a5a1",
      accent: "#223f3d",
      border: "#1c3838",
      seal: "#d6a43b",
      earned: "#e7c070",
      success: "#3ecf70",
    },
  },
  {
    id: "b",
    name: "B · Cool Ledger",
    tagline: "Cooler canvas · blue-teal · copper seal",
    light: {
      background: "#ecf3f4",
      foreground: "#0f1e22",
      card: "#f8fcfc",
      primary: "#02717a",
      primaryForeground: "#ffffff",
      secondary: "#dce8ea",
      mutedForeground: "#5a6e72",
      accent: "#d4e2e4",
      border: "#d4e2e4",
      seal: "#a7693c",
      earned: "#7a4f2a",
      success: "#127e38",
    },
    dark: {
      background: "#081416",
      foreground: "#e8f2f3",
      card: "#0f1f22",
      primary: "#2a9aa4",
      primaryForeground: "#04100f",
      secondary: "#152b30",
      mutedForeground: "#89a5aa",
      accent: "#1a3238",
      border: "#152b30",
      seal: "#c47d4a",
      earned: "#e0a878",
      success: "#4ade80",
    },
  },
  {
    id: "c",
    name: "C · Warm Parchment",
    tagline: "Richer cream · antique gold seal",
    light: {
      background: "#f5eede",
      foreground: "#12201f",
      card: "#fffcf5",
      primary: "#1c7e79",
      primaryForeground: "#ffffff",
      secondary: "#ede4d0",
      mutedForeground: "#5f6e6b",
      accent: "#e8dfc8",
      border: "#e8dfc8",
      seal: "#af7a31",
      earned: "#7a5518",
      success: "#16a34a",
    },
    dark: {
      background: "#121a17",
      foreground: "#ebe8e0",
      card: "#161f1c",
      primary: "#32aaa4",
      primaryForeground: "#04100f",
      secondary: "#243228",
      mutedForeground: "#95a89e",
      accent: "#2a3a30",
      border: "#243228",
      seal: "#d9a84a",
      earned: "#e8c878",
      success: "#4ade80",
    },
  },
  {
    id: "d",
    name: "D · Deep Mint",
    tagline: "Neutral canvas · mint-forward primary",
    light: {
      background: "#f1f6f6",
      foreground: "#12201f",
      card: "#fafcfc",
      primary: "#11846e",
      primaryForeground: "#ffffff",
      secondary: "#e0ebea",
      mutedForeground: "#5a6b68",
      accent: "#d5e4e2",
      border: "#d5e4e2",
      seal: "#b8862a",
      earned: "#8a6516",
      success: "#127e38",
    },
    dark: {
      background: "#0a1416",
      foreground: "#ecf5f3",
      card: "#0f1c1f",
      primary: "#22b895",
      primaryForeground: "#04100f",
      secondary: "#173033",
      mutedForeground: "#8aab9f",
      accent: "#1c3838",
      border: "#173033",
      seal: "#d6a43b",
      earned: "#e7c070",
      success: "#3ecf70",
    },
  },
  {
    id: "e",
    name: "E · Inkwell",
    tagline: "Higher contrast · deeper teal · editorial",
    light: {
      background: "#f4f1e8",
      foreground: "#0a1817",
      card: "#fffdf8",
      primary: "#006e6b",
      primaryForeground: "#ffffff",
      secondary: "#e9e3d2",
      mutedForeground: "#4f5e5b",
      accent: "#e5dec9",
      border: "#e5dec9",
      seal: "#b8862a",
      earned: "#8a6516",
      success: "#127e38",
    },
    dark: {
      background: "#080f0e",
      foreground: "#f0f7f5",
      card: "#0e1a19",
      primary: "#28a09a",
      primaryForeground: "#04100f",
      secondary: "#1a2f2d",
      mutedForeground: "#9bb5b0",
      accent: "#223836",
      border: "#1a2f2d",
      seal: "#d6a43b",
      earned: "#e7c070",
      success: "#3ecf70",
    },
  },
];
