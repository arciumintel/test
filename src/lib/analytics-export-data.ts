/**
 * Server-only export data loader — gathers the same aggregates as Analytics pages.
 */

import "server-only";

import type {
  AnalyticsCompareBaseline,
  AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import { resolveAnalyticsDateRange } from "@/lib/analytics-date-range";
import type { AnalyticsEngineResult } from "@/lib/analytics-engine";
import {
  renderAssessmentsFragment,
  renderCertificationsFragment,
  renderConceptsFragment,
  renderCourseDetailFragment,
  renderCoursesFragment,
  renderOverviewFragment,
  renderReadinessFragment,
  renderRecommendationsFragment,
} from "@/lib/analytics-export-sections";
import type {
  AnalyticsExportScope,
  ExportSectionFragment,
} from "@/lib/analytics-export-types";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { getAnalyticsEngineView } from "@/lib/analytics-snapshots";
import { getCertificationAnalytics } from "@/lib/certifications";
import {
  getConceptCoverage,
  getConceptMasteryRows,
  rankKnowledgeGaps,
} from "@/lib/concept-mastery";
import { getPartnerPlusCourseAnalytics } from "@/lib/partner-analytics";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";
import { getQuestionIntelligenceRows } from "@/lib/question-intelligence";
import { evaluateReadinessModels } from "@/lib/readiness-eval";

export type LoadedExportBundle = {
  productName: string;
  rangeLabel: string;
  v2Enabled: boolean;
  /** When v2Enabled is false, callers may use legacy Plus serializers instead. */
  engine: AnalyticsEngineResult | null;
  fragments: ExportSectionFragment[];
};

async function buildV2Fragments(input: {
  productId: string;
  scope: AnalyticsExportScope;
  rangePreset: AnalyticsRangePreset;
  engine: AnalyticsEngineResult;
  courseId?: string;
}): Promise<ExportSectionFragment[] | null> {
  const range = resolveAnalyticsDateRange(input.rangePreset);
  const fragments: ExportSectionFragment[] = [];

  async function pushOverview() {
    fragments.push(renderOverviewFragment(input.engine));
  }
  async function pushCourses() {
    fragments.push(renderCoursesFragment(input.engine.courses));
  }
  async function pushConcepts() {
    const backfill = await getQuestionAttemptBackfillStatus();
    const [coverage, rows] = await Promise.all([
      getConceptCoverage(input.productId),
      getConceptMasteryRows(input.productId, range),
    ]);
    fragments.push(
      renderConceptsFragment({
        coverage,
        rows,
        gaps: rankKnowledgeGaps(rows),
        backfillIncomplete: !backfill.complete,
      })
    );
  }
  async function pushAssessments() {
    const backfill = await getQuestionAttemptBackfillStatus();
    const questions = await getQuestionIntelligenceRows(
      input.productId,
      range,
      { minAttempts: 1, limit: 100 }
    );
    fragments.push(
      renderAssessmentsFragment({
        questions,
        backfillIncomplete: !backfill.complete,
      })
    );
  }
  async function pushReadiness() {
    const models = await evaluateReadinessModels(input.productId, range);
    fragments.push(renderReadinessFragment(models));
  }
  async function pushCertifications() {
    const certs = await getCertificationAnalytics(input.productId, range);
    fragments.push(renderCertificationsFragment(certs));
  }
  async function pushRecommendations() {
    fragments.push(
      renderRecommendationsFragment(input.engine.recommendations)
    );
  }

  if (input.scope === "full") {
    await pushOverview();
    await pushCourses();
    await pushConcepts();
    await pushAssessments();
    await pushReadiness();
    await pushCertifications();
    await pushRecommendations();
    return fragments;
  }

  if (input.scope === "overview") {
    await pushOverview();
    return fragments;
  }
  if (input.scope === "courses") {
    await pushCourses();
    return fragments;
  }
  if (input.scope === "course") {
    if (!input.courseId) return null;
    const course = await getPartnerPlusCourseAnalytics(
      input.productId,
      input.courseId,
      range
    );
    if (!course) return null;
    fragments.push(renderCourseDetailFragment(course));
    return fragments;
  }
  if (input.scope === "concepts") {
    await pushConcepts();
    return fragments;
  }
  if (input.scope === "assessments") {
    await pushAssessments();
    return fragments;
  }
  if (input.scope === "readiness") {
    await pushReadiness();
    return fragments;
  }
  if (input.scope === "certifications") {
    await pushCertifications();
    return fragments;
  }
  if (input.scope === "recommendations") {
    await pushRecommendations();
    return fragments;
  }

  return fragments;
}

export async function loadAnalyticsExportBundle(input: {
  productId: string;
  scope: AnalyticsExportScope;
  rangePreset: AnalyticsRangePreset;
  compareBaseline: AnalyticsCompareBaseline;
  courseId?: string;
}): Promise<LoadedExportBundle | null> {
  const v2Enabled = await isAnalyticsV2Enabled(input.productId);

  const view = await getAnalyticsEngineView({
    productId: input.productId,
    preset: input.rangePreset,
    compare: input.compareBaseline,
    allowLiveFallback: true,
  });
  const engine = view.data;
  if (!engine) return null;

  const rangeLabel = engine.range.label;

  if (!v2Enabled) {
    return {
      productName: engine.productName,
      rangeLabel,
      v2Enabled: false,
      engine,
      fragments: [],
    };
  }

  const fragments = await buildV2Fragments({
    productId: input.productId,
    scope: input.scope,
    rangePreset: input.rangePreset,
    engine,
    courseId: input.courseId,
  });
  if (!fragments) return null;

  return {
    productName: engine.productName,
    rangeLabel,
    v2Enabled: true,
    engine,
    fragments,
  };
}
