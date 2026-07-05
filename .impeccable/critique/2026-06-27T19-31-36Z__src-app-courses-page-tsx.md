---
target: /courses
total_score: 25
p0_count: 0
p1_count: 2
p2_count: 2
p3_count: 1
timestamp: 2026-06-27T19-31-36Z
slug: src-app-courses-page-tsx
---
# Critique: `/courses`

**Target:** `src/app/courses/page.tsx` (+ `course-card.tsx`, `course-catalog-filters.tsx`)  
**Register:** product · **Brand:** Official · Calm · Trustworthy

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No result count; filter changes reload silently |
| 2 | Match System / Real World | 3 | Plain tone; course-type labels assume prior knowledge |
| 3 | User Control and Freedom | 3 | "Clear filters" works; no compact reset of individual dimensions |
| 4 | Consistency and Standards | 3 | Matches `/products` chip pattern; cards match home featured grid |
| 5 | Error Prevention | 3 | Invalid query params ignored safely |
| 6 | Recognition Rather Than Recall | 2 | Active filters not summarized; user must re-scan four rows |
| 7 | Flexibility and Efficiency | 2 | No search; chip filters only via full navigation |
| 8 | Aesthetic and Minimalist Design | 2 | Filter block dominates above the fold; generic card grid |
| 9 | Error Recovery | 3 | Solid load-error and empty-filter states |
| 10 | Help and Documentation | 2 | No "start here" guidance for first-time learners |
| **Total** | | **25/40** | **Acceptable — meaningful UX gaps before catalog scales** |

## Anti-Patterns Verdict

**LLM assessment:** Does not read as generic AI slop. The page follows Arcademy's restrained violet-on-cool-neutral system and plain-language voice. The tells are structural, not decorative: four uppercase filter eyebrows, an identical three-column card grid, and dashed-border empty states (consistent sitewide, but still template-adjacent). No gradient text, no crypto hype, no hero metrics. It feels like a competent LMS catalog, not a landing-page generator output.

**Deterministic scan:** Clean — `detect.mjs` returned zero findings across `page.tsx`, `course-card.tsx`, and `course-catalog-filters.tsx`.

**Browser overlays:** Not run (no reliable overlay injection in this session). Assessment based on source review and live dev-server behavior from terminal logs.

## Overall Impression

The catalog page is **functionally sound and on-brand**, but it optimizes for filter completeness over learner clarity. With only a handful of courses today it works; as the catalog grows, the four-row chip wall and lack of "what's active / how many results" will become the main friction. The biggest opportunity is making **discovery feel guided**, not just filterable.

## What's Working

1. **Tone and trust** — Header copy ("plain language", wallet optional) matches PRODUCT.md and avoids crypto jargon. Empty states are calm and actionable.
2. **Filter empty state** — "No courses match these filters" + **Clear filters** is the right recovery pattern (better than `/products`, which only shows inline text).
3. **Card information density** — Title, summary, project, lessons, duration, badge signal give enough to choose without opening every course.

## Priority Issues

### [P1] Active filters and result count are invisible

**What:** After applying Level + Project + Sort, nothing above the grid says "3 courses" or "Beginner · Arcium · Shortest." Users must mentally reconstruct state from chip highlights across four rows.

**Why it matters:** Violates visibility of system status and recognition-over-recall. Jordan (first-timer) won't know if filters worked; Alex (power user) can't scan state at a glance.

**Fix:** Add a compact summary bar between filters and grid: `Showing 3 courses` + removable filter pills + "Clear all."

**Suggested command:** `$impeccable layout`

### [P1] Filter block creates high cognitive load on mobile

**What:** Up to four labeled rows (Level, Type, Project, Sort), each with 3–6 chips. On a phone this pushes the actual courses well below the fold.

**Why it matters:** Fails the ≤4 visible options guideline at the decision layer. Casey (mobile) sees filters, not courses.

**Fix:** Collapse to one horizontal control on small screens (e.g. "Filter & sort" sheet/drawer) or show only Level + Sort inline and tuck Project/Type behind "More filters."

**Suggested command:** `$impeccable adapt`

### [P2] Course type is filterable but invisible on cards

**What:** Users can filter by `Foundations` / `Product onboarding` / `Builder intro`, but `CourseCard` never surfaces `courseType`.

**Why it matters:** Filter dimensions should be recognizable in results. Otherwise "Type" feels like backend taxonomy.

**Fix:** Small label chip on card (below project name or beside level badge).

**Suggested command:** `$impeccable layout`

### [P2] Header copy over-explains and duplicates home

**What:** Subtitle repeats wallet guidance already on homepage hero and nav context.

**Why it matters:** Catalog pages should orient ("pick a course"), not re-teach the whole product loop. Adds scroll before content.

**Fix:** Shorten to one line: e.g. "All published courses in the Arcium ecosystem. No wallet needed to read."

**Suggested command:** `$impeccable clarify`

### [P3] Card hover motion lacks reduced-motion guard

**What:** `CourseCard` uses `hover:-translate-y-0.5`, `group-hover:scale-105`, and `hover:shadow-md`.

**Why it matters:** DESIGN.md requires `prefers-reduced-motion` respect. Minor a11y gap.

**Fix:** Wrap transforms in `@media (prefers-reduced-motion: no-preference)` or use color-only hover.

**Suggested command:** `$impeccable audit`

## Persona Red Flags

**Jordan (Confused First-Timer):** "Product onboarding" and "Builder intro" filter chips have no inline explanation. No "New here? Start with Welcome to Arcium" callout on the catalog itself.

**Casey (Distracted Mobile):** Four filter rows before first course card. Thumb must scroll past ~200px of chips to see content.

**New Arcium Learner (project-specific):** Page answers "what courses exist" but not "which one first." Home has featured courses; `/courses` treats all courses as equal.

## Minor Observations

- `hasActiveCourseFilters` treats any `sort` param as active, but "Recommended" clears the param — edge case only.
- Entire filter component returns `null` when catalog has ≤1 product and single level/type — fine at launch, disappears when diversity grows.
- `CourseCard` pairs border with `hover:shadow-md` — borderline vs DESIGN.md "no ghost card" rule.
- No text search; acceptable for V1 but will matter at 15+ courses.

## Questions to Consider

- Should `/courses` recommend a single "Start here" course above the grid for newcomers?
- Is full-page navigation per chip the right tradeoff, or would client-side filtering feel faster?
- When the catalog is small (2–3 courses), should filters hide entirely and show a simple list?
