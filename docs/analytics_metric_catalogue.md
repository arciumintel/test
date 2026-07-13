# Analytics Metric Catalogue

Phase 0 freeze. Canonical registry stub: [`src/lib/analytics-metrics.ts`](../src/lib/analytics-metrics.ts).

Each metric is registered as:

```ts
{
  id: string
  category: MetricCategory
  formula: string
  inputs: string[]
  partnerSafe: boolean
  providerId: string
}
```

- **partnerSafe:** may appear on partner Analytics surfaces. Attribution, wallets, and cross-project identity metrics are `false`.
- **providerId:** `core` for shipped engine metrics; custom provider ids for partner-specific scores (Phase 5+).
- **Comparisons (V1):** every partner-safe KPI may expose `value`, `priorValue`, `delta`, `deltaPct` against historical baselines (week / month / quarter)—not other projects.

Completion rate uses **true course completion** (required lessons + final quiz pass), not badge awards. Badges and certifications are separate signals.

---

## Executive KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `health_score` | Weighted blend of profile `successMetrics` (0–100) | success metric values, profile weights | true | core |
| `active_learners` | Distinct learners with a course start in range | Progress / `course_started` | true | core |
| `completion_rate` | Completions / starts × 100 | course completion predicate, starts | true | core |
| `certification_rate` | Certification awards / eligible starters × 100 | CertificationAward, starts | true | core |
| `top_risk_id` | Highest-priority recommendation or gap id for the period | recommendations, gap scores | true | core |

## Learning KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `lesson_completion_rate` | Completed lesson progress rows / expected lesson starts | Progress | true | core |
| `required_lesson_completion_rate` | Required lessons completed / required lessons × learners started | Progress, Lesson.required | true | core |
| `quiz_pass_rate` | Learners with ≥1 pass / learners who attempted | QuizAttempt | true | core |
| `within_2_attempt_pass_rate` | Learners whose first pass is attempt ≤2 / attempters | QuizAttempt | true | core |
| `avg_score` | Mean QuizAttempt.score | QuizAttempt | true | core |
| `avg_attempts_to_pass` | Mean (first-pass attempt index + 1) among passers | QuizAttempt | true | core |
| `knowledge_check_pass_rate` | Pass rate on lesson knowledge checks | QuizAttempt (knowledge check) | true | core |

## Engagement KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `course_detail_views` | Count of `course_detail_viewed` | AnalyticsEvent | true | core |
| `start_conversion_rate` | Course starts / course detail views × 100 | starts, course_detail_viewed | true | core |
| `avg_session_depth` | Mean distinct lesson/course events per session | AnalyticsEvent.sessionId | true | core |
| `median_time_to_complete` | Median duration start → course completion | Progress, completion timestamps | true | core |
| `return_learner_rate` | Learners with activity on ≥2 distinct days / active learners | events / Progress | true | core |

## Partner KPIs

Profile-selected subset of catalogue metrics for the Partner KPI strip (`kpiSet` on Analytics Profile). Operational:

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `staff_notes_present` | 1 if Product.partnerAnalyticsNotes non-empty else 0 | Product | true | core |

## Badge KPIs (achievements / progress)

Distinct from certifications.

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `badges_awarded` | Count of BadgeAward in range | BadgeAward | true | core |
| `badge_award_rate` | Badge awards / course completions × 100 (or starts when configured) | BadgeAward, completions | true | core |
| `badge_verification_views` | Count of `badge_verification_viewed` | AnalyticsEvent | true | core |
| `badge_share_rate` | `badge_shared` / badges_awarded × 100 | AnalyticsEvent, BadgeAward | true | core |

## Certification KPIs (verified credentials)

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `certifications_awarded` | Count of CertificationAward in range | CertificationAward | true | core |
| `certification_rate` | Cert awards / eligible learners × 100 | CertificationAward, eligibility rules | true | core |
| `cert_requirement_attainment` | Per-requirement share of learners meeting each CertificationRequirement | CertificationRequirement, progress | true | core |
| `certificate_view_rate` | `certificate_viewed` / certifications_awarded × 100 | AnalyticsEvent, CertificationAward | true | core |
| `cert_level_attainment` | Distribution of learners by certification / level | CertificationAward, Certification | true | core |

## Conversion KPIs

> **Deferred to Analytics V2.** Partner-defined conversion keys (`conversion_triggered` /
> `conversionKey`, docs visit CTA outcomes, etc.) are not instrumented or shown in V1.
> Schema stubs (`ConversionDefinition`, catalogue ids below) remain for V2.
> Do not confuse with `start_conversion_rate` (course starts ÷ page views), which remains live.

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `conversion_count` | V2: Count of `conversion_triggered` (optionally by `conversionKey`) | AnalyticsEvent, ConversionDefinition | false (V1) | core |
| `conversion_rate` | V2: Conversions / starts (or / completers per definition) × 100 | conversions, starts/completions | false (V1) | core |

## Behaviour KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `avg_scroll_depth` | Mean max scroll depth % from `scroll_depth_reached` | AnalyticsEvent.metadata | true | core |
| `video_completion_rate` | `video_completed` / video starts × 100 | AnalyticsEvent | true | core |
| `hint_usage_rate` | Attempts with `hint_viewed` / quiz attempts × 100 | AnalyticsEvent, QuizAttempt | true | core |
| `retry_rate` | Learners with ≥2 quiz attempts / attempters × 100 | QuizAttempt | true | core |
| `glossary_lookups` | Count of `glossary_lookup` | AnalyticsEvent | true | core |
| `search_performed_count` | Count of `search_performed` | AnalyticsEvent | true | core |

## Concept KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `concept_mastery` | Weighted correct rate on QuestionAttempts for tagged concept (optional lesson prior) | QuestionAttempt, ContentConceptTag | true | core |
| `concept_coverage` | Tagged lessons+questions / total lessons+questions × 100 | ContentConceptTag, content counts | true | core |
| `gap_score` | importance_weight × (1 − concept_mastery) | concept_mastery, importance | true | core |

## Question KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `miss_rate` | Incorrect QuestionAttempts / answered × 100 | QuestionAttempt | true | core |
| `option_distribution` | Share of selections per option | QuestionAttempt.answerPayload | true | core |
| `avg_time_on_question` | Mean durationMs on QuestionAttempt | QuestionAttempt | true | core |
| `discrimination_proxy` | Correlation of item correctness with overall pass (Phase 2+) | QuestionAttempt, QuizAttempt | true | core |

## Readiness KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `readiness_score_avg` | Mean evaluated readiness score for Learning Readiness / active models | ReadinessModel eval | true | core |
| `readiness_level_distribution` | Counts per configured level | ReadinessModel eval | true | core |
| `requirement_attainment` | Per-requirement attainment share | readiness requirements | true | core |

## Retention / cohort KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `cohort_completion_rate` | Completions / starts for start-week cohort | Progress, completions | true | core |
| `week_n_return_rate` | Share of cohort active in week N after start | AnalyticsEvent / Progress | true | core |

## Funnel KPIs

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `funnel_stage_count` | Distinct sessions or events at configured stage | AnalyticsEvent, profile funnelStages | true | core |
| `funnel_stage_conversion` | stage[i] / stage[i−1] × 100 | funnel_stage_count | true | core |

## Staff-only / not partnerSafe (examples)

| id | formula | inputs | partnerSafe | providerId |
| --- | --- | --- | --- | --- |
| `utm_source_breakdown` | Event counts by utmSource | AnalyticsEvent | false | core |
| `referrer_domain_breakdown` | Event counts by referrer host | AnalyticsEvent | false | core |
| `referral_click_count` | Count of `ecosystem_project_referral_clicked` | AnalyticsEvent | false | core |

## Custom provider metrics (examples — not shipped compute)

Registered only when a custom provider is enabled on a Product. Illustrative ids:

| id | category | partnerSafe | providerId |
| --- | --- | --- | --- |
| `developer_activation_score` | partner | true | custom (e.g. `partner.developer_activation`) |
| `sdk_adoption_score` | partner | true | custom |
| `protocol_usage_score` | partner | true | custom |
| `validator_readiness_score` | readiness | true | custom |
| `governance_participation_score` | partner | true | custom |

## Business value (by category)

- **Executive:** time-to-decision; one health number + top risk.
- **Learning / Concept / Question:** improve teaching and assessment quality.
- **Engagement / Behaviour / Funnel:** reduce onboarding friction.
- **Badge:** celebrate progress; not competency claims.
- **Certification / Readiness:** prove pipeline quality and competency.
- **Conversion:** tie education to partner GTM outcomes.
- **Retention:** detect regressions across cohorts.
