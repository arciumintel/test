# Analytics versioning

Schema and upgrade notes for the configurable Analytics platform.

## AnalyticsProfile.schemaVersion

| Version | Meaning |
| --- | --- |
| `1` | Initial profile: terminology, KPI set, funnel stages, section visibility, recommendation policy, enabled providers, feature flags. |

**Upgrade path:** bump `schemaVersion` when breaking profile JSON shapes change. Migrations should read old version and backfill defaults; never wipe partner customizations on pack re-install.

## AnalyticsSnapshot.schemaVersion

Aligned with `ANALYTICS_ENGINE_SCHEMA_VERSION` in `src/lib/analytics-engine.ts`.

| Engine version | Payload includes |
| --- | --- |
| `1` | Overview, courses, recommendations, metrics (Phase 2). |
| `2` | + cohorts, behaviour panels (Phase 4). Partner conversion overview panels deferred to V2. |

Stale snapshots (older `schemaVersion` or missing overview panels) trigger live recompute in `getAnalyticsEngineView`.

## Partner conversion metrics (V2)

Partner-defined conversion keys (`community_join`, `docs_visit`, `demo_complete`, etc.),
`ConversionDefinition` management UI, pack conversion stubs, and `conversion_triggered` /
`docs_visited` instrumentation are **deferred to Analytics V2**. Prisma models and
catalogue ids remain as stubs. **Start conversion** (`start_conversion_rate`) is a
learning-funnel metric and stays in V1.

## Analytics Pack versions

- Pack manifests declare `version` (semver string) on `AnalyticsPackManifest`.
- `AnalyticsPackInstall.packVersion` records what was installed.
- **Merge rules:** union sections/KPIs/funnel; upsert concepts/categories; terminology conflicts require Owner `keep` vs `overwrite` (`analytics-pack-merge.ts`). Packs do not seed conversion stubs in V1.
- Re-installing a pack does **not** delete partner edits to readiness models.

## Metric providers

- **Core** (`core`) — always enabled; cannot be disabled.
- **Custom** — registered in code (`analytics-custom-providers.ts`); Owner+ toggles via `enabledProviderIds`.
- New custom providers require catalogue entries in `analytics-metrics.ts` with `partnerSafe: true` and matching `providerId`.

## Feature flags (`AnalyticsProfile.featureFlags`)

| Key | Default | Notes |
| --- | --- | --- |
| `analyticsV2` | env `ANALYTICS_V2_DEFAULT` or false | Full Analytics nav + engine UI. |
| `ecosystemBenchmarks` | false | **No partner UI.** Anonymous quartile overlays only when approved. |

## QuestionAttempt backfill

One-time per environment: `pnpm db:backfill-question-attempts`. Concepts/Assessments gate at ≥95% coverage.

## Migrations reference

| Migration | Scope |
| --- | --- |
| `phase20_analytics_profile` | Profile, concepts, readiness, packs |
| `phase21_analytics_snapshots` | Snapshot store |
| `phase22_question_attempts` | Normalized answers |
| `phase23_certifications` | Certification entities |
| `phase24_analytics_perf_benchmarks` | Read indexes + benchmark rollup table |
