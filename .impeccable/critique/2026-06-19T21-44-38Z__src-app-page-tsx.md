---
target: homepage
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-06-19T21-44-38Z
slug: src-app-page-tsx
---
# Homepage Critique — src/app/page.tsx (final polish)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Full-page and section errors with refresh; partial catalog on single fetch failure |
| 2 | Match System / Real World | 4 | Plain copy; projects defined inline; wallet deferred to step 2 |
| 3 | User Control and Freedom | 4 | Step 1 links to courses; refresh on all error surfaces |
| 4 | Consistency and Standards | 4 | Projects label aligned site-wide; spacing and empty states matched |
| 5 | Error Prevention | 4 | Independent course/product fetch; no false empty states |
| 6 | Recognition Rather Than Recall | 4 | Clear primary path; linked step 1; secondary project list |
| 7 | Flexibility and Efficiency | 2 | No power-user shortcuts on landing (acceptable) |
| 8 | Aesthetic and Minimalist Design | 4 | Grid + list rhythm; no template tells |
| 9 | Error Recovery | 4 | Partial failure UX; refresh at page and section level |
| 10 | Help and Documentation | 4 | How-it-works + inline project definition |
| **Total** | | **36/40** | **Excellent — minor polish only** |

## Anti-Patterns Verdict

**LLM assessment:** Does not read as AI-generated. Passes PRODUCT.md anti-reference checks. Legitimate numbered sequence, varied layouts, plain institutional voice.

**Deterministic scan:** Clean — 0 findings.

**Browser overlays:** Not attempted (dev server not running).

## Overall Impression

The homepage is ship-ready for V1. The full improvement arc (distill → clarify → layout → harden → polish) resolved all prior P1 issues. Remaining notes are inherited component polish and optional enhancements, not homepage blockers.

## What's Working

1. **Resilient catalog** — Independent fetches with section-level errors and partial content when one source fails.
2. **Clear learner path** — Hero, linked step 1, featured courses, and compact project list form a coherent funnel.
3. **Production polish** — Focus rings, aria labels, text-pretty, matched spacing, refresh on all error states.

## Priority Issues

### [P3] CourseCard uppercase product eyebrow
- **What:** Featured grid inherits uppercase tracked product name from `CourseCard`.
- **Fix:** Scope to catalog pages or soften in component (site-wide, not homepage-only).
- **Suggested command:** `$impeccable typeset src/components/course-card.tsx`

### [P3] Mobile nav hides catalog links
- **What:** Header nav is `hidden` below `sm`; mobile users rely on hero CTA and scrolling.
- **Fix:** Add mobile menu or persistent catalog links in header (site-wide shell task).
- **Suggested command:** `$impeccable adapt site-header`

## Persona Red Flags

**Jordan:** None significant. Inline project definition and how-it-works cover first-visit confusion.

**Casey:** Acceptable scroll depth; project list is lighter than prior card grid.

**Morgan:** Hero explains Arcium; wallet appears only when relevant.

## Minor Observations

- SSR means no loading skeleton; acceptable for this page shape.
- Hero bg-grid remains subtle and on-brand.

## Questions to Consider

- Is the how-it-works block still worth the vertical space once featured courses render on desktop?
- Should CourseCard eyebrow treatment change globally now that homepage copy is settled?
