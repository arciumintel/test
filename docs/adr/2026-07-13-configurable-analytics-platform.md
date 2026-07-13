# ADR: Configurable Analytics Platform

- **Status:** Accepted (Phase 0 freeze)
- **Date:** 2026-07-13
- **Plan:** Configurable Analytics Platform design specification (`analytics_report_redesign`)
- **Scope of this ADR:** Locked architecture and product decisions only. No schema, UI, or compute implementation.

## Context

Partner Analytics Plus is a fixed proof of concept: hardcoded KPIs, funnel, and heuristic insights under `/partner-console/[productId]/analytics`. Arcademy must evolve into a **configurable educational intelligence platform** for any ecosystem project—not an Arcium-specific report and not a traditional LMS gradebook.

Phase 0 freezes decisions before product code. Later phases implement models, RBAC, snapshots, and the Analytics shell.

## Decision

Adopt the configuration-driven analytics architecture described below. Settled questions must not be reopened without a superseding ADR.

## Architecture defaults (locked)

| Default | Decision |
| --- | --- |
| Tenant | Analytics tenant = `Product`. `ecosystemProjectId = Product.id`. Do **not** rename `Product`. |
| Config storage | First-class relational models under Product (plus Analytics Pack installs). Not opaque mega-JSON as the sole source of truth; not hardcoded TypeScript per project. |
| Partner privacy | Partner surfaces are aggregates only. No wallets, UTM, or referrers on partner UI. |
| Comparisons (V1) | Project historical only: prior week / month / quarter vs current range. |
| Comparisons (future) | Anonymous ecosystem quartiles (median / top / bottom). Never project names or rankings. |
| Compute | Hybrid: transactional truth (`Progress` / `QuizAttempt` / `BadgeAward` / future `QuestionAttempt` & certifications) + append-only `AnalyticsEvent` + hourly `AnalyticsSnapshot` + manual refresh (Owner / Platform Admin). |
| Credentials | **Badges ≠ Certifications** — distinct entities and analytics sections. |
| Metrics | Resolve through a **provider interface** (core + optional custom providers). |
| Onboarding | New projects seed via **Analytics Packs** + default **Learning Readiness** model. |
| Product naming | Feature name is **Analytics** (not Reports). Exports are an **action**, not a primary nav destination. |
| Access | Four-role model: Platform Admin, Partner Owner, Partner Manager, Partner Analyst. |

## Locked product decisions (§25)

### 1. Who may edit the Analytics Profile

Four-role permission model:

- **Platform Admin** (`User.role = staff_admin`): templates, packs definitions, engine config, feature flags, global section availability, recommendation rule templates, default terminology/readiness templates, migrations, any partner profile, manual snapshot refresh for any project.
- **Partner Owner**: full project analytics config — concepts, objectives, skill categories, readiness formulas/weights, conversions, terminology, dashboard configuration, badges, certifications, recommendation thresholds, pack install/switch, manual snapshot refresh. Cannot edit platform-wide templates or engine logic.
- **Partner Manager**: concepts, learning objectives, content tagging, terminology, dashboard layout, course metadata. Cannot edit readiness formulas, conversion definitions, or recommendation policies.
- **Partner Analyst**: view analytics, export, save report views (later), compare date ranges. No configuration.

Capability matrix and `access-control` helpers are specified in the design plan §3. Implementation is Phase 1+.

### 2. Default readiness model

Do not ship empty readiness. Every new project receives **"Learning Readiness"** with equal weights:

- 20% Course Completion
- 20% Quiz Performance
- 20% Concept Mastery
- 20% Required Learning Path Completion
- 20% Partner Conversion Events

Partners rename/reweight (e.g. Builder / Protocol / Validator / Creator / Community Readiness). Missing components show setup CTAs or contribute neutrally—do not silently fail the whole score.

### 3. Ecosystem benchmarks

- **V1:** historical self-compare only.
- **Future:** anonymous ecosystem median / top quartile / bottom quartile. Never expose project names or rankings.

### 4. Badge vs Certification

- **Badges** = achievements / progress (streaks, module complete, early adopter, etc.).
- **Certifications** = verified credentials with requirements (courses, assessment thresholds, readiness score, partner-defined rules).
- Distinct data models (`Certification` / `CertificationAward` ≠ `Badge` / `BadgeAward`). Do not treat Badge as Certification via rename.

### 5. Snapshot SLA

Hybrid: automatic **hourly** snapshots + **manual refresh** for Partner Owner and Platform Admin. UI always shows Last Updated and status: `fresh` | `building` | `queued` | `stale` / error.

### 6. QuestionAttempt migration

Normalize question attempts into a dedicated model. Dual-write + backfill from `QuizAttempt.answers` JSON before mastery/assessment scale features depend on it. Phase 3 gated on backfill.

**Implemented (Phase 4):** `Certification` / `CertificationRequirement` / `CertificationAward` (`phase23_certifications`), Certifications + Readiness nav views, conversion/cohort/behaviour Overview panels, recommendations v2 with evidence links, Documentation/Community/Hackathon pack definitions with merge + Owner terminology resolution.

**Implemented (Phase 5):** Custom metric provider registry + Owner+ `enabledProviderIds` toggles; unified export via `analytics-export.ts` (legacy `/analytics/reports` redirects); read-path indexes + concept/question drill-down completeness; `EcosystemBenchmarkRollup` schema + `analytics-benchmarks.ts` (flag off, no partner UI); versioning notes in [`docs/analytics_versioning.md`](../analytics_versioning.md).

### 7. Reports vs Analytics

Rename feature to **Analytics**. Primary nav: Overview, Courses, Concepts, Assessments, Readiness, Certifications, Recommendations. **Exports** are an action available throughout Analytics—not a standalone primary page.

### 8. Metric provider architecture

Core provider ships standard metrics. Partner-specific scores register as **custom providers** implementing the shared interface. Never hardcode project names into the core engine. See [`src/lib/analytics-providers.ts`](../../src/lib/analytics-providers.ts) (Phase 0 stub).

### 9. Analytics Packs

Installable curated setups (sections, KPI sets, funnel stages, starter concepts, recommendation thresholds, provider enablement). Default on new Product: **Developer Education Pack** + Learning Readiness. Platform Admin owns pack definitions; Partner Owner installs. See [`src/lib/analytics-packs.ts`](../../src/lib/analytics-packs.ts).

## Information architecture (locked summary)

Nav destinations (design plan §4): Overview → Courses → Concepts → Assessments → Readiness → Certifications → Recommendations; Export as action. Funnel/conversions on Overview; badge progress signals under Courses/Overview; Certifications remain first-class.

## Related Phase 0 artifacts

| Artifact | Path |
| --- | --- |
| Metric catalogue (doc) | [`docs/analytics_metric_catalogue.md`](../analytics_metric_catalogue.md) |
| Metric catalogue (stub) | [`src/lib/analytics-metrics.ts`](../../src/lib/analytics-metrics.ts) |
| Provider interface stub | [`src/lib/analytics-providers.ts`](../../src/lib/analytics-providers.ts) |
| Pack manifests | [`src/lib/analytics-packs.ts`](../../src/lib/analytics-packs.ts) |
| Tracking plan (extended) | [`docs/analytics_tracking_plan.md`](../analytics_tracking_plan.md) |
| Current PoC partner spec | [`docs/partner_analytics_plus_spec.md`](../partner_analytics_plus_spec.md) (superseded; legacy Reports path retired Phase 5) |
| Versioning | [`docs/analytics_versioning.md`](../analytics_versioning.md) |
| Benchmark prep (no UI) | [`src/lib/analytics-benchmarks.ts`](../../src/lib/analytics-benchmarks.ts) |

## Consequences

- Phase 1+ may implement schema, RBAC, packs seed, and editors without re-litigating defaults above.
- Partner Analytics Plus remains the live PoC until feature-flagged replacement (Phase 2+).
- Staff referral/UTM analytics stay staff-only; provider and catalogue entries must mark `partnerSafe: false` for attribution/PII metrics.
- Arcium-specific terminology belongs only in Product profile / pack seed data—never in core engine modules.

## Out of scope for Phase 0

Prisma migrations, RBAC migration, Analytics shell UI, snapshot jobs, `QuestionAttempt` tables, Certifications entity, retiring legacy report paths, real metric compute.

## References

- Design specification sections: Architecture defaults; §3 Access; §4 IA; §6 Providers; §7 Packs; §9 Readiness; §10 Badges vs Certifications; §11 Events; §12 Snapshots; §20 Metrics catalogue; §25 Locked decisions.
- [`docs/analytics_tracking_plan.md`](../analytics_tracking_plan.md)
- [`docs/partner_analytics_plus_spec.md`](../partner_analytics_plus_spec.md)
- [`AGENTS.md`](../../AGENTS.md) — Product tenant, completion semantics, partner privacy constraints
