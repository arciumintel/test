---
target: homepage
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T19-33-01Z
slug: src-app-page-tsx
---
# Homepage Critique — src/app/page.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Empty states exist but no loading/error feedback if data fetch fails silently |
| 2 | Match System / Real World | 3 | Plain copy overall; "ecosystem projects" assumes Arcium familiarity |
| 3 | User Control and Freedom | 3 | Clear nav exits; no wallet gate for browsing |
| 4 | Consistency and Standards | 3 | shadcn vocabulary holds; value-prop cards diverge from CourseCard/ProductCard patterns |
| 5 | Error Prevention | 2 | Landing page; catch block hides DB errors as empty catalog |
| 6 | Recognition Rather Than Recall | 3 | Labeled nav and CTAs; two catalog entry points compete |
| 7 | Flexibility and Efficiency | 2 | No power-user needs on landing; acceptable |
| 8 | Aesthetic and Minimalist Design | 2 | Four stacked sections with repeated card-grid grammar; value-prop row is template noise |
| 9 | Error Recovery | 2 | Empty states only; no recovery path if catalog failed to load |
| 10 | Help and Documentation | 2 | "No wallet needed" is good; no guidance on courses vs projects |
| **Total** | | **24/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment:** Borderline AI-generated. The hero is restrained and on-brand (cool violet, plain headline, single CTA), but the three-column icon-card value prop block is a direct hit against PRODUCT.md's own anti-reference ("identical icon-card grids, startup template scaffolding"). Sparkles icon on the platform badge adds generic SaaS sparkle. The page otherwise avoids crypto hype and gradient text. Overall: competent product UI with one obvious template section dragging it down.

**Deterministic scan:** Clean. `detect.mjs` returned 0 findings on `src/app/page.tsx`, `course-card.tsx`, and `product-card.tsx`.

**Browser overlays:** Not attempted — dev server not running. Fallback: source review + CLI detector only.

## Overall Impression

The homepage communicates official, calm, trustworthy tone in the hero and respects the "no wallet to browse" promise. The biggest gap is information architecture: learners face three parallel entry paths (Browse courses, Explore ecosystem projects, value props) without a clear recommended starting point. Replacing the generic value-prop grid with something that earns its place would lift the page from "acceptable SaaS landing" to "credible institution."

## What's Working

1. **Hero restraint** — Single primary CTA, `text-balance` on h1, muted supporting line for wallet-free browsing. No hero metrics or gradient text.
2. **Empty states** — Dashed-border placeholders with icon, title, and explanation when catalog is empty. Better than blank sections.
3. **Catalog components** — CourseCard and ProductCard use real metadata (level, duration, lesson count), hover affordances, and accessible link wrappers. Feels like a product, not a brochure.

## Priority Issues

### [P1] Identical icon-card value prop grid
- **What:** Three same-sized cards (icon + heading + body) in `page.tsx` lines 68–100.
- **Why it matters:** PRODUCT.md explicitly lists this as an anti-reference. It reads as filler between hero and catalog, not as differentiated proof.
- **Fix:** Replace with one earned proof block: a single featured course preview, a 3-step "how it works" sequence with real order semantics, or fold value into the catalog sections and delete the row.
- **Suggested command:** `$impeccable distill homepage`

### [P1] Unclear primary entry path
- **What:** Hero CTA goes to `/courses`; next section pushes ecosystem projects; nav duplicates both. New learners don't know whether to start with a product or a course.
- **Why it matters:** Violates "learner-first clarity" and creates decision paralysis (4+ competing paths at fold).
- **Fix:** Pick one default path for newcomers. Example: hero CTA "Browse courses" + subcopy explaining products are optional context. Or invert: "Start with a project" if product-scoped URLs are the canonical model.
- **Suggested command:** `$impeccable clarify homepage`

### [P2] Jargon before context
- **What:** H1 leads with "Arcium ecosystem"; hero subcopy mentions "Solana wallet" before the value prop section explains anything.
- **Why it matters:** Jordan (first-timer) and Morgan (new Arcium learner) must decode terms before trusting the platform.
- **Fix:** Lead with outcome ("Learn Arcium step by step"), defer wallet mention to value prop or a footnote-style line.
- **Suggested command:** `$impeccable clarify homepage`

### [P2] Silent failure masquerading as empty catalog
- **What:** `try/catch` in `page.tsx` swallows errors and renders empty states.
- **Why it matters:** Riley sees "No published courses yet" when the database is down. Erodes trust for an "official" platform.
- **Fix:** Distinguish empty vs error with a retry affordance.
- **Suggested command:** `$impeccable harden homepage`

### [P3] Decorative Sparkles badge
- **What:** `<Sparkles />` on "The official Arcium learning platform" badge.
- **Why it matters:** Slight generic SaaS/marketing tell; conflicts with calm official tone.
- **Fix:** Remove icon or swap for GraduationCap/shield mark already used in header.
- **Suggested command:** `$impeccable quieter homepage`

## Persona Red Flags

**Jordan (First-Timer):** "Ecosystem projects" in section heading and footer with no inline definition. Two catalog sections look interchangeable. Sparkles badge feels like marketing, not institution. No "Start here" guidance.

**Casey (Mobile):** Four full sections require significant scroll before seeing real courses. Value prop cards add scroll cost without actionable links. Thumb reach OK on hero CTA but section-level "View all" links are small ghost buttons.

**Morgan (New Arcium Learner):** H1 assumes Arcium name recognition. Wallet mentioned before understanding what Arcademy does. Product-scoped course URLs exist but homepage doesn't teach that mental model.

## Minor Observations

- Course empty state uses Wallet icon; products empty state uses BookOpen. Icon semantics inconsistent.
- `course-card.tsx` uses uppercase tracked product name eyebrow on every card — fine once, repetitive in a grid.
- Footer exposes raw `SOLANA_CLUSTER` in mono uppercase — developer-facing on a learner homepage.
- Hero gradient hairline (`via-primary/40`) is subtle and acceptable; not gradient text.

## Questions to Consider

- What if the homepage showed one real course path end-to-end instead of abstract value props?
- Does "Featured courses" need to come before "Ecosystem projects" if courses are the core loop?
- What would a confident, institution-first version look like with zero marketing filler sections?
