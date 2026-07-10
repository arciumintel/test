---
name: Arcademy Vault
description: Cryptographic learning UI — teal primary, brass seal accents, security-paper canvas
colors:
  background: "#F4F1E8"
  foreground: "#12201F"
  primary: "#1C7E79"
  primary-foreground: "#FFFFFF"
  secondary: "#E9E3D2"
  secondary-foreground: "#12201F"
  muted: "#E9E3D2"
  muted-foreground: "#5F6E6B"
  accent: "#E5DEC9"
  accent-foreground: "#12201F"
  card: "#FFFDF8"
  border: "#E5DEC9"
  seal: "#B8862A"
  earned: "#8A6516"
  destructive: "#DC2626"
  success: "#16A34A"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
---

# Design System: Arcademy Vault

## Overview

**Creative North Star: "The Sealed Classroom"**

Arcademy has its own cryptographic identity — approachable-first, never intimidating hacker-tool aesthetic. Learners encounter warm security-paper surfaces, teal primary actions, and brass seal accents reserved for credential moments. Depth comes from tonal layering, interference ambient texture, and lock/key seal badges — not neon glow or gradient meshes.

Arcademy is **not** inheriting Arcium's violet brand wholesale. It teaches the Arcium ecosystem but speaks with its own voice. Dark mode introduces a restrained violet accent for featured/premium surfaces only.

**Key Characteristics:**

- Security-paper light canvas (`#F4F1E8`) / neutral charcoal dark canvas (`#0A1011`)
- Teal primary for CTAs, progress, links, focus rings — **interactive only in dark mode**
- Violet (`--featured`) for featured/premium content in dark mode
- Brass/gold seal accent for credential and achievement moments
- Interference moiré texture ambient-only (headers, hero, footer, empty states, seal surfaces)
- Lock/key `SealBadge` for badge earn and verification moments
- Grain overlay paired with interference at low opacity

## Colors

### Primary (Teal)

| Mode | Token | Hex | Use |
|------|-------|-----|-----|
| Light | `--primary` | `#1C7E79` | Buttons, links, progress, focus |
| Light | `--primary-foreground` | `#FFFFFF` | Text on primary |
| Dark | `--primary` | `#32B5AE` | Buttons, links, progress, focus — interactive only |
| Dark | `--primary-foreground` | `#04100F` | Text on primary |

### Canvas & Surfaces (dark — Vault Prime)

Dark mode uses a **neutral charcoal elevation stack**. Teal is removed from surfaces, borders, and muted text. Hierarchy comes from lightness steps, not hue saturation.

| Mode | Token | Hex | Role |
|------|-------|-----|------|
| Dark | `--background` | `#0A1011` | Base canvas |
| Dark | `--card` | `#12181A` | Elevated panels |
| Dark | `--popover` | `#141B1D` | Floating surfaces |
| Dark | `--foreground` | `#E8EDEC` | Primary text |
| Dark | `--muted-foreground` | `#8B9498` | Secondary text (neutral, not teal-tinted) |
| Dark | `--secondary` | `#181F21` | Tracks, chips, inactive fills |
| Dark | `--accent` | `#1C2426` | Hover washes |
| Dark | `--border` | `#252D30` | Dividers — visible like Linear/GitHub dark |

### Featured / Premium (dark only)

| Token | Hex | Use |
|-------|-----|-----|
| `--featured` | `#9B8AFB` | Featured labels, premium highlights, chart accent |
| `--featured-foreground` | `#F4F2FF` | Text on featured fills |
| `--featured-background` | `rgba(155,138,251,0.10)` | Featured chip/card wash |
| `--featured-border` | `rgba(155,138,251,0.22)` | Featured chip borders |

Reserved for featured courses, premium content, ecosystem featured nodes — not general decoration.

### Canvas & Surfaces (light — unchanged)

| Mode | Token | Hex |
|------|-------|-----|
| Light | `--background` | `#F4F1E8` |
| Light | `--card` | `#FFFDF8` |
| Light | `--border` | `#E5DEC9` |
| Light | `--foreground` | `#12201F` |
| Light | `--muted-foreground` | `#5F6E6B` |

### Seal / Gold (achievements + credentials)

| Mode | Token | Hex | Use |
|------|-------|-----|-----|
| Light | `--seal` | `#B8862A` | Seal SVG strokes, large decorative text |
| Light | `--earned` | `#7A5812` | Earned chip foreground (WCAG on light) |
| Dark | `--seal` | `#C9A44E` | Seal SVG strokes, large decorative text |
| Dark | `--earned` | `#DCC07A` | Earned chip foreground on dark |

### XP / Progress

`--xp` maps to `--primary` (teal). Progress bars use `bg-xp`.

## Texture — Interference

Two offset `repeating-radial-gradient` ring-fields create moiré fringes. Applied via `.bg-ambient` and `.bg-page-header` pseudo-elements with edge mask fade and light grain overlay.

**Ambient only** — page headers, hero, footer, empty states, badge verification card header, seal surfaces.

**Never on** — dashboards, quizzes, forms, lesson readers, dense content panels.

Subtle drift animation (52s) respects `prefers-reduced-motion`.

## Motifs

- **Interference texture** — ambient backgrounds
- **SealBadge** — lock/key SVG seal using `--seal` + `--primary`
- **Grain** — paired with interference at 4–5% opacity

**Rejected:** crossed grid (`.bg-grid`), glitch, redaction bars, heavy monospace body, glow, gradient-mesh hero lines.

## Typography

**Display Font:** Geist Sans  
**Body Font:** Geist Sans  
**Mono Font:** Geist Mono (metadata, wallet addresses only — not body copy)

### Hierarchy

- **Display** (600, clamp 2.25–3rem): Homepage hero only
- **Headline** (600, 1.5rem): Section titles
- **Title** (600, 1rem): Card titles, lesson names
- **Body** (400, 1rem, 1.6): Lesson content, descriptions
- **Label** (500, 0.875rem): Buttons, nav, badges

## Elevation

Flat-by-default. Cards: `shadow-sm` + 1px border. No wide glow shadows. Ecosystem viz frame uses inset highlight only (no outer glow).

## Components

### Buttons

- **Primary:** Teal fill, on-primary foreground, h-10 default
- **Ghost / Outline:** Accent hover wash on security-paper tones

### Cards

- `rounded-xl`, opaque `--card` background
- Dashed border empty states with optional `.bg-ambient` overlay

### Progress & Badges

- Progress: `bg-xp` (teal) on `--secondary` track
- Status badges: semantic variants (`success`, `earned`, etc.)
- Credential display: `SealBadge` or `BadgeMedallion` (image override)

### Signature Moments

- **Quiz pass:** `SealBadge` with `quiz-pass-celebrate` animation when badge earned; teal trophy icon otherwise
- **Badge verification:** Ambient texture on card header band + seal medallion

## WCAG AA

All body text and interactive controls on **opaque** surfaces. Texture is decorative behind content, never under small text directly.

Verified pairs (Jul 2026 accessibility audit):

| Pair | Ratio | Notes |
|------|-------|-------|
| `#12201F` on `#FFFDF8` | ~16.5:1 | Body on card |
| `#5F6E6B` on `#FFFDF8` | ~5.3:1 | Muted on card |
| `#1C7E79` on `#FFFFFF` | ~4.9:1 | Primary button |
| `#176B67` on `#F4F1E8` | ~5.6:1 | Inline links on canvas (`--link`) |
| `#166534` on `#FFFFFF` | ~7.1:1 | Success button / mainnet badge |
| `#7A5812` on earned chip bg | ~5.4:1 | Light earned / certification chips |
| Label pills on 12% tint | ≥4.5:1 | Darkened label inks in light mode |
| Status tint pills (`/12`–`/14`) | ≥4.5:1 | `--*-subtle-foreground` tokens |
| `#E8EDEC` on `#12181A` | ~15.2:1 | Dark body on card |
| `#8B9498` on `#12181A` | ~5.8:1 | Dark muted |
| `#32B5AE` on `#04100F` | ~7.7:1 | Dark primary button |
| `#DCC07A` on earned chip bg | ~8.3:1 | Dark earned chip |
| `#9B8AFB` on `#12181A` | ~5.5:1 | Featured accent text |
| Focus ring (`--ring`) vs surfaces | ≥4.8:1 | 40% opacity ring on controls |

Brass `#B8862A` on white is **not** used for small body text — decorative/large only on light mode.

Disabled controls use reduced opacity (WCAG exempt); focus rings use `ring-ring/40` minimum.

## Do's and Don'ts

### Do

- Use CSS tokens from `globals.css` for all surfaces
- Apply `.bg-ambient` only on marketing/header/footer/empty-state bands
- Use `SealBadge` for credential earn and verification moments
- Keep teal on CTAs, progress, and one focal element per section
- In dark mode, use neutral surfaces; let cyan carry interaction, violet carry featured, gold carry achievement

### Don't

- Don't flood dark surfaces with teal tints (borders, cards, muted text)
- Don't use violet/indigo as a general brand wash — featured/premium moments only
- Don't put interference texture on quiz forms or lesson readers
- Don't use glow, gradient-mesh heroes, or crossed-line grids
- Don't use brass for small body text on light mode
- Don't use crypto hype or hacker-tool aesthetics
