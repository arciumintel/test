/**
 * Analytics metric catalogue (Phase 0 stub).
 *
 * Registry of metric definitions only — no compute.
 * @see docs/analytics_metric_catalogue.md
 * @see docs/adr/2026-07-13-configurable-analytics-platform.md
 */

export const METRIC_CATEGORIES = [
  "executive",
  "learning",
  "engagement",
  "partner",
  "badge",
  "certification",
  "conversion",
  "behaviour",
  "concept",
  "question",
  "readiness",
  "retention",
  "funnel",
  "staff",
] as const;

export type MetricCategory = (typeof METRIC_CATEGORIES)[number];

export type MetricDefinition = {
  id: string;
  category: MetricCategory;
  /** Human-readable formula description (not executable). */
  formula: string;
  /** Named inputs / data sources required to compute. */
  inputs: string[];
  /** When false, must not appear on partner Analytics surfaces. */
  partnerSafe: boolean;
  /** `core` or a custom provider id. */
  providerId: string;
};

/** Core provider id — shipped engine metrics. */
export const CORE_PROVIDER_ID = "core" as const;

export const METRIC_CATALOGUE: readonly MetricDefinition[] = [
  // Executive
  {
    id: "health_score",
    category: "executive",
    formula: "Weighted blend of profile successMetrics (0–100)",
    inputs: ["successMetricValues", "profile.successMetrics"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "active_learners",
    category: "executive",
    formula: "Distinct learners with a course start in range",
    inputs: ["Progress", "course_started"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "completion_rate",
    category: "executive",
    formula: "Course completions / starts × 100 (true completion, not badges)",
    inputs: ["courseCompletion", "starts"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "certification_rate",
    category: "executive",
    formula: "Certification awards / eligible starters × 100",
    inputs: ["CertificationAward", "starts"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "top_risk_id",
    category: "executive",
    formula: "Highest-priority recommendation or gap id for the period",
    inputs: ["recommendations", "gap_score"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Learning
  {
    id: "lesson_completion_rate",
    category: "learning",
    formula: "Completed lesson progress rows / expected lesson starts",
    inputs: ["Progress"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "required_lesson_completion_rate",
    category: "learning",
    formula: "Required lessons completed / required lessons among starters",
    inputs: ["Progress", "Lesson.required"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "quiz_pass_rate",
    category: "learning",
    formula: "Learners with ≥1 pass / learners who attempted",
    inputs: ["QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "within_2_attempt_pass_rate",
    category: "learning",
    formula: "Learners whose first pass is attempt ≤2 / attempters",
    inputs: ["QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "avg_score",
    category: "learning",
    formula: "Mean QuizAttempt.score",
    inputs: ["QuizAttempt.score"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "avg_attempts_to_pass",
    category: "learning",
    formula: "Mean (first-pass attempt index + 1) among passers",
    inputs: ["QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "knowledge_check_pass_rate",
    category: "learning",
    formula: "Pass rate on lesson knowledge checks",
    inputs: ["QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Engagement
  {
    id: "course_detail_views",
    category: "engagement",
    formula: "Count of course_detail_viewed",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "start_conversion_rate",
    category: "engagement",
    formula: "Course starts / course detail views × 100",
    inputs: ["starts", "course_detail_viewed"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "avg_session_depth",
    category: "engagement",
    formula: "Mean distinct lesson/course events per session",
    inputs: ["AnalyticsEvent.sessionId"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "median_time_to_complete",
    category: "engagement",
    formula: "Median duration from start to course completion",
    inputs: ["Progress", "courseCompletion"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "return_learner_rate",
    category: "engagement",
    formula: "Learners active on ≥2 distinct days / active learners",
    inputs: ["AnalyticsEvent", "Progress"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Partner / ops
  {
    id: "staff_notes_present",
    category: "partner",
    formula: "1 if Product.partnerAnalyticsNotes non-empty else 0",
    inputs: ["Product.partnerAnalyticsNotes"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Badge KPIs (achievements — not certifications)
  {
    id: "badges_awarded",
    category: "badge",
    formula: "Count of BadgeAward in range",
    inputs: ["BadgeAward"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "badge_award_rate",
    category: "badge",
    formula: "Badge awards / course completions × 100",
    inputs: ["BadgeAward", "courseCompletion"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "badge_verification_views",
    category: "badge",
    formula: "Count of badge_verification_viewed",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "badge_share_rate",
    category: "badge",
    formula: "badge_shared / badges_awarded × 100",
    inputs: ["AnalyticsEvent", "BadgeAward"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Certification KPIs (verified credentials — not badges)
  {
    id: "certifications_awarded",
    category: "certification",
    formula: "Count of CertificationAward in range",
    inputs: ["CertificationAward"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "cert_requirement_attainment",
    category: "certification",
    formula: "Per-requirement share of learners meeting each requirement",
    inputs: ["CertificationRequirement", "Progress", "QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "certificate_view_rate",
    category: "certification",
    formula: "certificate_viewed / certifications_awarded × 100",
    inputs: ["AnalyticsEvent", "CertificationAward"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "cert_level_attainment",
    category: "certification",
    formula: "Distribution of learners by certification level",
    inputs: ["CertificationAward", "Certification"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Conversion
  {
    id: "conversion_count",
    category: "conversion",
    formula: "Count of conversion_triggered (by conversionKey when set)",
    inputs: ["AnalyticsEvent", "ConversionDefinition"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "conversion_rate",
    category: "conversion",
    formula: "Conversions / starts (or completers per definition) × 100",
    inputs: ["conversion_count", "starts", "courseCompletion"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Behaviour
  {
    id: "avg_scroll_depth",
    category: "behaviour",
    formula: "Mean max scroll depth % from scroll_depth_reached",
    inputs: ["AnalyticsEvent.metadata"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "video_completion_rate",
    category: "behaviour",
    formula: "video_completed / video starts × 100",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "hint_usage_rate",
    category: "behaviour",
    formula: "Attempts with hint_viewed / quiz attempts × 100",
    inputs: ["AnalyticsEvent", "QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "retry_rate",
    category: "behaviour",
    formula: "Learners with ≥2 quiz attempts / attempters × 100",
    inputs: ["QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "glossary_lookups",
    category: "behaviour",
    formula: "Count of glossary_lookup",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "search_performed_count",
    category: "behaviour",
    formula: "Count of search_performed",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "lesson_engagement_rate",
    category: "behaviour",
    formula: "lesson_completed / lesson_viewed × 100 (custom provider example)",
    inputs: ["AnalyticsEvent"],
    partnerSafe: true,
    providerId: "example_engagement",
  },

  // Concept
  {
    id: "concept_mastery",
    category: "concept",
    formula:
      "Weighted correct rate on QuestionAttempts for tagged concept (optional lesson prior)",
    inputs: ["QuestionAttempt", "ContentConceptTag"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "concept_coverage",
    category: "concept",
    formula: "Tagged lessons+questions / total lessons+questions × 100",
    inputs: ["ContentConceptTag", "Lesson", "Question"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "gap_score",
    category: "concept",
    formula: "importance_weight × (1 − concept_mastery)",
    inputs: ["concept_mastery", "importance"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Question
  {
    id: "miss_rate",
    category: "question",
    formula: "Incorrect QuestionAttempts / answered × 100",
    inputs: ["QuestionAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "option_distribution",
    category: "question",
    formula: "Share of selections per option",
    inputs: ["QuestionAttempt.answerPayload"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "avg_time_on_question",
    category: "question",
    formula: "Mean durationMs on QuestionAttempt",
    inputs: ["QuestionAttempt.durationMs"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "discrimination_proxy",
    category: "question",
    formula: "Correlation of item correctness with overall pass",
    inputs: ["QuestionAttempt", "QuizAttempt"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Readiness
  {
    id: "readiness_score_avg",
    category: "readiness",
    formula: "Mean evaluated readiness score for active models",
    inputs: ["ReadinessModel"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "readiness_level_distribution",
    category: "readiness",
    formula: "Counts per configured readiness level",
    inputs: ["ReadinessModel"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "requirement_attainment",
    category: "readiness",
    formula: "Per-requirement attainment share",
    inputs: ["ReadinessModel.requirements"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Retention
  {
    id: "cohort_completion_rate",
    category: "retention",
    formula: "Completions / starts for start-week cohort",
    inputs: ["Progress", "courseCompletion"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "week_n_return_rate",
    category: "retention",
    formula: "Share of cohort active in week N after start",
    inputs: ["AnalyticsEvent", "Progress"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Funnel
  {
    id: "funnel_stage_count",
    category: "funnel",
    formula: "Distinct sessions or events at configured funnel stage",
    inputs: ["AnalyticsEvent", "profile.funnelStages"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "funnel_stage_conversion",
    category: "funnel",
    formula: "stage[i] / stage[i−1] × 100",
    inputs: ["funnel_stage_count"],
    partnerSafe: true,
    providerId: CORE_PROVIDER_ID,
  },

  // Staff-only (not partnerSafe)
  {
    id: "utm_source_breakdown",
    category: "staff",
    formula: "Event counts by utmSource",
    inputs: ["AnalyticsEvent.utmSource"],
    partnerSafe: false,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "referrer_domain_breakdown",
    category: "staff",
    formula: "Event counts by referrer host",
    inputs: ["AnalyticsEvent.referrer"],
    partnerSafe: false,
    providerId: CORE_PROVIDER_ID,
  },
  {
    id: "referral_click_count",
    category: "staff",
    formula: "Count of ecosystem_project_referral_clicked",
    inputs: ["AnalyticsEvent"],
    partnerSafe: false,
    providerId: CORE_PROVIDER_ID,
  },
] as const;

export type MetricId = (typeof METRIC_CATALOGUE)[number]["id"];

export function getMetricDefinition(id: string): MetricDefinition | undefined {
  return METRIC_CATALOGUE.find((m) => m.id === id);
}

export function listPartnerSafeMetrics(): MetricDefinition[] {
  return METRIC_CATALOGUE.filter((m) => m.partnerSafe);
}

export function listMetricsByCategory(
  category: MetricCategory
): MetricDefinition[] {
  return METRIC_CATALOGUE.filter((m) => m.category === category);
}

export function listMetricsByProvider(providerId: string): MetricDefinition[] {
  return METRIC_CATALOGUE.filter((m) => m.providerId === providerId);
}
