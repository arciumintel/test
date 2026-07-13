/**
 * Plain-language help copy for Partner Analytics V2.
 * Keep messages honest to current engine behavior (not aspirational catalogue wording).
 */

export type AnalyticsHelpEntry = {
  /** Optional short title shown above the body in the tooltip */
  title?: string;
  body: string;
};

export const ANALYTICS_HELP = {
  // —— Chrome ——
  period: {
    body: "Metrics only include activity that happened in this window. Choose a wider period if recommendations or cohorts look empty.",
  },
  compare_to: {
    body: "Deltas compare this period to the matching prior window (previous week, month, or quarter). Pick a comparison that matches how long your Period is so the % change is meaningful.",
  },
  vs_comparison: {
    body: "Change vs the Compare to window. “No prior period” means there isn’t enough earlier data to compare.",
  },
  snapshot_fresh: {
    title: "Up to date",
    body: "Numbers match the latest saved analytics snapshot for this period.",
  },
  snapshot_stale: {
    title: "Needs refresh",
    body: "Content or activity changed since the last build. Refresh to update.",
  },
  snapshot_building: {
    title: "Building",
    body: "Analytics is recalculating. Older numbers may show until this finishes.",
  },
  snapshot_queued: {
    title: "Queued",
    body: "Analytics is recalculating. Older numbers may show until this finishes.",
  },
  snapshot_error: {
    title: "Build failed",
    body: "The last snapshot build failed. Refresh to try again, or contact Arcademy staff if it keeps failing.",
  },
  snapshot_refresh: {
    body: "Rebuild analytics for the current period and comparison. Owners and staff can refresh; Analysts view the latest available snapshot.",
  },

  // —— Overview KPIs ——
  health_score: {
    body: "0–100 average of completion rate, quiz pass rate, and start conversion for this period. Higher usually means more learners finish and pass. It is not a platform-wide grade.",
  },
  learners_started: {
    body: "Distinct learners who started at least one of your published courses in this period.",
  },
  completion_rate: {
    body: "Share of starters who finished required lessons and passed the final quiz. This is not the same as earning a badge.",
  },
  badges_awarded: {
    body: "Course badges granted in this period. Badges mark progress on Arcademy; they are separate from certifications.",
  },
  quiz_pass_rate: {
    body: "Among learners who attempted a final quiz, the share who passed at least once.",
  },
  start_conversion: {
    body: "Course starts divided by course page views. Shows how many visitors who open a course actually begin it.",
  },

  // —— Overview panels ——
  learning_funnel: {
    body: "Each step counts tracked events in order. The % is this step’s events ÷ the previous step’s events — not unique people. Large drops point to where to investigate next.",
  },
  conversion_analytics: {
    body: "Partner-defined conversion outcomes (for example docs visit or community join) are deferred to Analytics V2. They are not tracked or shown in V1. Start conversion above is a separate learning-funnel metric and remains available.",
  },
  cohorts: {
    body: "Learners grouped by the week they first started. Completers here are learners who earned a course badge — useful as a retention signal, but not identical to the Completion rate above.",
  },
  learning_behaviour: {
    body: "Total engagement events in this period (lesson views, quiz starts, hints, glossary, search). These are counts of actions, not unique learners.",
  },

  // —— Course detail ——
  course_starts: {
    body: "Distinct learners who started this course in the selected period.",
  },
  course_completions: {
    body: "Learners who finished required lessons and passed the final quiz for this course.",
  },
  within_2_attempt_pass_rate: {
    body: "Share of quiz attempters who first passed on attempt 1 or 2. Low values often mean the quiz is too hard or unclear.",
  },
  drop_off_lesson: {
    body: "The lesson with the largest drop in completion vs the previous lesson among starters.",
  },
  avg_time_to_complete: {
    body: "Average time from quiz start to submit among completed attempts — not total time spent in the whole course.",
  },
  avg_quiz_score: {
    body: "Average quiz score across attempts in this period.",
  },
  avg_attempts_to_pass: {
    body: "Among learners who passed, how many tries they needed on average before the first pass.",
  },
  badge_verification_views: {
    body: "Times someone opened a public badge verification page for badges from your courses.",
  },

  // —— Concepts ——
  mastery: {
    body: "How often learners answer correctly on questions tagged with this concept (0–100%). Needs concept tags on questions to be reliable.",
  },
  gap_score: {
    body: "How urgent the concept is: importance weight × (1 − mastery). Critical concepts weigh more than supporting ones. Higher gap = fix content or assessments first.",
  },
  importance: {
    body: "How heavily this concept affects gap scoring. Critical ≈ 1.5×, core ≈ 1×, supporting ≈ 0.6×.",
  },
  concept_coverage: {
    body: "Untagged lessons and questions are invisible to mastery and gap scores. Tag content in Settings to unlock accurate concept analytics.",
  },

  // —— Assessments ——
  discrimination: {
    body: "How well this question separates strong and weak quiz performance. Higher usually means stronger learners get it right and weaker learners miss it. Near zero or negative can mean a confusing or mis-keyed item.",
  },
  miss_rate: {
    body: "Share of answered attempts that were incorrect.",
  },
  avg_time_on_question: {
    body: "Average time spent on this question per attempt.",
  },

  // —— Readiness ——
  readiness_average_score: {
    body: "Weighted mix of readiness components (0–100). Learners at or above the ready threshold are treated as ready.",
  },
  ready_threshold: {
    body: "Minimum readiness score to treat a learner as ready (default 70).",
  },
  readiness_components: {
    body: "If a component isn’t set up yet, it scores a neutral 50 so missing setup doesn’t crash the model — finish setup for a real signal.",
  },

  // —— Certifications ——
  attainment: {
    body: "Awards in this period (or all-time) divided by learners who started — how often starters earn this certification.",
  },
  certifications_configured: {
    body: "Count of certifications you published for this project — not a learner count.",
  },

  // —— Recommendations ——
  recommendation_priority: {
    body: "High/medium/low is urgency. Opportunity = likely problem; success = positive signal; trend = change vs the comparison window.",
  },

  // —— Settings ——
  settings_v2_flag: {
    body: "Turns on the multi-section analytics workspace (Overview through Recommendations). When off, your team sees the classic single-page Partner Analytics report.",
  },
  settings_terminology: {
    body: "Renames labels in analytics for your team. Does not change how metrics are calculated.",
  },
  settings_sections: {
    body: "Controls which analytics tabs appear. Hidden sections stay configured but are out of the nav.",
  },
  settings_kpi_set: {
    body: "Metric ids shown in custom KPI strips. Use catalogue ids like completion_rate — one per line. Leave default unless Arcademy guided you.",
  },
  settings_readiness_weights: {
    body: "Each component’s share of the readiness score. Weights should add up to 100%.",
  },
  settings_threshold_funnel_drop: {
    body: "Recommend action when a funnel step drops more than this % from the previous step.",
  },
  settings_threshold_completion: {
    body: "Recommend action when course completion rate falls below this %.",
  },
  settings_threshold_quiz_pass: {
    body: "Recommend action when quiz pass rate falls below this %.",
  },
  settings_threshold_critical_mastery: {
    body: "Recommend action when a critical concept’s mastery falls below this %.",
  },
  settings_threshold_miss_rate: {
    body: "Recommend action when a question’s miss rate rises above this %.",
  },
  settings_threshold_readiness: {
    body: "Recommend action when average readiness falls below this score.",
  },
  settings_custom_providers: {
    body: "Extra metric packs written for your project. Turn on only providers you understand; core analytics always runs.",
  },
  settings_packs: {
    body: "Install a curated starter setup (sections, concepts, thresholds). Overwrite labels replaces your custom terminology with the pack’s wording.",
  },
} as const satisfies Record<string, AnalyticsHelpEntry>;

export type AnalyticsHelpKey = keyof typeof ANALYTICS_HELP;

export function getAnalyticsHelp(key: AnalyticsHelpKey): AnalyticsHelpEntry {
  return ANALYTICS_HELP[key];
}

/** Human labels for analytics section ids shown in settings. */
export const ANALYTICS_SECTION_LABELS: Record<string, string> = {
  overview: "Overview",
  courses: "Courses",
  concepts: "Concepts",
  assessments: "Assessments",
  readiness: "Readiness",
  certifications: "Certifications",
  recommendations: "Recommendations",
  funnel: "Funnel",
  behaviour: "Behaviour",
  cohorts: "Cohorts",
  opportunity: "Opportunity",
  trends: "Trends",
};

export function analyticsSectionLabel(id: string): string {
  return (
    ANALYTICS_SECTION_LABELS[id] ??
    id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
