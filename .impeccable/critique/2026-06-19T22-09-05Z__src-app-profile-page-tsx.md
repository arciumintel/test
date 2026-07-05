---
target: /profile
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T22-09-05Z
slug: src-app-profile-page-tsx
---
# Profile Page Critique — src/app/profile/page.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress bars and stats communicate state; no page-level load/error UI if data fetch fails |
| 2 | Match System / Real World | 3 | Learner-facing sections are clear; wallet mono address and Discord grant errors skew technical |
| 3 | User Control and Freedom | 2 | Unauthenticated users redirect to `/courses` with no explanation or connect prompt |
| 4 | Consistency and Standards | 2 | Lags catalog polish arc; quiz links say "My profile" while nav/metadata say "My learning" |
| 5 | Error Prevention | 3 | Display name length capped; Discord OAuth states handled; profile fetch has no try/catch |
| 6 | Recognition Rather Than Recall | 3 | Badges, progress rows, and section headings make accomplishments visible |
| 7 | Flexibility and Efficiency | 2 | No course sorting/filtering (OK for V1); Discord retry helps power users only |
| 8 | Aesthetic and Minimalist Design | 2 | Header stat trio reads as hero-metrics; badge card grid + Discord block add visual weight |
| 9 | Error Recovery | 2 | Discord grant retry exists; DB failure yields generic error page, not in-page recovery |
| 10 | Help and Documentation | 3 | Empty states nudge toward courses; Discord section explains optional linking |
| **Total** | | **27/40** | **Acceptable — learner hub works; polish and auth edge cases lag** |

## Anti-Patterns Verdict

**LLM assessment:** Not generic AI slop — this is a real learner dashboard with purposeful progress UI. It does carry SaaS-dashboard tells: icon + big number + label stats in the header, a badge card grid, and uneven polish compared to recently refined catalog pages. Discord failure copy includes an em dash.

**Deterministic scan:** Clean — 0 findings on `page.tsx`.

**Browser overlays:** Not attempted (browser automation unavailable in this session).

## Overall Impression

The profile page delivers the core V1 loop: see progress, badges, and next courses. The biggest gaps are **edge-case honesty** (logged-out redirect, fetch failures) and **brand consistency** (hero-style stats and terminology drift vs the calm catalog voice you have elsewhere).

## What's Working

1. **Progress is visible** — Course rows with percentage bars answer "where am I and what's next?" better than most catalog pages.
2. **Badge presentation** — Medallion + course name + verification link gives earned credentials context without NFT hype.
3. **Discord optional framing** — Unlinked state clearly says badges work without Discord; good restraint for V1 scope.

## Priority Issues

### [P1] Logged-out visit silently redirects away
- **What:** Line 26 `if (!user) redirect("/courses")` with no message or wallet-connect prompt.
- **Why:** Jordan clicks "My learning" without a connected wallet and lands on the course catalog with no explanation — feels broken, not gated.
- **Fix:** Dedicated unauthenticated state on `/profile` with plain copy + wallet connect CTA, or redirect with a visible banner/query param explaining why.
- **Suggested command:** `$impeccable onboard src/app/profile/page.tsx`

### [P1] Profile data fetch has no resilient error handling
- **What:** `Promise.all([...])` for awards, progress, Discord data has no try/catch; failures surface as a generic Next.js error.
- **Why:** Same trust gap fixed on `/courses` and `/products`; learners cannot recover from transient DB issues.
- **Fix:** Wrap fetches, render section-level or page-level error with refresh (reuse `HomeSectionLoadError` pattern).
- **Suggested command:** `$impeccable harden src/app/profile/page.tsx`

### [P2] Header stat row matches hero-metrics anti-pattern
- **What:** Three `Stat` blocks with large numbers, icons, and tiny labels (lines 163–167, 285–302).
- **Why:** PRODUCT anti-reference flags hero metrics; conflicts with "trust through restraint" on a learner profile.
- **Fix:** Fold counts into section headings ("Badges earned (3)") or a compact inline summary without dashboard KPI styling.
- **Suggested command:** `$impeccable quieter src/app/profile/page.tsx`

### [P2] Terminology drift: "My profile" vs "My learning"
- **What:** Nav/metadata use "My learning"; quiz success links use "My profile" / "View my profile" (`quiz-runner.tsx`).
- **Why:** Inconsistent nouns erode the calm, institutional voice.
- **Fix:** Standardize on "My learning" everywhere learner-facing.
- **Suggested command:** `$impeccable clarify src/components/quiz-runner.tsx`

### [P2] Typography and empty-state polish lag
- **What:** No `text-balance` / `text-pretty`; sections lack `aria-labelledby`; badge empty state is text-only (no button CTA); icons missing `aria-hidden`.
- **Fix:** Match patterns from polished `/courses` and `/products`.
- **Suggested command:** `$impeccable polish src/app/profile/page.tsx`

## Persona Red Flags

**Jordan (First-Timer):** Clicks "My learning" without wallet connected, ends up on `/courses` confused. Badge empty state doesn't offer an obvious "Browse courses" button like other empty states.

**Sam (Accessibility):** Display name edit control is a raw `<button>` with hover styles only — verify focus ring matches design system. Multiple `<h2>` sections without `aria-labelledby` landmarks for screen reader navigation.

**Casey (Mobile):** Header stacks stats in a row that may feel cramped on narrow screens; Discord failure alerts stack long error text with retry buttons — readable but dense when multiple failures exist.

## Minor Observations

- Page metadata title is "My learning" but visible `<h1>` is the display name — intentional personalization, but document title may not match what users expect in tabs when name is unset ("Learner").
- `CourseProgressRow` wraps each row in a `Card` — acceptable, but differs from compact list pattern on catalog pages.
- Discord grant error strings may append raw `lastErrorMessage` with an em dash (line 169 in `discord-profile-section.tsx`).
- `TrackView` analytics hook is appropriate.

## Questions to Consider

- Should logged-out `/profile` be a wallet-connect landing page instead of a redirect?
- Are header stats earning their space, or should accomplishment counts live only in section headings?
- Should Discord sit below badges/progress (credentials first) rather than above them?
