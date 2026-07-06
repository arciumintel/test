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

Arcademy is **not** inheriting Arcium's violet brand. It teaches the Arcium ecosystem but speaks with its own voice.

**Key Characteristics:**

- Security-paper light canvas (`#F4F1E8`) / deep teal-black dark canvas (`#0C1A1C`)
- Teal primary for CTAs, progress, links, focus rings
- Brass seal accent for decorative/large credential text only — earned chip text darkened on light for WCAG
- Interference moiré texture ambient-only (headers, hero, footer, empty states, seal surfaces)
- Lock/key `SealBadge` for badge earn and verification moments
- Grain overlay paired with interference at low opacity

## Colors

### Primary (Teal)

| Mode | Token | Hex | Use |
|------|-------|-----|-----|
| Light | `--primary` | `#1C7E79` | Buttons, links, progress, focus |
| Light | `--primary-foreground` | `#FFFFFF` | Text on primary |
| Dark | `--primary` | `#2FA6A0` | Buttons, links, progress, focus |
| Dark | `--primary-foreground` | `#04100F` | Text on primary |

### Canvas & Surfaces

| Mode | Token | Hex |
|------|-------|-----|
| Light | `--background` | `#F4F1E8` |
| Light | `--card` | `#FFFDF8` |
| Light | `--border` | `#E5DEC9` |
| Light | `--foreground` | `#12201F` |
| Light | `--muted-foreground` | `#5F6E6B` |
| Dark | `--background` | `#0C1A1C` |
| Dark | `--card` | `#102325` |
| Dark | `--border` | `#1E3A3A` |
| Dark | `--foreground` | `#EAF3F1` |
| Dark | `--muted-foreground` | `#8BA6A2` |

### Seal / Brass (decorative + earned chips)

| Mode | Token | Hex | Use |
|------|-------|-----|-----|
| Light | `--seal` | `#B8862A` | Seal SVG strokes, large decorative text |
| Light | `--earned` | `#8A6516` | Earned chip foreground (WCAG on light) |
| Dark | `--seal` | `#D6A43B` | Seal SVG strokes, large decorative text |
| Dark | `--earned` | `#E7C070` | Earned chip foreground on dark |

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

Verified pairs (approximate):

| Pair | Ratio | Notes |
|------|-------|-------|
| `#12201F` on `#FFFDF8` | ~12.5:1 | Body on card |
| `#5F6E6B` on `#FFFDF8` | ~5.2:1 | Muted on card |
| `#1C7E79` on `#FFFFFF` | ~4.6:1 | Primary button |
| `#8A6516` on earned chip bg | ~4.5:1+ | Light earned chip (darkened brass) |
| `#EAF3F1` on `#102325` | ~11:1 | Dark body on card |
| `#8BA6A2` on `#102325` | ~4.6:1 | Dark muted |
| `#2FA6A0` on `#04100F` | ~5.5:1 | Dark primary button |

Brass `#B8862A` on white is **not** used for small body text — decorative/large only on light mode.

## Do's and Don'ts

### Do

- Use CSS tokens from `globals.css` for all surfaces
- Apply `.bg-ambient` only on marketing/header/footer/empty-state bands
- Use `SealBadge` for credential earn and verification moments
- Keep teal on CTAs, progress, and one focal element per section

### Don't

- Don't use violet/indigo Arcium brand colors in Arcademy UI
- Don't put interference texture on quiz forms or lesson readers
- Don't use glow, gradient-mesh heroes, or crossed-line grids
- Don't use brass for small body text on light mode
- Don't use crypto hype or hacker-tool aesthetics
