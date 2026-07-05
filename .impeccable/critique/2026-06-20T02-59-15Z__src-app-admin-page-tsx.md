---
target: /admin
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-20T02-59-15Z
slug: src-app-admin-page-tsx
---
# Staff Admin Critique — src/app/admin/

Scope: shared `layout.tsx`, dashboard (`page.tsx`), and representative sub-routes (products, partner intake, course editor).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | List pages show db errors; course editor fetch has no try/catch |
| 2 | Match System / Real World | 3 | Staff vocabulary fits; "Ecosystem Projects" drifts from learner "Projects" |
| 3 | User Control and Freedom | 2 | Non-staff users redirect to `/` silently; unauth message lacks inline wallet connect |
| 4 | Consistency and Standards | 2 | Error UI varies (Alert vs dashed box); thin layout vs polished partner console shell |
| 5 | Error Prevention | 3 | Dashboard/products/intake use try/catch; course editor does not |
| 6 | Recognition Rather Than Recall | 3 | Dashboard course list + status badges; no persistent section nav |
| 7 | Flexibility and Efficiency | 3 | Publish controls, partner intake, project CRUD support staff workflow |
| 8 | Aesthetic and Minimalist Design | 2 | Four KPI cards on dashboard; uppercase tracked "Arcademy Admin" eyebrow |
| 9 | Error Recovery | 3 | Db errors explain dev setup; no refresh path for transient production failures |
| 10 | Help and Documentation | 3 | Empty states and schema hints help local dev; partner intake guidance present |
| **Total** | | **27/40** | **Acceptable — functional staff tools with IA and edge-case gaps** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a real internal admin surface, not marketing slop. Dashboard KPI grid and uppercase layout eyebrow are the main generic tells. Partner console recently gained a shared shell; admin still uses a one-line header link and per-page back links only.

**Deterministic scan:** Clean — 0 findings across `src/app/admin/`.

**Browser overlays:** Not attempted (browser automation unavailable in this session).

## Overall Impression

Staff admin is further along than partner console was on fetch error handling for list pages, and the logged-out gate shows a message instead of dumping users on `/courses`. The biggest opportunities are **wayfinding** (shared nav like partner console), **terminology alignment** ("Projects" not "Ecosystem Projects"), and **hardening** the course editor plus non-staff access feedback.

## What's Working

1. **Dashboard db resilience** — try/catch with a visible warning instead of a crash on list load failure.
2. **Course operations at a glance** — All-courses list with status badges, edit links, and inline publish controls supports daily staff work.
3. **Unauthenticated gate copy** — "Staff access required" explains wallet connect at the header (better than silent redirect).

## Priority Issues

### [P1] Non-staff wallet redirected home with no explanation
- **What:** `layout.tsx` line 27 `redirect("/")` when `user.role !== "staff_admin"`.
- **Why:** A connected learner wallet hitting `/admin` lands on the homepage with no feedback; feels broken or insecure.
- **Fix:** Inline "Staff access only" state with link back to courses, or redirect with `?access=staff-only` banner.
- **Suggested command:** `$impeccable onboard src/app/admin/layout.tsx`

### [P1] Course editor load is not resilient
- **What:** `courses/[id]/page.tsx` uses uncaught `Promise.all([...])` for course, products, and readiness.
- **Why:** Transient DB errors crash the editor mid-workflow; list pages already handle this better.
- **Fix:** try/catch + `HomeSectionLoadError` with refresh.
- **Suggested command:** `$impeccable harden src/app/admin/courses/[id]/page.tsx`

### [P2] Thin admin shell vs partner console
- **What:** Layout is only an uppercase "Arcademy Admin" link; sub-routes use ad hoc back links (Dashboard, Ecosystem Projects).
- **Why:** Staff juggle dashboard, projects, intake, and editors; recall burden is high without section nav.
- **Fix:** Shared admin nav in `layout.tsx`: Dashboard · Projects · Partner intake (highlight active route).
- **Suggested command:** `$impeccable layout src/app/admin/layout.tsx`

### [P2] "Ecosystem Projects" terminology drift
- **What:** Dashboard button, products page title, metadata, and admin forms say "Ecosystem Projects" while learner UI uses "Projects".
- **Why:** Same entity, two names; partners and staff see inconsistent language.
- **Fix:** Rename staff-facing copy to "Projects" (keep `/admin/products` routes).
- **Suggested command:** `$impeccable clarify src/app/admin`

### [P2] Dashboard hero-metric KPI row
- **What:** Four `SummaryStat` cards with icon + large number (lines 114–127, 181–202).
- **Why:** Hero-metrics anti-pattern; data also appears in the course list context below.
- **Fix:** Compact inline counts in dashboard header or a single summary line; drop card grid.
- **Suggested command:** `$impeccable quieter src/app/admin/page.tsx`

### [P2] Unauthenticated staff gate lacks connect affordance
- **What:** Layout shows copy pointing to header "Connect wallet" but no inline `WalletAuth`.
- **Why:** Extra hunt for new staff; profile/partner console now embed connect prompts.
- **Fix:** Reuse centered `WalletAuth` in the staff gate state.
- **Suggested command:** `$impeccable onboard src/app/admin/layout.tsx`

### [P2] Inconsistent error recovery patterns
- **What:** Dashboard/products use `Alert`; partner intake uses dashed muted box; none offer refresh for transient failures.
- **Fix:** Standardize on `HomeSectionLoadError` for runtime failures; keep dev schema hints only when appropriate.
- **Suggested command:** `$impeccable harden src/app/admin/partner-intake/page.tsx`

## Persona Red Flags

**Staff admin (primary):** Must remember three top-level destinations from dashboard buttons alone. Course editor can white-screen on DB blip. KPI cards add noise before the actionable course list.

**Alex (Power User):** No persistent nav; repeated back-link hops between dashboard, products, and course editor.

**Jordan (First-Timer):** Should not reach admin, but a connected learner who does gets silently sent to `/` with no explanation.

## Minor Observations

- Layout eyebrow uses `uppercase tracking-wide` (banned AI grammar pattern on learner surfaces).
- Admin components still say "ecosystem project" in forms and referral toolkit copy.
- Partner intake db error message is helpful for dev but visually inconsistent with dashboard Alert.
- Course editor preview and publish controls are strong; publish readiness panel is good staff UX.

## Questions to Consider

- Should admin share the partner-console tab pattern for `/admin/products/[id]` detail routes?
- Are dashboard KPIs needed daily, or would counts in section headings suffice?
- Should non-staff see a dedicated access-denied page instead of redirecting to `/`?
