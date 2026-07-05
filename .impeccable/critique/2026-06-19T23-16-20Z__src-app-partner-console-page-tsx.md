---
target: /partner-console
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T23-16-20Z
slug: src-app-partner-console-page-tsx
---
# Partner Console Critique — src/app/partner-console/

Scope: hub (`page.tsx`) and representative sub-routes (courses, project settings, self-service, Discord, course editor).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Workflow timeline and status badges help; server errors often become 404 or crash |
| 2 | Match System / Real World | 3 | Partner vocabulary mostly fits; "ecosystem project" drifts from learner "Projects" naming |
| 3 | User Control and Freedom | 2 | Unauthenticated visits redirect silently; permission denials bounce to hub without explanation |
| 4 | Consistency and Standards | 2 | Em-dash copy, naming drift, no shared console shell across sub-routes |
| 5 | Error Prevention | 2 | `listPartnerCourses` errors map to `notFound()`; hub fetch uncaught |
| 6 | Recognition Rather Than Recall | 3 | Review workflow timeline aids recognition; hub requires remembering four destinations per project |
| 7 | Flexibility and Efficiency | 3 | Staff/partner paths work; multiple admin surfaces per project |
| 8 | Aesthetic and Minimalist Design | 3 | Functional tool UI; self-service metrics cards add dashboard weight |
| 9 | Error Recovery | 2 | Client forms show errors; server failures lack refresh/recovery pattern |
| 10 | Help and Documentation | 3 | Pending-application and staff-approval alerts help; empty states present |
| **Total** | | **26/40** | **Acceptable — solid V1 partner tooling with auth/error/IA gaps** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a real admin/partner tool, not generic marketing slop. The self-service workflow timeline is appropriate (ordered review process, not decorative numbered eyebrows). Main tells: silent auth redirects, em-dash-heavy copy, four peer actions on the hub card, and hero-style metrics on self-service reporting.

**Deterministic scan:** Clean — 0 findings across `src/app/partner-console/`.

**Browser overlays:** Not attempted (browser automation unavailable in this session).

## Overall Impression

Partner console delivers the V1 self-service loop (draft courses, submit materials, Discord setup, basic reporting). The hub works, but **trust and wayfinding** lag the learner surfaces you recently polished: logged-out access is opaque, fetch failures hide as 404s, and each sub-route is an island with only a text back link.

## What's Working

1. **Review workflow timeline** — Six-step partner intake status is a legitimate ordered flow with clear current-state highlighting.
2. **Permission boundaries** — Alerts and copy repeatedly state staff retains publish approval; partner cannot bypass review.
3. **Pending-application state** — Non-partners see a purposeful empty state instead of a blank hub.

## Priority Issues

### [P1] Unauthenticated `/partner-console` redirects silently
- **What:** Line 21 `if (!user) redirect("/courses")` on hub and all sub-routes.
- **Why:** Direct URL visits or expired sessions feel broken; partners need a connect/sign-in prompt, not the public catalog.
- **Fix:** Inline wallet-connect gate (reuse profile pattern) or redirect with an explanatory query param/banner.
- **Suggested command:** `$impeccable onboard src/app/partner-console/page.tsx`

### [P1] Server/data errors masquerade as missing pages
- **What:** `listPartnerCourses` returns error → `notFound()` on courses page (line 42); hub `getManagedProducts` has no try/catch.
- **Why:** Transient DB failures look like "page doesn't exist"; partners cannot recover.
- **Fix:** Distinguish 404 from load failure; reuse `HomeSectionLoadError` + refresh on hub and list pages.
- **Suggested command:** `$impeccable harden src/app/partner-console/page.tsx`

### [P2] Hub information architecture overloads partners with four peer actions
- **What:** Each project card exposes Project settings, Course drafts, Self-service, and Discord setup with similar visual weight (lines 86–110).
- **Why:** Violates working-memory limits for first-time partner admins; no "start here" path.
- **Fix:** Primary CTA (likely Course drafts or Self-service), secondary links grouped; add one-line guidance per project state.
- **Suggested command:** `$impeccable layout src/app/partner-console/page.tsx`

### [P2] Copy drift and em-dash violations
- **What:** "ecosystem project" on apply empty state (line 51) and self-service metrics; em dashes in self-service, Discord console, and course status copy (`Partner self-service —`, `Approved —`, `Bot added —`, metadata titles).
- **Why:** Conflicts with PRODUCT voice rules and learner-side "Projects" rename.
- **Fix:** Use "project" consistently; replace em dashes with periods, commas, or colons.
- **Suggested command:** `$impeccable clarify src/app/partner-console`

### [P2] No shared partner console shell
- **What:** Sub-routes only share a `ChevronLeft` back link; no persistent project context nav.
- **Why:** Partners context-switch between four tools without a stable sidebar or tab bar; increases recall burden.
- **Fix:** Shared layout with project name + section nav (Courses · Self-service · Discord · Settings).
- **Suggested command:** `$impeccable layout src/app/partner-console`

### [P2] Self-service metrics use hero-metric card grid
- **What:** Four KPI cards with icon + large number (`partner-self-service-panel.tsx` lines 360–377).
- **Why:** Acceptable for reporting, but heavy against brand restraint; table below repeats the same data.
- **Fix:** Drop KPI cards; lead with the course performance table or compact inline counts in the section heading.
- **Suggested command:** `$impeccable quieter src/components/partner-console/partner-self-service-panel.tsx`

## Persona Red Flags

**Partner admin (AGENTS.md):** Permission errors redirect to hub with no message (`self-service/page.tsx` line 36). Course list API failure shows 404 instead of retry. Four equal destinations on hub with no recommended first step.

**Jordan (First-Timer):** If they reach console before wallet connect, silent redirect to courses. Discord setup surfaces raw env-config errors (`botInviteConfigError`) that read like internal ops docs.

**Alex (Power User):** No persistent nav between project sub-areas; must back out to hub between settings, drafts, and Discord. Acceptable for V1 but slows routine edits.

## Minor Observations

- Hub intro lists five concepts in one sentence (settings, drafts, self-service, materials, Discord) — dense for a page header.
- Course editor reuses admin `CourseEditorTabs` — good consistency for staff/partner parity.
- `generateMetadata` titles use em dashes (`Discord —`, `Edit —`) in browser tabs.
- Pending review empty state is calm and appropriate; could add expected timeline copy.

## Questions to Consider

- Should partners land on **Self-service** or **Course drafts** by default instead of the four-button hub?
- Would a shared `partner-console/[productId]/layout.tsx` with section tabs fix most IA issues in one pass?
- Should staff admins use `/admin` exclusively, or is partner console intentionally dual-purpose?
