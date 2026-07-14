# Feature Brief: V2-faithful contextual analytics export

**Status:** Ready for implementation  
**Date:** 2026-07-14  
**Related:** [ADR — Configurable Analytics Platform](../adr/2026-07-13-configurable-analytics-platform.md), [`src/lib/analytics-export.ts`](../../src/lib/analytics-export.ts)

## Problem & Value

Partners see rich V2 analytics in the UI (concepts, assessments, readiness, certifications, cohorts, behaviour), but downloads still serialize through Partner Analytics Plus shapes. They need a **shareable narrative** of the view they are looking at—HTML and Markdown first—with CSV still available for spreadsheets. Export remains an **action**, not a primary nav destination (ADR locked).

## Decisions (locked for this brief)

| Decision | Choice |
| --- | --- |
| UX pattern | Contextual “Export this view” + curated full pack on Overview |
| Primary job | Narrative share (HTML / Markdown) |
| CSV | Always offered as a format option |
| Full pack artifact | **A** — single HTML or Markdown memo + one multi-section CSV |
| Drill-downs | List / section views only; concept & question detail pages out of this pass |
| Nav | No “Export” link in Analytics subnav |
| Custom builder / saved views | Out of scope (Analyst “save report views” later) |

## Scope

### In scope

- Rewrite export serializers to consume **engine / section read APIs** (same aggregates as the UI), not Plus-only shaping as the sole payload.
- **Section `scope`** on export: `overview` | `courses` | `course` | `concepts` | `assessments` | `readiness` | `certifications` | `recommendations` | `full`.
- Add export action to Concepts, Assessments, Readiness, Certifications (keep Overview, Courses, Recommendations, course detail).
- Formats on every export: **HTML**, **Markdown**, **CSV**; UI copy leans narrative-first.
- **Full pack** from Overview: one multi-section HTML/MD + one multi-section CSV (section headers / blocks; not a zip).
- Honor active `range` + `compare`; include generated-at, product name, and privacy footer (“aggregates only”).
- When `analyticsV2` is off, keep legacy Plus-shaped full export behavior.

### Out of scope (for now)

- Primary-nav Export page or standalone Export hub
- Ad-hoc metric picker / saved report views
- Concept / question drill-down exports
- Staff-only attribution (UTM, wallets, referrers) in partner files
- Ecosystem benchmark overlays
- Partner conversion overview panels (still deferred per versioning notes)
- Zip of per-section files

## Implementation Outline

1. **`src/lib/analytics-export.ts`** — accept `scope` (+ optional `courseId` for course detail); branch to section builders; stop using Plus serializers as the only content source.
2. **Section serializers** — shared helpers mapping UI DTOs → HTML / MD / CSV so formats do not drift (overview, courses, course, concepts, assessments, readiness, certifications, recommendations, full).
3. **`exportAnalyticsReport` in `src/app/actions/analytics-v2.ts`** — extend Zod with `scope`; keep `authorizeAnalyticsRead`; add `scope` to `partner_report_generated` metadata.
4. **`AnalyticsExportAction`** — take `scope`; on Overview, expose secondary “Complete pack” entry; present HTML/MD as primary formats in copy/order.
5. **Wire missing pages** — Concepts, Assessments, Readiness, Certifications headers.
6. **V1 / Plus path** — when `analyticsV2` is false, ignore new V2-only scopes or map to the existing Plus report.
7. **Perf** — prefer snapshot / same read path as the dashboard for full pack; avoid a second full live recompute when a fresh snapshot exists.

## Data Model Changes

None. Read-only over existing engine, mastery, readiness, certification, and recommendation helpers. Optional reuse of `AnalyticsSnapshot` for latency (no new entities).

## Section → payload

| Scope | HTML / Markdown | CSV |
| --- | --- | --- |
| Overview | KPIs, funnel, trends, cohorts, behaviour, staff notes, top recommendations | KPI rows + funnel / trends tables |
| Courses | Course table + badge / quiz signals | One row per course |
| Course | That course’s diagnostics (existing course-detail depth) | Course metrics + top missed questions |
| Concepts | Mastery / gap rankings; respect backfill gate (block or clear “incomplete data” message) | Concept rows |
| Assessments | Question intelligence / miss rates (list view) | Question rows |
| Readiness | Model score + component breakdown | Component rows |
| Certifications | Attainment summary + per-cert rows | Cert rows |
| Recommendations | Ranked list + rationale / evidence as text | Id, priority, rationale |
| Full | Ordered sections above as one memo | One file with section blocks / headers |

## Risks

- **Parity:** HTML/MD must not invent metrics absent from the section UI; `partnerSafe` / catalogue remains the ceiling.
- **Perf:** Full pack touches many sections — align with snapshot SLA.
- **Backfill:** Concepts / Assessments may be gated; export must not imply complete mastery data when QuestionAttempt backfill is incomplete.
- **Legacy drift:** Dual path (V2 scopes vs Plus) until Plus-shaped export is retired.

## Acceptance checklist

- [x] Export on every primary Analytics section (list views) downloads content that matches that section’s UI aggregates for the selected range/compare.
- [x] Overview offers “Complete pack”: one HTML or Markdown + one multi-section CSV.
- [x] CSV always available; no Export item in Analytics subnav.
- [x] No concept/question drill-down export in this pass.
- [x] Partner files remain aggregates-only.
- [x] V2-off products still get a working Plus-compatible export.
- [x] Telemetry includes `scope` + format.

## Implementation status

Shipped on branch `feat/v2-contextual-analytics-export` (see plan `docs/superpowers/plans/2026-07-14-v2-contextual-analytics-export.md`). Pure serializer unit tests: `pnpm exec tsx --test scripts/analytics-export-format.test.ts`. Manual browser QA of downloads recommended before merge.
