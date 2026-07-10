# Feature Brief: Ecosystem Intelligence & Qualification Layer

**Status:** Approved — in implementation
**Date:** 2026-07-09

## Problem & Value

Partner outreach showed little interest in Arcademy's education pitch, but Arcium staff explicitly want analytics. This repositions Arcademy around what the ecosystem's anchor actually values: owned, professional-grade onboarding intelligence plus verifiable proof-of-understanding primitives (wallet cohorts, verify API) that plug into Arcium's growth work.

The pitch flips from "send us your users" to "we send you qualified wallets and insight."

## Scope

### In scope

1. **Query-layer fix** — replace per-lesson/per-course query loops in `src/lib/analytics.ts` with `groupBy` aggregations; cache dashboard reads.
2. **`AnalyticsDailyRollup` table + daily cron** (following the existing `api/cron/discord-role-grants` pattern) — cheap trendlines forever; backfill from historical `AnalyticsEvent` rows.
3. **Ecosystem Overview dashboard** in `src/app/admin/analytics/` — platform funnel (view → start click → wallet connect → start → complete → badge), trendlines, cross-product comparison, scorecard against PRD targets.
4. **Learner cohort panel** — return rate, multi-course rate, median time-to-completion.
5. **Quiz intelligence** — most-missed questions aggregated from `QuizAttempt.answers` JSON.
6. **"State of Ecosystem Onboarding" export** — extends the `generatePartnerReport` pattern in `src/lib/analytics.ts` to an ecosystem-wide report.
7. **Public verify API** — `src/app/api/v1/verify/route.ts`, read-only, rate-limited, fully public (mirrors data already public on badge verification pages). Documented on `src/app/partners/docs/`.
8. **Cohort builder + export** — `src/app/admin/cohorts/`: filter wallets by course completed, badge earned, min quiz score, date range; CSV/JSON allowlist export. Staff-only via `authorizeStaff`.

### Out of scope (for now)

- Arcium self-serve access (no new role or external dashboard)
- Third-party analytics tools (PostHog etc.)
- API keys / auth on the verify API
- Partner-facing insights dashboards
- New Discord work (role rules/grants already exist)
- On-chain anything

## Build order

Items are numbered in build order. The query fix is a prerequisite for everything; rollups power the dashboard. Items 7–8 are independent and demoable to Arcium within days.

## Data Model Changes

- **New:** `AnalyticsDailyRollup` — date, eventName, ecosystemProjectId, courseId, eventCount, uniqueUsers, uniqueAnonymous; unique on the dimension combination.
- No changes to existing entities.

## Open Questions & Risks

- Verify `QuizAttempt.answers` JSON shape is consistent across historical rows before shipping most-missed questions.
- Rollup backfill: run the cron once over historical `AnalyticsEvent` rows so trendlines aren't empty on day one.
- Bulk wallet exports are staff-only; confirm comfort before handing lists to third parties.
- Pair the verify API launch with one committed integration conversation so it has a consumer.

## Estimated effort

Roughly 7–10 working days total.
