---
target: /partner-console
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-06-21T04-15-15Z
slug: src-app-partner-console
---
# Partner Console Critique — `/partner-console`

Scope: hub (`page.tsx`), product layout + tab nav, courses, self-service, Discord, settings, analytics (overview + course detail).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Self-service live regions, status badges, load errors; sub-route logout drops return URL |
| 2 | Match System / Real World | 3 | Plain partner copy overall; Discord bot config errors read like internal ops docs |
| 3 | User Control and Freedom | 3 | Wallet connect gate, access-denied alert, review confirm; no post-login return to deep link |
| 4 | Consistency and Standards | 3 | Shared shell + tabs; hub card CTA priority conflicts with tab order and onboarding copy |
| 5 | Error Prevention | 3 | Review confirm, URL validation, Discord form guards; course editor lacks unsaved-changes guard |
| 6 | Recognition Rather Than Recall | 3 | Tab nav aids wayfinding once in a project; hub still forces picking among partial entry points |
| 7 | Flexibility and Efficiency | 3 | Analytics date range, export, staff multi-project access |
| 8 | Aesthetic and Minimalist Design | 2 | Analytics six-card KPI grid; Discord console is long and section-heavy |
| 9 | Error Recovery | 3 | HomeSectionLoadError pattern on most routes; analytics course detail still maps gaps to 404 |
| 10 | Help and Documentation | 3 | Partner handbook on hub, self-service next-step callout, Discord numbered guide |
| **Total** | | **30/40** | **Good — meaningful gains since last critique; hub IA and analytics weight remain** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a credible partner admin surface, not generic marketing slop. Self-service workflow timeline, Discord numbered setup, and restrained violet/shadcn vocabulary fit the product register. Remaining tells: analytics hero-metric card grid (six icon + big number tiles), hub card that leads with Analytics for every project, and occasional internal error strings on Discord setup.

**Deterministic scan:** Clean — 0 findings across `src/app/partner-console/` and `src/components/partner-console/`.

**Browser overlays:** Not attempted (`agent-browser` unavailable in this session).

## Overall Impression

Partner console crossed from "acceptable with trust gaps" to a **coherent V1 partner workspace** since the June 19 critique: wallet connect gate, shared product shell, tab nav, load-error recovery, and self-service handoff fixes landed. The biggest remaining opportunity is **information architecture at the hub and analytics**: new partners are steered toward analytics first, while the surfaces they actually need (course drafts, self-service, Discord) are secondary or tab-only.

## What's Working

1. **Authenticated entry** — `PartnerConnectPrompt` replaces the old silent redirect; logged-out partners see why a wallet is required.
2. **Shared product shell** — `[productId]/layout.tsx` with product name, status badge, and `PartnerProductNav` tabs gives stable context across sub-routes.
3. **Self-service loop** — Status-driven next step, draft review links, confirm-before-submit, collapsed workflow, and gated analytics on the intake page.

## Priority Issues

### [P1] Hub card leads with Analytics for every project
- **What:** Each project card's primary filled button is "View analytics" (`page.tsx` lines 156–161), even for new partners with no published courses.
- **Why:** Misaligns with onboarding copy ("Start with course drafts or self-service") and sends Jordan to an empty metrics dashboard as the first action.
- **Fix:** Make "Course drafts" or "Open project" the primary CTA; demote analytics to outline/ghost until the project has published courses or intake is past draft stage.
- **Suggested command:** `$impeccable layout src/app/partner-console/page.tsx`

### [P1] Discord setup surfaces internal configuration errors to partners
- **What:** `botInviteConfigError` mentions `NEXT_PUBLIC_APP_URL` and Discord Developer Portal callback registration (`discord/page.tsx` lines 84–86, displayed in `project-discord-console.tsx` line 327).
- **Why:** Reads as engineering runbook, not partner-facing guidance; erodes official/calm trust from PRODUCT.md.
- **Fix:** Partner-safe copy ("Discord setup is temporarily unavailable. Contact Arcademy staff.") plus staff-only detail in logs; never expose env var names in UI.
- **Suggested command:** `$impeccable clarify src/components/partner-console/project-discord-console.tsx`

### [P2] Tab nav and hub disagree on partner priority
- **What:** `PartnerProductNav` lists Analytics first; hub card lists Analytics as primary, Course drafts second, Self-service ghost; Discord and Settings appear only in tabs.
- **Why:** Working-memory overload at hub; inconsistent "start here" story across entry points.
- **Fix:** Reorder tabs to Course drafts · Self-service · Discord · Analytics · Settings; add single "Manage project" hub link to a sensible default tab (drafts or self-service).
- **Suggested command:** `$impeccable layout src/components/partner-console/partner-product-nav.tsx`

### [P2] Analytics overview uses hero-metric card grid
- **What:** Six KPI cards with icon + large number (`partner-analytics-overview.tsx` lines 21–68) above a course table that repeats the same metrics.
- **Why:** Violates Arcademy restraint and Impeccable hero-metric ban; adds scroll weight without new information.
- **Fix:** Drop the card grid; lead with the course table and compact inline summary counts in the section heading, or one row of compact stats without icon tiles.
- **Suggested command:** `$impeccable quieter src/components/partner-console/analytics/partner-analytics-overview.tsx`

### [P2] Deep links lost after wallet reconnect
- **What:** `[productId]/layout.tsx` redirects unauthenticated users to `/partner-console` with no `?next=` param (line 20).
- **Why:** Partners bookmarking `/partner-console/{id}/self-service` must re-navigate after session expiry.
- **Fix:** Redirect to `/partner-console?next={encodedPath}` and honor after connect on hub or layout.
- **Suggested command:** `$impeccable harden src/app/partner-console/[productId]/layout.tsx`

## Persona Red Flags

**Jordan (First-Timer):** Hub primary button opens Analytics before any published course exists. Discord error mentions env vars and developer portal. Must guess that Discord and Settings live in tabs after choosing one of three hub links.

**Alex (Power User):** Session expiry on a deep sub-route returns to hub without restoring path. Course editor adds a redundant "Course drafts" back link atop layout tabs. Analytics KPI cards add scroll before the actionable course table.

**Morgan (Partner admin):** Overall tone is calm and official on self-service and pending-application states. Internal Discord errors break the institutional trust the learner surfaces established.

## Minor Observations

- Layout shows product name in a `<p>` while child routes use `<h1>`; workable but heading hierarchy could be cleaner.
- Discord form success/error messages lack `aria-live` (self-service now has this pattern).
- Analytics course detail page uses `notFound()` when data is missing, which may conflate permission gaps with true 404s.
- Hub intro packs five concepts into one sentence; card-level guidance partially compensates.

## Questions to Consider

- Should partners skip the hub entirely and land on Course drafts or Self-service when they have exactly one managed project?
- Is Analytics a tab partners need before publish, or should it appear only after the first published course?
- Would a compact Discord setup progress indicator (bot added · server saved · rules active) reduce the wall-of-sections feel?
