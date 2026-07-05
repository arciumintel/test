---
target: /partner-console/[slug]/self-service
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-21T04-01-48Z
slug: pp-partner-console-productid-self-service-page-tsx
---
# Partner Self-Service Critique — `/partner-console/[productId]/self-service`

Scope: `page.tsx`, `partner-self-service-panel.tsx`, shared product layout and nav.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Save/review success and button spinners work; no aria-live, no last-updated on intake |
| 2 | Match System / Real World | 3 | Plain partner vocabulary; "factual review" assumes insider knowledge |
| 3 | User Control and Freedom | 2 | Submit review advances workflow with no confirmation or undo |
| 4 | Consistency and Standards | 3 | Matches analytics/courses page shell; tab says "Self-service", h1 says "Partner self-service" |
| 5 | Error Prevention | 2 | No confirm before irreversible review submit; no unsaved-changes guard |
| 6 | Recognition Rather Than Recall | 2 | Draft-ready CTA asks user to check accuracy but provides no draft link |
| 7 | Flexibility and Efficiency | 2 | No shortcuts, timestamps, or collapsed completed workflow steps |
| 8 | Aesthetic and Minimalist Design | 3 | Functional tool UI; KPI hero cards removed since prior console critique |
| 9 | Error Recovery | 3 | Server load uses HomeSectionLoadError; client errors sit at section bottom |
| 10 | Help and Documentation | 2 | Permission alert helps; no partner handbook link on this primary intake page |
| **Total** | | **27/40** | **Acceptable — clear V1 loop with workflow handoff and feedback gaps** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a credible partner admin tool, not marketing slop. The six-step review timeline is a legitimate ordered process (not decorative numbered eyebrows). No gradient text, ghost cards, or cream-body tells. Main product-slop risk is generic section stacking (alert → timeline → form → analytics stub) without a single dominant next action.

**Deterministic scan:** Clean — 0 findings across `partner-self-service-panel.tsx` and `self-service/page.tsx`.

**Browser overlays:** Not attempted (`agent-browser` unavailable in this session).

## Overall Impression

Self-service delivers the core partner loop: submit materials, track review status, submit factual review, jump to analytics. Shared product layout and tab nav are a clear improvement since the prior console-wide critique. The single biggest gap is **the handoff when a draft is ready**: the UI tells partners to verify accuracy but does not link them to the draft.

## What's Working

1. **Review workflow timeline** — Six ordered statuses with current-step highlighting and completion checks; appropriate for a real process, not decorative scaffolding.
2. **Permission boundaries** — Top alert and finalized-state copy clearly state staff retains publish approval; form locks after approval/publish.
3. **Progressive review CTA** — "Submit partner review" only appears when `canSubmitForReview` is true (`draft_created`), avoiding premature submissions.

## Priority Issues

### [P1] Draft-ready state has no path to the draft
- **What:** When status is `draft_created`, the panel shows "Ready for factual review?" and asks partners to "check the draft for accuracy," but offers no link to Course drafts or a specific draft preview.
- **Why:** Partners must discover the separate "Course drafts" tab by recall; many will submit blind or stall.
- **Fix:** Add a primary "Review draft" link to `/partner-console/{productId}/courses` (or the specific draft) inside the review CTA block; make it the dominant action before "Submit partner review."
- **Suggested command:** `$impeccable shape src/components/partner-console/partner-self-service-panel.tsx`

### [P1] Submit partner review is one click, no confirmation
- **What:** `handleSubmitReview` fires immediately on button click with no confirm dialog.
- **Why:** Status transition to `partner_review` is irreversible for partners; misclicks create support churn.
- **Fix:** Inline confirm pattern (button → "Confirm submission" + cancel) or lightweight dialog restating what happens next.
- **Suggested command:** `$impeccable harden src/components/partner-console/partner-self-service-panel.tsx`

### [P2] Success and error feedback is visual-only
- **What:** "Saved" and "Review submitted" use green text + check icon; errors use red text at the section bottom. No `aria-live` / `role="status"`.
- **Why:** Screen reader users may not hear confirmation; errors from submit review may be missed below the fold on mobile.
- **Fix:** Wrap transient messages in `role="status" aria-live="polite"`; surface submit errors adjacent to the review CTA.
- **Suggested command:** `$impeccable audit src/components/partner-console/partner-self-service-panel.tsx`

### [P2] Course performance section appears before publish
- **What:** "Course performance" and "View analytics" always render, even when workflow is early-stage or unpublished.
- **Why:** Sets false expectations; analytics page may be empty or confusing for new partners.
- **Fix:** Gate behind `published` status, or show muted empty state: "Analytics available after your course is published."
- **Suggested command:** `$impeccable onboard src/components/partner-console/partner-self-service-panel.tsx`

### [P2] High cognitive load on first visit
- **What:** Full six-step vertical timeline, permission alert, three-field form, optional review block, and analytics teaser all visible in one scroll.
- **Why:** Fails chunking/working-memory checks; no single "do this now" focal point for new partners.
- **Fix:** Collapse completed workflow steps; elevate one primary action per status (e.g., "Add source URL" at `received`, "Review draft" at `draft_created`).
- **Suggested command:** `$impeccable layout src/components/partner-console/partner-self-service-panel.tsx`

## Persona Red Flags

**Jordan (First-Timer):** "Factual review" and "Submit partner review" are unexplained. At `draft_created`, copy says check the draft but no draft link appears. No partner handbook link on this page (hub has one). Will hesitate or submit without reviewing.

**Sam (Accessibility-Dependent):** Save/review success relies on green `text-success` without live region announcements. Workflow progress uses color and icon changes without `aria-current="step"` on the active item. Form labels and focus rings are solid (shadcn defaults).

**Morgan (Partner admin, ecosystem team):** Page title "Partner self-service" feels internal/ops-y vs the calm official tone in PRODUCT.md. Expected a task-first heading like "Submit course materials" with product name context already in layout. Wants visible "what happens after I submit?" — review CTA ends at "Staff will follow up" with no timeline estimate.

## Minor Observations

- Unused imports: `Card`, `CardContent` in `partner-self-service-panel.tsx`.
- Tab nav lists Analytics first, Self-service third — likely wrong priority for partner primary task.
- `intake.updatedAt` is fetched server-side but never shown; would help Alex and Morgan trust save state.
- Metadata title uses em-dash pattern (`Self-service: ${product.name}`) — minor voice inconsistency with Impeccable copy rules.

## Questions to Consider

- What if the page had exactly one primary action determined by `reviewStatus`, with everything else secondary?
- Should analytics live only on the Analytics tab, freeing self-service to focus purely on intake?
- What would "Review draft" look like as an inline preview instead of a tab switch?
