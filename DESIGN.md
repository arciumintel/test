---
name: Arcademy
description: Official, calm learning UI for the Arcium ecosystem
colors:
  background: "oklch(0.985 0.004 100)"
  foreground: "oklch(0.20 0.02 260)"
  primary: "oklch(0.48 0.12 230)"
  primary-foreground: "oklch(0.99 0.01 230)"
  secondary: "oklch(0.94 0.01 100)"
  secondary-foreground: "oklch(0.28 0.03 260)"
  muted: "oklch(0.96 0.008 100)"
  muted-foreground: "oklch(0.48 0.015 260)"
  accent: "oklch(0.94 0.04 200)"
  accent-foreground: "oklch(0.35 0.08 230)"
  brand-secondary: "oklch(0.55 0.14 320)"
  brand-secondary-foreground: "oklch(0.99 0.01 320)"
  card: "oklch(1 0 0)"
  border: "oklch(0.90 0.01 100)"
  destructive: "oklch(0.58 0.22 27)"
  success: "oklch(0.6 0.15 155)"
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

# Design System: Arcademy

## Overview

**Creative North Star: "The Trusted Classroom"**

Arcademy looks and feels like an official institution for ecosystem learning: calm near-neutral surfaces, signal-cyan brand accents used with restraint, orchid for XP and achievement moments, and typography that prioritizes readability over display flair. The UI serves learning workflows (catalog, lessons, quizzes, profile, admin) rather than selling hype. Depth comes from tonal layering and subtle borders, not dramatic shadows or glass effects.

This system explicitly rejects crypto hype aesthetics, developer-wiki density, corporate enterprise polish, and generic SaaS landing-page templates. Visual identity stays approachable to newcomers while reading as quiet computation — not generic violet AI chrome.

**Key Characteristics:**

- Near-neutral ink canvas with a slight warm-neutral lift (not warm cream defaults or cool-violet fog)
- Single sans family (Geist) with weight contrast for hierarchy
- Signal cyan for CTAs, logo, and brand moments at ≤15% of any screen; orchid rarer for progress/XP
- Rounded corners capped at 12–16px on cards; pills reserved for badges and tags
- Visible progress and status at every step of the learner journey

## Colors

A dual-hue product palette: near-neutral surfaces carry the classroom; signal cyan marks official actions; orchid marks earned/progress moments.

### Primary

- **Signal Cyan** (oklch(0.48 0.12 230)): Primary buttons, logo mark, links, focus rings, selection highlight. The signature brand accent.

### Accent

- **Aqua Wash** (oklch(0.94 0.04 200)): Hover backgrounds, accent surfaces, icon containers on marketing sections.

### Brand secondary

- **Orchid** (oklch(0.55 0.14 320)): XP meters, progress fills (`--xp`), sparse achievement accents. Never floods backgrounds.

### Neutral

- **Canvas** (oklch(0.985 0.004 100)): Page background. Near-neutral with a quiet warm lift.
- **Ink** (oklch(0.20 0.02 260)): Primary body text and headings.
- **Muted Ink** (oklch(0.48 0.015 260)): Supporting copy, metadata, placeholders. Must maintain readable contrast on canvas.
- **Surface** (oklch(1 0 0)): Card and popover backgrounds.
- **Divider** (oklch(0.90 0.01 100)): Borders and input strokes.
- **Secondary Fill** (oklch(0.94 0.01 100)): Secondary buttons and subtle section backgrounds.

### Semantic

- **Destructive** (oklch(0.58 0.22 27)): Delete, error, fail states.
- **Success** (oklch(0.6 0.15 155)): Pass quiz, completion, positive confirmation.

### Named Rules

**The Restrained Accent Rule.** Signal cyan appears on CTAs, the logo mark, active nav, and one focal element per section. Orchid is rarer — progress bars and achievement chips only. Neither floods backgrounds or body text blocks.

## Typography

**Display Font:** Geist Sans (with system-ui fallback)
**Body Font:** Geist Sans (with system-ui fallback)
**Mono Font:** Geist Mono (with ui-monospace fallback)

**Character:** Clean geometric sans with enough weight contrast to feel official without corporate stiffness. Hierarchy through size and semibold weight, not decorative display type.

### Hierarchy

- **Display** (600, clamp(2.25rem–3rem), 1.1): Homepage hero and major landing headings only. Max clamp ceiling 3rem; never shout past 6rem.
- **Headline** (600, 1.5rem / text-2xl, 1.25): Section titles on catalog and course pages.
- **Title** (600, 1rem, 1.4): Card titles, lesson names, panel headers.
- **Body** (400, 1rem, 1.6): Lesson content, descriptions, form labels. Cap line length at 65–75ch in prose blocks.
- **Label** (500, 0.875rem): Button text, nav items, badges, metadata.

### Named Rules

**The Plain Language Rule.** Typography supports scannability: short headings, generous line height on body copy, `text-wrap: balance` on h1–h3. No all-caps body copy.

## Elevation

Flat-by-default with light structural shadows. Cards use `shadow-sm` (subtle, ≤8px blur) paired with a 1px border, never both a heavy drop shadow and decorative border on the same element. The sticky header uses backdrop blur (`bg-background/80 backdrop-blur-md`) as a functional layer, not decorative glassmorphism.

### Shadow Vocabulary

- **Structural** (`shadow-sm`): Cards, inputs, primary buttons at rest. Single soft shadow, no wide blur.
- **None at rest:** Page sections, list rows, lesson content. Depth via background tint and border only.

### Named Rules

**The No Ghost Card Rule.** Do not pair `border: 1px solid` with wide soft shadows (blur ≥16px). Pick border OR a tight shadow, not both as decoration.

## Components

### Buttons

- **Shape:** Moderately rounded (0.625rem / rounded-md)
- **Primary:** Signal-cyan fill, light foreground, shadow-sm, h-10 default / h-11 lg
- **Hover / Focus:** Primary darkens to 90% opacity; focus-visible ring at 3px ring-ring/40
- **Ghost:** Transparent with accent hover wash for nav and secondary actions
- **Outline:** Border + background, accent hover for tertiary actions

### Cards / Containers

- **Corner Style:** 1rem (rounded-xl) on card shells; 0.75rem on inline feature blocks
- **Background:** White card on canvas; dashed border for empty states
- **Shadow Strategy:** shadow-sm only; border always present
- **Internal Padding:** 1.5rem (p-6) standard; gap-6 between card sections

### Inputs / Fields

- **Style:** 1px border, canvas background, rounded-md, h-10
- **Focus:** 3px ring at ring/40, border shifts to ring color
- **Placeholder:** muted-foreground; must meet contrast requirements

### Navigation

- **Header:** Sticky, 4rem height, logo mark (primary square + GraduationCap icon), ghost nav links, wallet + Discord auth on the right
- **Active state:** Font weight or primary tint; no heavy underline bars
- **Mobile:** Collapse nav; preserve wallet connect prominence

### Progress & Badges

- **Progress bar:** Orchid XP fill (`bg-xp`) on muted track
- **Badges:** Rounded pill for status labels; primary variant for platform tag
- **Level badges:** Small caps avoided; use readable label text

### Marketing Hero (homepage)

- **Grid wash:** `.bg-grid` radial dot pattern at 12% primary opacity
- **Gradient accent:** Single horizontal hairline via primary/40, not gradient text
- **CTA cluster:** Primary button + muted supporting line ("No wallet needed to explore")

## Do's and Don'ts

### Do:

- **Do** use OKLCH tokens from globals.css for all new surfaces and states
- **Do** keep signal cyan on CTAs and one focal brand element per view; orchid on XP/progress only
- **Do** show learner progress explicitly (lesson checklist, quiz score, badge award)
- **Do** write button labels as verb + object ("Browse courses", "Save changes")
- **Do** keep temperature contrast: near-neutral canvas vs cool cyan brand

### Don't:

- **Don't** use crypto hype visuals: neon gradients, moon memes, degen energy, loud Web3 marketing
- **Don't** default to developer-docs aesthetics: dense monospace body, API-reference layout, insider jargon in UI copy
- **Don't** flood screens with orchid or cyan washes — dual hue fails if both become ambient background tint
- **Don't** revert to purple/indigo monoculture for "brand familiarity"
- **Don't** adopt corporate enterprise polish: navy-and-gold schemes, stock-photo trust badges, "enterprise-grade" filler
- **Don't** use generic SaaS templates: hero metrics, identical icon-card grids, numbered section eyebrows (01/02/03)
- **Don't** use gradient text, side-stripe borders, or glassmorphism as decoration
- **Don't** exceed 12–16px border-radius on cards or round inputs past pill territory
- **Don't** pair 1px borders with wide soft drop shadows on the same element
