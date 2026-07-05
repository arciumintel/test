---
target: /partner-console/{productId}/analytics/courses/{courseId}
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-21T04-50-21Z
slug: sole-productid-analytics-courses-courseid-page-tsx
---
# Partner Course Analytics Critique — `/partner-console/[productId]/analytics/courses/[courseId]`

Scope: `page.tsx`, `partner-analytics-course-detail.tsx`, shared `CourseAnalyticsView`, date range + privacy controls.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status badge and period selector work; missing course maps to 404, not a recoverable error |
| 2 | Match System / Real World | 3 | Quiz diagnostics copy is plain and partner-appropriate |
| 3 | User Control and Freedom | 3 | Date range + back link; layout tabs provide escape |
| 4 | Consistency and Standards | 2 | Project overview trimmed KPI cards; this page still shows seven hero-metric tiles |
| 5 | Error Prevention | 2 | `generateMetadata` calls analytics fetch without try/catch; draft courses reachable by URL |
| 6 | Recognition Rather Than Recall | 3 | Course title, funnel, and diagnostics are clearly labeled |
| 7 | Flexibility and Efficiency | 3 | Four period presets; no export shortcut unlike project analytics |
| 8 | Aesthetic and Minimalist Design | 2 | Seven-card metric grid + separate badge hero tile + long diagnostic list |
| 9 | Error Recovery | 2 | `HomeSectionLoadError` on fetch throw; null data still becomes `notFound()` |
| 10 | Help and Documentation | 3 | Privacy note and quiz diagnostics aggregation explanation |
| **Total** | | **27/40** | **Acceptable — strong diagnostics, undermined by metric-card regression vs overview** |

## Anti-Patterns Verdict

**LLM assessment:** Functional partner reporting surface, not marketing slop. Quiz diagnostics and lesson funnel are legitimate tool UI. Main tell: the shared `CourseAnalyticsView` seven-tile hero-metric grid, which the project analytics overview just removed. Badge verification views repeat the same big-number card pattern.

**Deterministic scan:** Clean — 0 findings on page + course detail component.

**Browser overlays:** Not attempted (`agent-browser` unavailable).

## Overall Impression

This is the most useful drill-down in partner analytics: lesson funnel, attempts-before-pass, and aggregated quiz diagnostics deliver real partner value. It feels heavier than it needs to because the page leads with the same hero-metric card grid the overview just shed, then adds more cards below before the actionable diagnostics.

## What's Working

1. **Quiz diagnostics section** — Aggregated miss rates with option distribution; privacy-safe and actionable for content partners.
2. **Lesson completion funnel** — Clear per-lesson drop-off visualization tied to course starts.
3. **Load error handling** — Fetch failures use `HomeSectionLoadError` with refresh guidance.

## Priority Issues

### [P1] Hero-metric card grid regressed vs trimmed project analytics
- **What:** `CourseAnalyticsView` renders seven icon + big-number cards (`course-analytics-view.tsx` lines 16–71); course detail embeds it wholesale.
- **Why:** Conflicts with the overview trim you just shipped; adds scroll before funnel/diagnostics; repeats data the funnel and quiz sections already explain.
- **Fix:** Add a compact partner variant (one summary line like overview) or pass a `variant="compact"` to `CourseAnalyticsView` on this route only.
- **Suggested command:** `$impeccable quieter src/components/partner-console/analytics/partner-analytics-course-detail.tsx`

### [P1] Missing course data becomes 404 instead of recoverable error
- **What:** `if (!loadError && !data) notFound()` (`page.tsx` line 57).
- **Why:** Wrong product/course ID or transient empty response looks like "page doesn't exist"; partners cannot retry or return to analytics list gracefully.
- **Fix:** Render `HomeSectionLoadError` or inline "Course not found" with link back to project analytics; reserve `notFound()` for truly invalid routes.
- **Suggested command:** `$impeccable harden src/app/partner-console/[productId]/analytics/courses/[courseId]/page.tsx`

### [P2] Redundant back navigation atop tab shell
- **What:** "Project analytics" chevron back link (`page.tsx` lines 61–67) duplicates the Analytics tab and hub back link in layout.
- **Why:** Extra vertical chrome; inconsistent with other partner sub-routes that rely on tabs alone.
- **Fix:** Remove the back link or replace with an in-page breadcrumb: Analytics / {course title}.
- **Suggested command:** `$impeccable layout src/app/partner-console/[productId]/analytics/courses/[courseId]/page.tsx`

### [P2] Badge verification views use standalone hero-metric card
- **What:** Single large number in its own card (`partner-analytics-course-detail.tsx` lines 16–24).
- **Why:** Same pattern banned on overview; one metric does not warrant a hero tile.
- **Fix:** Fold into the compact summary line or a small metadata row under the title.
- **Suggested command:** `$impeccable quieter src/components/partner-console/analytics/partner-analytics-course-detail.tsx`

### [P2] Header structure and export affordance inconsistent with project analytics
- **What:** Parent analytics page pairs h1 + subtitle + date range + export link; course detail puts privacy note and range below title with no export and no period context in the heading.
- **Why:** Partners lose export path and period context when drilling down; page feels like a different product area.
- **Fix:** Match parent header pattern: title + "Metrics for {rangeLabel}" + date range row + export/report link for this course.
- **Suggested command:** `$impeccable layout src/app/partner-console/[productId]/analytics/courses/[courseId]/page.tsx`

## Persona Red Flags

**Jordan (First-Timer):** Seven metric tiles before understanding what to act on. Unclear why this page differs from the course row they clicked in the table. No export link like the parent analytics page.

**Alex (Power User):** Redundant back link and KPI cards add scroll before quiz diagnostics. Wants compact summary + diagnostics first.

**Morgan (Partner admin):** Quiz diagnostics and privacy note fit official/calm tone. Hero-metric grid feels like generic SaaS dashboard, not the restrained Arcademy partner console you just aligned.

## Minor Observations

- `generateMetadata` fetches full analytics without try/catch; failures could bubble to metadata generation.
- Null metrics render as em dashes in `CourseAnalyticsView` (voice inconsistency).
- Draft/unpublished courses can load if URL is known; status badge shows it but no explanatory copy.
- Native `<select>` for period works but differs from shadcn Select used elsewhere (minor vocabulary drift).

## Questions to Consider

- Should partners land directly on quiz diagnostics + funnel, with summary metrics collapsed?
- Does this page need its own export slice, or a deep link from the project report?
- Should unpublished courses be blocked from partner analytics entirely?
