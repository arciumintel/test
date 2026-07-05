---
target: /projects
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T22-04-17Z
slug: src-app-products-page-tsx
---
# Projects Catalog Critique — src/app/products/page.tsx

> **Route note:** Nav and footer label this "Projects"; the URL is `/products`. This critique covers the full projects catalog at that route.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Fetch errors silently render empty state; no error alert |
| 2 | Match System / Real World | 2 | Page title "Ecosystem Projects" vs nav "Projects"; "ecosystem" jargon in header |
| 3 | User Control and Freedom | 3 | Cards link to project detail; empty state offers courses fallback |
| 4 | Consistency and Standards | 2 | Voice, error handling, and layout lag homepage + polished `/courses` |
| 5 | Error Prevention | 2 | try/catch masks DB failures as "no projects yet" |
| 6 | Recognition Rather Than Recall | 3 | Cards show logo, name, description, course count |
| 7 | Flexibility and Efficiency | 2 | No filter/search (acceptable for V1); catalog shape differs from homepage list |
| 8 | Aesthetic and Minimalist Design | 3 | Readable card grid; uppercase category eyebrow on cards when present |
| 9 | Error Recovery | 2 | Empty state only on failure; no refresh path |
| 10 | Help and Documentation | 3 | Header explains project → courses path; tone is staff-facing not learner-first |
| **Total** | | **24/40** | **Acceptable — apply homepage/courses polish arc** |

## Anti-Patterns Verdict

**LLM assessment:** Not overt AI slop, but clearly behind the polish arc on `/` and `/courses`. The page still reads like an earlier draft: "Ecosystem Projects" branding, staff-curated copy, silent error handling, and card-grid scaffolding while the homepage already reframed projects as a compact list with plain language.

**Deterministic scan:** Clean — 0 findings on `page.tsx` and `product-card.tsx`.

**Browser overlays:** Not attempted (browser automation unavailable in this session; dev server appears active for `/products`).

## Overall Impression

The projects catalog works functionally and the empty-state CTA to courses is a nice touch. The single biggest gap is **consistency**: learners click "Projects" in the header and land on a page that uses different words, older copy, weaker error honesty, and a heavier card grid than the homepage section they likely came from.

## What's Working

1. **Useful empty-state escape hatch** — "Browse courses" button gives learners a path when no projects exist (better than a dead end).
2. **Scannable card metadata** — Logo, name, description, and course count communicate enough to choose a project.
3. **Shared components** — `ProductCard` keeps detail pages and catalog visually related.

## Priority Issues

### [P1] Silent fetch failure masquerading as empty catalog
- **What:** Lines 15–18 catch errors and set `products = []`, showing "No ecosystem projects available yet."
- **Why:** Same trust issue fixed on homepage and `/courses`; learners cannot tell empty from broken.
- **Fix:** Reuse `HomeSectionLoadError` with refresh; reserve empty state for successful zero-result fetches.
- **Suggested command:** `$impeccable harden src/app/products/page.tsx`

### [P1] Terminology and copy drift from the rest of the product
- **What:** H1 and metadata say "Ecosystem Projects"; nav/footer/homepage say "Projects". Header copy uses "staff-curated Arcium ecosystem projects" while homepage says "Each project is an app or tool in Arcium with its own course list."
- **Why:** Jordan clicks "Projects" and sees a different product name; jargon undermines the plain-language brand.
- **Fix:** Rename page to "Projects", align metadata/description with homepage voice, drop "ecosystem" and "staff-curated" from learner-facing copy.
- **Suggested command:** `$impeccable clarify src/app/products/page.tsx`

### [P2] Catalog layout heavier than homepage projects section
- **What:** Full page uses a 3-column `ProductCard` grid; homepage uses compact `ProductRowLink` rows for the same entities.
- **Why:** Same content type gets two different browse patterns; the grid feels like the pre-distill homepage card scaffold.
- **Fix:** Consider row list for catalog (or a hybrid: rows on mobile, keep cards only if thumbnails justify it).
- **Suggested command:** `$impeccable layout src/app/products/page.tsx`

### [P2] ProductCard uppercase category eyebrow
- **What:** Optional category renders as `uppercase tracking-wide` above every card title.
- **Why:** Same AI-grammar eyebrow flagged on `CourseCard`; repeats across a grid.
- **Fix:** Sentence-case label in metadata row or drop eyebrow when category is sparse.
- **Suggested command:** `$impeccable typeset src/components/product-card.tsx`

### [P2] Missing typography and structure polish
- **What:** No `text-balance` / `text-pretty`, no `aria-labelledby` section wrapper, empty state uses `p-12` vs homepage `p-10`.
- **Fix:** Match patterns applied on `/courses`.
- **Suggested command:** `$impeccable polish src/app/products/page.tsx`

## Persona Red Flags

**Jordan (First-Timer):** Clicks "Projects" in nav, sees "Ecosystem Projects" as the page title. Cannot tell a broken catalog from an empty one. "Staff-curated" sounds internal, not welcoming.

**Casey (Mobile):** Single-column card stack is fine, but card hover translate/shadow feedback is touch-irrelevant. Long descriptions in cards require more scrolling than homepage rows.

**Morgan (New Arcium Learner):** "Arcium ecosystem projects" appears before Arcium is explained in plain language (homepage hero does explain it). Empty copy says "ecosystem project pages" instead of "projects."

## Minor Observations

- No `TrackView` on catalog page while `/courses` tracks `course_catalog_viewed` — analytics gap, not primary UX.
- Detail pages and breadcrumbs still say "Ecosystem Projects"; align when clarifying catalog copy.
- Empty state icon lacks `aria-hidden` (homepage empty states include it).
- `ProductCard` fallback icon missing `aria-hidden`.

## Questions to Consider

- Should the full projects catalog reuse `ProductRowLink` for parity with homepage, or is a card grid the intended "gallery" experience?
- When clarifying, should breadcrumb/detail "Ecosystem Project" badges change in the same pass or stay scoped to the catalog page?
- Would a cross-link to `/courses` in the page header help learners who land on Projects first?
