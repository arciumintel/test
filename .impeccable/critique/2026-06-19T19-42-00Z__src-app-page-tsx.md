---
target: homepage
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-06-19T19-42-00Z
slug: src-app-page-tsx
---
# Homepage Critique — src/app/page.tsx (post-fix)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Catalog error state with refresh; no loading skeleton (SSR renders complete) |
| 2 | Match System / Real World | 3 | Plain copy; "Ecosystem projects" still assumes some Arcium context |
| 3 | User Control and Freedom | 3 | Clear nav, wallet-free browse, error recovery |
| 4 | Consistency and Standards | 4 | shadcn patterns throughout; how-it-works matches product tone |
| 5 | Error Prevention | 3 | Fetch failures no longer masquerade as empty catalog |
| 6 | Recognition Rather Than Recall | 3 | "Start here" on courses; projects framed as optional path |
| 7 | Flexibility and Efficiency | 2 | No power-user needs on landing |
| 8 | Aesthetic and Minimalist Design | 3 | Template icon-cards removed; two catalog grids remain but serve real content |
| 9 | Error Recovery | 3 | HomeCatalogError with refresh action |
| 10 | Help and Documentation | 3 | How-it-works sequence explains the flow |
| **Total** | | **30/40** | **Good — solid foundation, minor polish** |

## Anti-Patterns Verdict

**LLM assessment:** No longer reads as AI template landing. Icon-card value prop grid removed. Sparkles badge gone. Hero is outcome-first ("Learn Arcium step by step"). Numbered how-it-works is a legitimate sequence, not decorative scaffolding. Remaining tell: two similar card grids for courses and projects, but both surface real catalog data.

**Deterministic scan:** Clean — 0 findings on `page.tsx` and `home-catalog-error.tsx`.

**Browser overlays:** Not attempted (dev server not running). Fallback: source review + CLI detector.

## Overall Impression

The homepage now matches PRODUCT.md's official, calm, trustworthy register. The prior P1 issues (template grid, unclear entry path) are resolved. What remains is polish: soften residual jargon, and optionally collapse visual repetition between the two catalog sections.

## What's Working

1. **Earned how-it-works** — Numbered steps describe the real learner flow; wallet mention appears at the right moment (step 2).
2. **Clear primary path** — Featured courses first with "Start here"; projects explicitly optional.
3. **Error honesty** — `HomeCatalogError` distinguishes failure from empty catalog with a recovery action.

## Priority Issues

### [P2] Residual jargon: "Ecosystem projects"
- **What:** Section heading and nav label still use insider terminology.
- **Why:** Jordan and Morgan may not know what an "ecosystem project" means in Arcium context.
- **Fix:** Consider "Arcium projects" or "Browse by project" with a one-line definition.
- **Suggested command:** `$impeccable clarify homepage`

### [P2] Dual card-grid visual rhythm
- **What:** Featured courses and ecosystem projects use the same 3-column card grid pattern back-to-back.
- **Why:** Not a template anti-pattern anymore (real content), but the page still feels repetitive on long scroll.
- **Fix:** Differentiate layout (list vs grid for projects, or show fewer project cards as a compact row).
- **Suggested command:** `$impeccable layout homepage`

### [P3] All-or-nothing catalog error
- **What:** `Promise.all` failure hides both courses and products even if one query would succeed.
- **Why:** Partial catalog is better than none for learners.
- **Fix:** Fetch independently; show partial results with inline warning.
- **Suggested command:** `$impeccable harden homepage`

## Persona Red Flags

**Jordan (First-Timer):** "Ecosystem projects" still undefined inline. How-it-works helps; projects section label may still confuse.

**Casey (Mobile):** Three sections before deep catalog content (hero, how-it-works, then courses). Acceptable but scroll-heavy.

**Morgan (New Arcium Learner):** Much improved. H1 assumes Arcium name recognition but no longer leads with "ecosystem."

## Minor Observations

- Hero gradient hairline and bg-grid are restrained; acceptable for product register.
- Empty states use consistent BookOpen icon and copy tone.
- Footer (site-wide) still exposes `SOLANA_CLUSTER` in mono — not on homepage body but visible on page load.

## Questions to Consider

- Could projects appear as a compact secondary row instead of a full grid section?
- Is "How it works" still needed once real courses are visible above the fold on desktop?
- Would linking step 1 of how-it-works directly to `/courses` improve scannability?
