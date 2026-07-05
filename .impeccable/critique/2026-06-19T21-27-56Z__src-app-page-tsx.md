---
target: homepage
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-06-19T21-27-56Z
slug: src-app-page-tsx
---
# Homepage Critique — src/app/page.tsx (post layout + clarify)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Error alert + refresh; SSR renders complete (no loading skeleton) |
| 2 | Match System / Real World | 4 | Plain copy; "project" defined inline; wallet deferred to step 2 |
| 3 | User Control and Freedom | 3 | Clear nav, wallet-free browse, error recovery |
| 4 | Consistency and Standards | 4 | "Projects" aligned across hero sections, header, footer |
| 5 | Error Prevention | 3 | Fetch failures handled; `Promise.all` still all-or-nothing |
| 6 | Recognition Rather Than Recall | 4 | Featured courses primary; projects as secondary list |
| 7 | Flexibility and Efficiency | 2 | No power-user needs on landing |
| 8 | Aesthetic and Minimalist Design | 4 | Varied layouts (grid + list); template icon-cards gone |
| 9 | Error Recovery | 3 | Refresh action; partial catalog would improve resilience |
| 10 | Help and Documentation | 4 | How-it-works sequence + section-level guidance |
| **Total** | | **34/40** | **Good — address minor resilience polish** |

## Anti-Patterns Verdict

**LLM assessment:** Does not read as AI slop. Prior tells removed: no icon-card grid, no Sparkles badge, no competing card grids. Numbered how-it-works is a legitimate sequence (real 3-step learner flow). Hero and sections match PRODUCT.md's official, calm, trustworthy register.

**Deterministic scan:** Clean — 0 findings across homepage-related files.

**Browser overlays:** Not attempted (dev server not running). Fallback: source review + CLI detector.

## Overall Impression

The homepage is in good shape for V1. Information architecture is clear: hero → how-it-works → featured courses → browse-by-project list. Copy is plain and consistent. Remaining work is edge-case hardening, not structural redesign.

## What's Working

1. **Clear learner path** — Hero CTA, featured courses, and "New here?" subcopy align on one starting point.
2. **Layout differentiation** — Course cards for primary catalog; compact project rows for secondary browse. No repetitive grid monotony.
3. **Plain-language voice** — Arcium explained in hero subcopy; "project" defined; Solana jargon removed from footer; wallet appears only in step 2.

## Priority Issues

### [P2] All-or-nothing catalog fetch
- **What:** `Promise.all` failure hides both courses and projects.
- **Fix:** Fetch independently; show partial results with inline warning.
- **Suggested command:** `$impeccable harden homepage`

### [P3] Product row logo alt text
- **What:** `ProductRowLink` uses `alt=""` on logos; product name is adjacent but not tied for screen readers.
- **Fix:** Use `alt={`${product.name} logo`}` or mark decorative with explicit aria on the link.
- **Suggested command:** `$impeccable audit homepage`

### [P3] How-it-works steps are not linked
- **What:** Step 1 says "Open a course" but is not clickable to `/courses`.
- **Fix:** Optional link on step 1 title for faster path (low priority).
- **Suggested command:** `$impeccable polish homepage`

## Persona Red Flags

**Jordan (First-Timer):** Minimal red flags. "Browse by project" + inline definition should land. How-it-works helps before catalog.

**Casey (Mobile):** Still three sections before deep catalog interaction; acceptable for a landing page. Project list is more compact than prior card grid.

**Morgan (New Arcium Learner):** Hero subcopy explains Arcium; much improved from earlier passes.

## Minor Observations

- Hero bg-grid and gradient hairline remain subtle and on-brand.
- Empty states are specific and welcoming.
- Header/footer now match homepage "Projects" label (site-wide consistency win).

## Questions to Consider

- Is how-it-works still needed once featured courses are visible above the fold on desktop?
- Would independent fetching matter in production, or is the current error state sufficient for V1?
