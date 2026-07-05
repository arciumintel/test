---
target: /courses
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T21-48-05Z
slug: src-app-courses-page-tsx
---
# Courses Page Critique — src/app/courses/page.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Fetch errors silently render empty state; no error alert |
| 2 | Match System / Real World | 3 | Header uses "ecosystem" jargon; em dash in subcopy |
| 3 | User Control and Freedom | 3 | Browse without wallet; cards link to course detail |
| 4 | Consistency and Standards | 3 | Voice and error handling diverge from polished homepage |
| 5 | Error Prevention | 2 | try/catch masks DB failures as "no courses yet" |
| 6 | Recognition Rather Than Recall | 3 | Grid shows level, duration, lessons, badge on each card |
| 7 | Flexibility and Efficiency | 2 | No filter/search (acceptable for V1 catalog size) |
| 8 | Aesthetic and Minimalist Design | 3 | Functional card grid; uppercase product eyebrow on every card |
| 9 | Error Recovery | 2 | Empty state only; no refresh path on fetch failure |
| 10 | Help and Documentation | 3 | Header explains wallet for progress; could match homepage plain tone |
| **Total** | | **26/40** | **Acceptable — align with homepage patterns** |

## Anti-Patterns Verdict

**LLM assessment:** Not AI slop, but lagging the homepage polish arc. Standard course catalog grid is appropriate for product register. Copy and resilience patterns were improved on `/` but not applied here yet.

**Deterministic scan:** Clean — 0 findings on `page.tsx` and `course-card.tsx`.

**Browser overlays:** Not attempted (dev server not running).

## Overall Impression

The courses catalog works and uses the shared `CourseCard` component well. The main gap is consistency: the homepage now has plain copy, independent error handling, and polish that this page has not inherited. Fixing fetch error honesty and copy alignment would bring it close to homepage quality quickly.

## What's Working

1. **Clear catalog structure** — Page header + responsive card grid is the right shape for a product catalog.
2. **Rich course cards** — Thumbnail, level badge, lesson count, duration, and badge indicator give scannable metadata.
3. **Wallet expectation set** — Header mentions connecting a wallet for progress without gating browse.

## Priority Issues

### [P1] Silent fetch failure masquerading as empty catalog
- **What:** Lines 14–17 catch errors and set `courses = []`, showing "No courses available yet."
- **Why:** Same trust issue fixed on homepage; learners cannot tell empty from broken.
- **Fix:** Reuse `HomeSectionLoadError` or `HomeCatalogError` pattern with refresh.
- **Suggested command:** `$impeccable harden src/app/courses/page.tsx`

### [P1] Copy drift from homepage voice
- **What:** "Official, curated learning paths for the Arcium ecosystem" and em dash in "Browse freely — connect a wallet."
- **Why:** Homepage uses plain language; em dashes are banned in PRODUCT/DESIGN voice; inconsistency erodes trust.
- **Fix:** Match homepage tone: explain Arcium plainly, use commas or periods, defer wallet to a second sentence.
- **Suggested command:** `$impeccable clarify src/app/courses/page.tsx`

### [P2] CourseCard uppercase product eyebrow
- **What:** Every card shows uppercase tracked product name above title.
- **Why:** Critique flagged on homepage; reads as AI eyebrow when repeated across a full grid.
- **Fix:** Sentence case label or move product context to metadata row.
- **Suggested command:** `$impeccable typeset src/components/course-card.tsx`

### [P2] Missing typography polish
- **What:** No `text-balance` on h1 or `text-pretty` on header/empty copy (homepage has both).
- **Fix:** Apply same typography utilities for consistency.
- **Suggested command:** `$impeccable polish src/app/courses/page.tsx`

## Persona Red Flags

**Jordan (First-Timer):** "Arcium ecosystem" in header without inline definition (homepage now explains Arcium in hero subcopy). Empty vs error indistinguishable.

**Casey (Mobile):** Grid collapses to single column; acceptable. Card hover translate may feel odd on touch (minor).

**Morgan (New Arcium Learner):** Catalog is usable; jargon in page intro is the main friction vs homepage.

## Minor Observations

- Metadata description also says "Arcium ecosystem courses"; align when clarifying copy.
- `TrackView` analytics hook is appropriate; no UX impact.
- Empty state is friendly but should not appear on fetch failure.

## Questions to Consider

- Should `/courses` reuse the same error components as homepage for a single catalog resilience pattern?
- Would a one-line link to `/products` help learners who think in projects, not courses?
