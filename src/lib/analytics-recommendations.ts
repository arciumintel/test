/**
 * Rule-based recommendations v2 — explainable, Owner-editable thresholds,
 * evidence links into Analytics sections.
 */

export type AnalyticsRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  category: "opportunity" | "success" | "trend";
  title: string;
  rationale: string;
  evidenceMetricIds: string[];
  /** Deep link into Overview / Courses / Concepts / Assessments / Readiness / Certifications. */
  href: string;
  evidenceLabel?: string;
};

export type RecommendationPolicy = {
  funnelStageConversionMinPct?: number;
  criticalConceptMasteryMinPct?: number;
  questionMissRateMaxPct?: number;
  completionRateMinPct?: number;
  minVolumeForAlerts?: number;
  readinessScoreMin?: number;
  certificationAttainmentMinPct?: number;
};

type MetricMap = Record<
  string,
  { value: number | null; deltaPct?: number | null }
>;

export type RecommendationContext = {
  productId: string;
  metrics: MetricMap;
  funnel?: Array<{ label: string; count: number; rateFromPrevious: number | null }>;
  policy: RecommendationPolicy;
  /** Optional Phase 4 signals. */
  criticalConceptMasteryPct?: number | null;
  topQuestionMissRatePct?: number | null;
  readinessAverageScore?: number | null;
  readinessSetupNeeded?: boolean;
  certificationCount?: number;
  certificationAttainmentPct?: number | null;
  conversionSetupNeeded?: boolean;
};

export function buildAnalyticsRecommendations(
  input: RecommendationContext
): AnalyticsRecommendation[] {
  const {
    productId,
    metrics,
    funnel = [],
    policy,
    criticalConceptMasteryPct = null,
    topQuestionMissRatePct = null,
    readinessAverageScore = null,
    readinessSetupNeeded = false,
    certificationCount = 0,
    certificationAttainmentPct = null,
    conversionSetupNeeded = false,
  } = input;

  const minVol = policy.minVolumeForAlerts ?? 10;
  const completionMin = policy.completionRateMinPct ?? 20;
  const funnelMin = policy.funnelStageConversionMinPct ?? 50;
  const masteryMin = policy.criticalConceptMasteryMinPct ?? 60;
  const missMax = policy.questionMissRateMaxPct ?? 40;
  const readinessMin = policy.readinessScoreMin ?? 50;
  const certMin = policy.certificationAttainmentMinPct ?? 10;

  const recs: AnalyticsRecommendation[] = [];
  const base = `/partner-console/${productId}/analytics`;

  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1];
    const curr = funnel[i];
    if (
      prev.count >= minVol &&
      curr.rateFromPrevious !== null &&
      curr.rateFromPrevious < funnelMin
    ) {
      recs.push({
        id: `funnel-drop-${i}`,
        priority: "high",
        category: "opportunity",
        title: `Improve conversion after “${prev.label}”`,
        rationale: `Only ${curr.rateFromPrevious}% continue to “${curr.label}” (threshold ${funnelMin}%).`,
        evidenceMetricIds: ["funnel_stage_conversion", "start_conversion_rate"],
        href: `${base}`,
        evidenceLabel: "Overview · Learning funnel",
      });
      break;
    }
  }

  const completion = metrics.completion_rate?.value;
  const starts = metrics.active_learners?.value ?? 0;
  if (
    completion !== null &&
    completion !== undefined &&
    starts >= minVol &&
    completion < completionMin
  ) {
    recs.push({
      id: "low-completion",
      priority: "high",
      category: "opportunity",
      title: "Raise course completion rate",
      rationale: `Completion is ${completion}% of starts (threshold ${completionMin}%).`,
      evidenceMetricIds: ["completion_rate", "active_learners"],
      href: `${base}/courses`,
      evidenceLabel: "Courses",
    });
  }

  const quizPass = metrics.quiz_pass_rate?.value;
  if (
    quizPass !== null &&
    quizPass !== undefined &&
    quizPass < 50 &&
    starts >= minVol
  ) {
    recs.push({
      id: "low-quiz-pass",
      priority: "medium",
      category: "opportunity",
      title: "Review quiz difficulty",
      rationale: `Average quiz pass rate is ${quizPass}%. Check assessments and lesson coverage.`,
      evidenceMetricIds: ["quiz_pass_rate"],
      href: `${base}/assessments`,
      evidenceLabel: "Assessments",
    });
  }

  if (
    criticalConceptMasteryPct !== null &&
    criticalConceptMasteryPct < masteryMin &&
    starts >= minVol
  ) {
    recs.push({
      id: "low-concept-mastery",
      priority: "high",
      category: "opportunity",
      title: "Improve critical concept mastery",
      rationale: `Critical concept mastery is ${criticalConceptMasteryPct}% (threshold ${masteryMin}%).`,
      evidenceMetricIds: ["concept_mastery"],
      href: `${base}/concepts`,
      evidenceLabel: "Concepts · Knowledge gaps",
    });
  }

  if (
    topQuestionMissRatePct !== null &&
    topQuestionMissRatePct > missMax &&
    starts >= minVol
  ) {
    recs.push({
      id: "high-miss-rate",
      priority: "medium",
      category: "opportunity",
      title: "Fix high-miss assessment items",
      rationale: `Top miss rate is ${topQuestionMissRatePct}% (max ${missMax}%). Review distractors and teaching.`,
      evidenceMetricIds: ["miss_rate"],
      href: `${base}/assessments`,
      evidenceLabel: "Assessments · Question intelligence",
    });
  }

  if (readinessSetupNeeded) {
    recs.push({
      id: "readiness-setup",
      priority: "medium",
      category: "opportunity",
      title: "Complete readiness setup",
      rationale:
        "Some Learning Readiness components need conversions or learning paths before scores are meaningful.",
      evidenceMetricIds: ["readiness_score_avg"],
      href: `${base}/readiness`,
      evidenceLabel: "Readiness",
    });
  } else if (
    readinessAverageScore !== null &&
    readinessAverageScore < readinessMin &&
    starts >= minVol
  ) {
    recs.push({
      id: "low-readiness",
      priority: "medium",
      category: "opportunity",
      title: "Raise learning readiness",
      rationale: `Average readiness is ${readinessAverageScore} (threshold ${readinessMin}).`,
      evidenceMetricIds: ["readiness_score_avg"],
      href: `${base}/readiness`,
      evidenceLabel: "Readiness",
    });
  }

  if (certificationCount === 0) {
    recs.push({
      id: "cert-setup",
      priority: "low",
      category: "opportunity",
      title: "Define a certification",
      rationale:
        "Certifications are distinct from badges. Configure requirements to track competency credentials.",
      evidenceMetricIds: ["certifications_awarded"],
      href: `${base}/certifications`,
      evidenceLabel: "Certifications",
    });
  } else if (
    certificationAttainmentPct !== null &&
    certificationAttainmentPct < certMin &&
    starts >= minVol
  ) {
    recs.push({
      id: "low-cert-attainment",
      priority: "medium",
      category: "opportunity",
      title: "Improve certification attainment",
      rationale: `Certification attainment is ${certificationAttainmentPct}% (threshold ${certMin}%).`,
      evidenceMetricIds: ["certification_rate"],
      href: `${base}/certifications`,
      evidenceLabel: "Certifications",
    });
  }

  if (conversionSetupNeeded) {
    recs.push({
      id: "conversion-setup",
      priority: "low",
      category: "opportunity",
      title: "Define partner conversions",
      rationale:
        "Conversion analytics and readiness conversion components need at least one conversion definition.",
      evidenceMetricIds: ["conversion_rate"],
      href: `${base}/settings`,
      evidenceLabel: "Analytics settings",
    });
  }

  const completionDelta = metrics.completion_rate?.deltaPct;
  if (
    completionDelta !== null &&
    completionDelta !== undefined &&
    completionDelta >= 10
  ) {
    recs.push({
      id: "completion-up",
      priority: "low",
      category: "success",
      title: "Completion rate improved",
      rationale: `Completion is up ${completionDelta}% vs the comparison period.`,
      evidenceMetricIds: ["completion_rate"],
      href: `${base}/courses`,
      evidenceLabel: "Courses",
    });
  }

  const healthDelta = metrics.health_score?.deltaPct;
  if (
    healthDelta !== null &&
    healthDelta !== undefined &&
    healthDelta <= -15
  ) {
    recs.push({
      id: "health-down",
      priority: "medium",
      category: "trend",
      title: "Health score declining",
      rationale: `Overall health dropped ${Math.abs(healthDelta)}% vs the comparison period.`,
      evidenceMetricIds: ["health_score"],
      href: `${base}`,
      evidenceLabel: "Overview",
    });
  }

  const badgesDelta = metrics.badges_awarded?.deltaPct;
  if (badgesDelta !== null && badgesDelta !== undefined && badgesDelta >= 20) {
    recs.push({
      id: "badges-up",
      priority: "low",
      category: "success",
      title: "Badge awards rising",
      rationale: `Badge awards (progress signals) are up ${badgesDelta}% vs comparison. Certifications remain separate.`,
      evidenceMetricIds: ["badges_awarded"],
      href: `${base}/courses`,
      evidenceLabel: "Courses · Progress",
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  return recs
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 12);
}
