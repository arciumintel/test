/**
 * Pure section → markdown / html / csv fragments for Analytics export.
 * Use `import type` only for DTOs so this module stays free of server-only side effects.
 */

import type { ProductCourseMetric } from "@/lib/analytics";
import type { AnalyticsEngineResult } from "@/lib/analytics-engine";
import type { AnalyticsRecommendation } from "@/lib/analytics-recommendations";
import type { CertificationAnalytics } from "@/lib/certifications";
import type {
  ConceptCoverageSummary,
  ConceptMasteryRow,
} from "@/lib/concept-mastery";
import type { ExportSectionFragment } from "@/lib/analytics-export-types";
import {
  csvRow,
  escapeHtml,
  htmlTable,
  mdTable,
} from "@/lib/analytics-export-format";
import type { PartnerPlusCourseAnalytics } from "@/lib/partner-analytics";
import type { QuestionIntelligenceRow } from "@/lib/question-intelligence";
import type { ReadinessModelEval } from "@/lib/readiness-eval";

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return `${value}%`;
}

function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function metricDisplay(
  engine: AnalyticsEngineResult,
  id: string
): { label: string; value: string; deltaPct: number | null } {
  const m = engine.metricsById[id];
  if (!m || m.value === null) {
    return { label: id, value: "—", deltaPct: null };
  }
  const unitSuffix =
    m.unit === "percent" || m.unit === "score" ? "" : "";
  return {
    label: m.metricId,
    value: `${m.value}${unitSuffix}`,
    deltaPct: m.deltaPct ?? null,
  };
}

const OVERVIEW_KPI_IDS = [
  { id: "health_score", label: "Health score" },
  { id: "active_learners", label: "Learners started" },
  { id: "completion_rate", label: "Completion rate" },
  { id: "badges_awarded", label: "Badges awarded" },
  { id: "quiz_pass_rate", label: "Quiz pass rate" },
  { id: "start_conversion_rate", label: "Start conversion" },
] as const;

export function renderOverviewFragment(
  engine: AnalyticsEngineResult
): ExportSectionFragment {
  const { overview, recommendations } = engine;
  const kpiRows = OVERVIEW_KPI_IDS.map(({ id, label }) => {
    const m = metricDisplay(engine, id);
    const display =
      id === "completion_rate" ||
      id === "quiz_pass_rate" ||
      id === "start_conversion_rate"
        ? m.value === "—"
          ? "—"
          : `${m.value}%`
        : m.value;
    return [
      label,
      display,
      m.deltaPct === null ? "—" : `${m.deltaPct}%`,
    ];
  });

  const summaryRows: Array<[string, string]> = [
    ["Course starts", num(overview.summary.starts)],
    ["Completions", num(overview.summary.completions)],
    ["Completion rate", pct(overview.summary.completionRate)],
    ["Badge awards", num(overview.summary.badgeAwards)],
    ["Quiz pass rate", pct(overview.summary.quizPassRate)],
    ["Published courses", num(overview.summary.publishedCourses)],
    ["Project page views", num(overview.discovery.projectPageViews)],
    ["Course detail views", num(overview.discovery.courseDetailViews)],
    ["Start conversion", pct(overview.discovery.startConversionRate)],
    [
      "Badge verification views",
      num(overview.discovery.badgeVerificationViews),
    ],
  ];

  const funnelRows = overview.funnel.map((s) => [
    s.label,
    s.count,
    s.rateFromPrevious === null ? "—" : `${s.rateFromPrevious}%`,
  ]);

  const trendRows = overview.weeklyTrends.map((w) => [
    w.weekStart,
    w.starts,
    w.completions,
  ]);

  const cohorts = overview.cohorts ?? {
    cohorts: [],
    overallCompletionRatePct: null,
  };
  const cohortRows = cohorts.cohorts.map((c) => [
    c.weekStart,
    c.starters,
    c.completers,
    `${c.completionRatePct}%`,
  ]);

  const behaviour = overview.behaviour ?? {
    metrics: [],
    totalEngagementEvents: 0,
  };
  const behaviourRows = behaviour.metrics.map((m) => [m.label, m.count]);

  const topRecs = recommendations.slice(0, 5);
  const recRows = topRecs.map((r) => [
    r.priority,
    r.title,
    r.rationale,
  ]);

  const mdParts = [
    "### Executive KPIs",
    mdTable(["Metric", "Value", "Δ vs compare"], kpiRows),
    "",
    "### Performance & discovery",
    mdTable(["Metric", "Value"], summaryRows),
    "",
    "### Learning funnel",
    mdTable(["Step", "Count", "Rate from previous"], funnelRows),
    "",
    "### Weekly trends",
    mdTable(["Week starting", "Starts", "Completions"], trendRows),
    "",
    `### Cohorts${
      cohorts.overallCompletionRatePct !== null
        ? ` (overall ${cohorts.overallCompletionRatePct}%)`
        : ""
    }`,
    cohortRows.length > 0
      ? mdTable(
          ["Week start", "Starters", "Completers", "Completion %"],
          cohortRows
        )
      : "_No cohort data in this period._",
    "",
    "### Learning behaviour",
    behaviourRows.length > 0
      ? mdTable(["Event", "Count"], behaviourRows)
      : "_No behaviour events in this period._",
  ];

  if (overview.staffNotes) {
    mdParts.push("", "### Staff notes", overview.staffNotes);
  }

  mdParts.push(
    "",
    "### Top recommendations",
    recRows.length > 0
      ? mdTable(["Priority", "Title", "Rationale"], recRows)
      : "_No recommendations for this period._"
  );

  const htmlParts = [
    "<h3>Executive KPIs</h3>",
    htmlTable(["Metric", "Value", "Δ vs compare"], kpiRows),
    "<h3>Performance &amp; discovery</h3>",
    htmlTable(["Metric", "Value"], summaryRows),
    "<h3>Learning funnel</h3>",
    htmlTable(["Step", "Count", "Rate from previous"], funnelRows),
    "<h3>Weekly trends</h3>",
    htmlTable(["Week starting", "Starts", "Completions"], trendRows),
    `<h3>Cohorts${
      cohorts.overallCompletionRatePct !== null
        ? ` (overall ${cohorts.overallCompletionRatePct}%)`
        : ""
    }</h3>`,
    cohortRows.length > 0
      ? htmlTable(
          ["Week start", "Starters", "Completers", "Completion %"],
          cohortRows
        )
      : "<p><em>No cohort data in this period.</em></p>",
    "<h3>Learning behaviour</h3>",
    behaviourRows.length > 0
      ? htmlTable(["Event", "Count"], behaviourRows)
      : "<p><em>No behaviour events in this period.</em></p>",
  ];

  if (overview.staffNotes) {
    htmlParts.push(
      "<h3>Staff notes</h3>",
      `<p>${escapeHtml(overview.staffNotes)}</p>`
    );
  }

  htmlParts.push(
    "<h3>Top recommendations</h3>",
    recRows.length > 0
      ? htmlTable(["Priority", "Title", "Rationale"], recRows)
      : "<p><em>No recommendations for this period.</em></p>"
  );

  const csvParts = [
    csvRow(["block", "metric", "value", "delta_pct"]),
    ...OVERVIEW_KPI_IDS.map(({ id, label }) => {
      const m = metricDisplay(engine, id);
      return csvRow(["kpi", label, m.value, m.deltaPct]);
    }),
    ...summaryRows.map(([k, v]) => csvRow(["summary", k, v, ""])),
    "",
    csvRow(["funnel_step", "count", "rate_from_previous"]),
    ...overview.funnel.map((s) =>
      csvRow([s.label, s.count, s.rateFromPrevious])
    ),
    "",
    csvRow(["week_start", "starts", "completions"]),
    ...overview.weeklyTrends.map((w) =>
      csvRow([w.weekStart, w.starts, w.completions])
    ),
    "",
    csvRow(["cohort_week", "starters", "completers", "completion_pct"]),
    ...cohorts.cohorts.map((c) =>
      csvRow([c.weekStart, c.starters, c.completers, c.completionRatePct])
    ),
    "",
    csvRow(["behaviour_event", "count"]),
    ...behaviour.metrics.map((m) => csvRow([m.label, m.count])),
    "",
    csvRow(["rec_priority", "title", "rationale"]),
    ...topRecs.map((r) => csvRow([r.priority, r.title, r.rationale])),
  ];

  return {
    id: "overview",
    title: "Overview",
    markdown: mdParts.join("\n"),
    html: htmlParts.join("\n"),
    csv: csvParts.join("\n"),
  };
}

export function renderCoursesFragment(
  courses: ProductCourseMetric[]
): ExportSectionFragment {
  const rows = courses.map((c) => [
    c.title,
    c.starts,
    c.completions,
    c.badgeAwards,
    c.quizPassRate === null ? "n/a" : `${c.quizPassRate}%`,
    c.averageQuizScore === null ? "n/a" : `${c.averageQuizScore}%`,
  ]);

  return {
    id: "courses",
    title: "Courses",
    markdown: mdTable(
      ["Course", "Starts", "Completions", "Badges", "Quiz pass", "Avg score"],
      rows
    ),
    html: htmlTable(
      ["Course", "Starts", "Completions", "Badges", "Quiz pass", "Avg score"],
      rows
    ),
    csv: [
      csvRow([
        "course",
        "starts",
        "completions",
        "badges",
        "quiz_pass_pct",
        "avg_score",
      ]),
      ...courses.map((c) =>
        csvRow([
          c.title,
          c.starts,
          c.completions,
          c.badgeAwards,
          c.quizPassRate,
          c.averageQuizScore,
        ])
      ),
    ].join("\n"),
  };
}

export function renderCourseDetailFragment(
  course: PartnerPlusCourseAnalytics
): ExportSectionFragment {
  const completionRate =
    course.starts > 0
      ? Math.round((course.completions / course.starts) * 100)
      : 0;

  const summaryRows: Array<[string, string]> = [
    ["Course", course.title],
    ["Status", course.status],
    ["Starts", num(course.starts)],
    ["Completions", num(course.completions)],
    ["Completion rate", pct(completionRate)],
    ["Badge awards", num(course.badgeAwards)],
    ["Quiz pass rate", pct(course.quizPassRate)],
    ["Average quiz score", pct(course.averageQuizScore)],
    ["Badge verification views", num(course.badgeVerificationViews)],
  ];

  const missed = [...course.quizDiagnostics]
    .filter((q) => q.attemptCount > 0)
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, 10);

  const missRows = missed.map((q) => [
    `Q${q.order + 1}`,
    q.typeLabel,
    `${q.missRate}%`,
    q.attemptCount,
    q.prompt.slice(0, 120),
  ]);

  const attemptRows = course.attemptsBeforePass.map((b) => [
    b.label,
    b.count,
  ]);

  const md = [
    mdTable(["Metric", "Value"], summaryRows),
    "",
    "### Top missed questions",
    missRows.length > 0
      ? mdTable(
          ["Question", "Type", "Miss rate", "Attempts", "Prompt"],
          missRows
        )
      : "_No quiz attempts in this period._",
    "",
    "### Attempts before pass",
    attemptRows.length > 0
      ? mdTable(["Bucket", "Count"], attemptRows)
      : "_No pass data._",
  ].join("\n");

  const html = [
    htmlTable(["Metric", "Value"], summaryRows),
    "<h3>Top missed questions</h3>",
    missRows.length > 0
      ? htmlTable(
          ["Question", "Type", "Miss rate", "Attempts", "Prompt"],
          missRows
        )
      : "<p><em>No quiz attempts in this period.</em></p>",
    "<h3>Attempts before pass</h3>",
    attemptRows.length > 0
      ? htmlTable(["Bucket", "Count"], attemptRows)
      : "<p><em>No pass data.</em></p>",
  ].join("\n");

  const csv = [
    csvRow(["metric", "value"]),
    ...summaryRows.map(([k, v]) => csvRow([k, v])),
    "",
    csvRow(["question", "type", "miss_rate_pct", "attempts", "prompt"]),
    ...missed.map((q) =>
      csvRow([
        `Q${q.order + 1}`,
        q.typeLabel,
        q.missRate,
        q.attemptCount,
        q.prompt.slice(0, 200),
      ])
    ),
    "",
    csvRow(["attempts_before_pass_bucket", "count"]),
    ...course.attemptsBeforePass.map((b) => csvRow([b.label, b.count])),
  ].join("\n");

  return {
    id: "course",
    title: `Course: ${course.title}`,
    markdown: md,
    html,
    csv,
  };
}

export function renderConceptsFragment(input: {
  coverage: ConceptCoverageSummary;
  rows: ConceptMasteryRow[];
  gaps: ConceptMasteryRow[];
  backfillIncomplete: boolean;
}): ExportSectionFragment {
  const incompleteNote =
    "Concept mastery data is incomplete until QuestionAttempt backfill finishes. Treat mastery and gap figures as provisional.";

  const coverageRows: Array<[string, string]> = [
    ["Lesson tagged", `${input.coverage.lessonTagged} / ${input.coverage.lessonTotal}`],
    [
      "Question tagged",
      `${input.coverage.questionTagged} / ${input.coverage.questionTotal}`,
    ],
    ["Coverage", pct(input.coverage.coveragePct)],
  ];

  const masteryRows = input.rows.map((r) => [
    r.name,
    r.importance,
    r.category ?? "—",
    r.masteryPct === null ? "n/a" : `${r.masteryPct}%`,
    r.attemptCount,
    r.gapScore === null ? "—" : String(r.gapScore),
  ]);

  const gapRows = input.gaps.map((r) => [
    r.name,
    r.importance,
    r.masteryPct === null ? "n/a" : `${r.masteryPct}%`,
    r.gapScore === null ? "—" : String(r.gapScore),
  ]);

  const mdParts: string[] = [];
  if (input.backfillIncomplete) {
    mdParts.push(`> **Incomplete data:** ${incompleteNote}`, "");
  }
  mdParts.push(
    "### Tag coverage",
    mdTable(["Metric", "Value"], coverageRows),
    "",
    "### Concept mastery",
    masteryRows.length > 0
      ? mdTable(
          ["Concept", "Importance", "Category", "Mastery", "Attempts", "Gap"],
          masteryRows
        )
      : "_No concepts configured._",
    "",
    "### Knowledge gaps",
    gapRows.length > 0
      ? mdTable(["Concept", "Importance", "Mastery", "Gap score"], gapRows)
      : "_No knowledge gaps with attempts in this period._"
  );

  const htmlParts: string[] = [];
  if (input.backfillIncomplete) {
    htmlParts.push(
      `<p class="warning"><strong>Incomplete data:</strong> ${escapeHtml(incompleteNote)}</p>`
    );
  }
  htmlParts.push(
    "<h3>Tag coverage</h3>",
    htmlTable(["Metric", "Value"], coverageRows),
    "<h3>Concept mastery</h3>",
    masteryRows.length > 0
      ? htmlTable(
          ["Concept", "Importance", "Category", "Mastery", "Attempts", "Gap"],
          masteryRows
        )
      : "<p><em>No concepts configured.</em></p>",
    "<h3>Knowledge gaps</h3>",
    gapRows.length > 0
      ? htmlTable(["Concept", "Importance", "Mastery", "Gap score"], gapRows)
      : "<p><em>No knowledge gaps with attempts in this period.</em></p>"
  );

  const csvParts = [
    ...(input.backfillIncomplete
      ? [csvRow(["note", incompleteNote]), ""]
      : []),
    csvRow(["coverage_metric", "value"]),
    ...coverageRows.map(([k, v]) => csvRow([k, v])),
    "",
    csvRow([
      "concept",
      "importance",
      "category",
      "mastery_pct",
      "attempts",
      "gap_score",
    ]),
    ...input.rows.map((r) =>
      csvRow([
        r.name,
        r.importance,
        r.category,
        r.masteryPct,
        r.attemptCount,
        r.gapScore,
      ])
    ),
  ];

  return {
    id: "concepts",
    title: "Concepts",
    markdown: mdParts.join("\n"),
    html: htmlParts.join("\n"),
    csv: csvParts.join("\n"),
  };
}

export function renderAssessmentsFragment(input: {
  questions: QuestionIntelligenceRow[];
  backfillIncomplete: boolean;
}): ExportSectionFragment {
  const incompleteNote =
    "Assessment intelligence is incomplete until QuestionAttempt backfill finishes. Miss rates may be provisional.";

  const rows = input.questions.map((q) => [
    q.courseTitle,
    q.quizTitle,
    q.prompt.slice(0, 80),
    q.attemptCount,
    q.missRatePct === null ? "n/a" : `${q.missRatePct}%`,
    q.conceptNames.join("; ") || "—",
  ]);

  const mdParts: string[] = [];
  if (input.backfillIncomplete) {
    mdParts.push(`> **Incomplete data:** ${incompleteNote}`, "");
  }
  mdParts.push(
    rows.length > 0
      ? mdTable(
          [
            "Course",
            "Quiz",
            "Prompt",
            "Attempts",
            "Miss rate",
            "Concepts",
          ],
          rows
        )
      : "_No question attempts in this period._"
  );

  const htmlParts: string[] = [];
  if (input.backfillIncomplete) {
    htmlParts.push(
      `<p class="warning"><strong>Incomplete data:</strong> ${escapeHtml(incompleteNote)}</p>`
    );
  }
  htmlParts.push(
    rows.length > 0
      ? htmlTable(
          [
            "Course",
            "Quiz",
            "Prompt",
            "Attempts",
            "Miss rate",
            "Concepts",
          ],
          rows
        )
      : "<p><em>No question attempts in this period.</em></p>"
  );

  const csvParts = [
    ...(input.backfillIncomplete
      ? [csvRow(["note", incompleteNote]), ""]
      : []),
    csvRow([
      "course",
      "quiz",
      "prompt",
      "attempts",
      "miss_rate_pct",
      "concepts",
    ]),
    ...input.questions.map((q) =>
      csvRow([
        q.courseTitle,
        q.quizTitle,
        q.prompt.slice(0, 200),
        q.attemptCount,
        q.missRatePct,
        q.conceptNames.join("; "),
      ])
    ),
  ];

  return {
    id: "assessments",
    title: "Assessments",
    markdown: mdParts.join("\n"),
    html: htmlParts.join("\n"),
    csv: csvParts.join("\n"),
  };
}

export function renderReadinessFragment(
  models: ReadinessModelEval[]
): ExportSectionFragment {
  const defaultModel = models.find((m) => m.isDefault) ?? models[0];
  if (!defaultModel) {
    return {
      id: "readiness",
      title: "Readiness",
      markdown: "_No readiness model configured._",
      html: "<p><em>No readiness model configured.</em></p>",
      csv: csvRow(["note", "No readiness model configured."]),
    };
  }

  const summaryRows: Array<[string, string]> = [
    ["Model", defaultModel.name],
    ["Average score", num(defaultModel.averageScore)],
    ["Level", defaultModel.level?.label ?? "—"],
    ["Ready share", pct(defaultModel.readySharePct)],
    ["Learner sample", num(defaultModel.learnerSampleSize)],
    ["Ready threshold", num(defaultModel.readyThreshold)],
  ];

  const componentRows = defaultModel.components.map((c) => [
    c.label,
    c.weight,
    c.status,
    c.score === null ? "—" : String(c.score),
    c.setupMessage ?? "",
  ]);

  const otherModels = models.filter((m) => m.modelId !== defaultModel.modelId);

  const mdParts = [
    "### Default model",
    mdTable(["Metric", "Value"], summaryRows),
    "",
    "### Components",
    mdTable(
      ["Component", "Weight", "Status", "Score", "Setup note"],
      componentRows
    ),
  ];

  if (otherModels.length > 0) {
    mdParts.push(
      "",
      "### Other models",
      mdTable(
        ["Model", "Avg score", "Level", "Ready share"],
        otherModels.map((m) => [
          m.name,
          m.averageScore,
          m.level?.label ?? "—",
          m.readySharePct === null ? "—" : `${m.readySharePct}%`,
        ])
      )
    );
  }

  const htmlParts = [
    "<h3>Default model</h3>",
    htmlTable(["Metric", "Value"], summaryRows),
    "<h3>Components</h3>",
    htmlTable(
      ["Component", "Weight", "Status", "Score", "Setup note"],
      componentRows
    ),
  ];

  const csvParts = [
    csvRow(["metric", "value"]),
    ...summaryRows.map(([k, v]) => csvRow([k, v])),
    "",
    csvRow(["component", "weight", "status", "score", "setup_note"]),
    ...defaultModel.components.map((c) =>
      csvRow([c.label, c.weight, c.status, c.score, c.setupMessage ?? ""])
    ),
  ];

  return {
    id: "readiness",
    title: "Readiness",
    markdown: mdParts.join("\n"),
    html: htmlParts.join("\n"),
    csv: csvParts.join("\n"),
  };
}

export function renderCertificationsFragment(
  data: CertificationAnalytics
): ExportSectionFragment {
  const summaryRows: Array<[string, string]> = [
    ["Awards in range", num(data.awardsInRange)],
    ["Certificate views in range", num(data.certificateViewsInRange)],
    ["Learners started", num(data.learnersStarted)],
    ["Setup needed", data.setupNeeded ? "yes" : "no"],
  ];

  if (data.setupMessage) {
    summaryRows.push(["Setup message", data.setupMessage]);
  }

  const certRows = data.certifications.map((c) => [
    c.name,
    c.status,
    c.requirementCount,
    c.awardsInRange,
    c.awardsAllTime,
    c.attainmentRatePct === null ? "n/a" : `${c.attainmentRatePct}%`,
  ]);

  const funnelRows = data.funnel.map((s) => [
    s.label,
    s.count,
    s.rateFromPrevious === null ? "—" : `${s.rateFromPrevious}%`,
  ]);

  const md = [
    "### Summary",
    mdTable(["Metric", "Value"], summaryRows),
    "",
    "### Certifications",
    certRows.length > 0
      ? mdTable(
          [
            "Name",
            "Status",
            "Requirements",
            "Awards (range)",
            "Awards (all time)",
            "Attainment",
          ],
          certRows
        )
      : "_No certifications configured._",
    "",
    "### Funnel",
    funnelRows.length > 0
      ? mdTable(["Step", "Count", "Rate from previous"], funnelRows)
      : "_No certification funnel data._",
  ].join("\n");

  const html = [
    "<h3>Summary</h3>",
    htmlTable(["Metric", "Value"], summaryRows),
    "<h3>Certifications</h3>",
    certRows.length > 0
      ? htmlTable(
          [
            "Name",
            "Status",
            "Requirements",
            "Awards (range)",
            "Awards (all time)",
            "Attainment",
          ],
          certRows
        )
      : "<p><em>No certifications configured.</em></p>",
    "<h3>Funnel</h3>",
    funnelRows.length > 0
      ? htmlTable(["Step", "Count", "Rate from previous"], funnelRows)
      : "<p><em>No certification funnel data.</em></p>",
  ].join("\n");

  const csv = [
    csvRow(["metric", "value"]),
    ...summaryRows.map(([k, v]) => csvRow([k, v])),
    "",
    csvRow([
      "name",
      "status",
      "requirements",
      "awards_range",
      "awards_all_time",
      "attainment_pct",
    ]),
    ...data.certifications.map((c) =>
      csvRow([
        c.name,
        c.status,
        c.requirementCount,
        c.awardsInRange,
        c.awardsAllTime,
        c.attainmentRatePct,
      ])
    ),
  ].join("\n");

  return {
    id: "certifications",
    title: "Certifications",
    markdown: md,
    html,
    csv,
  };
}

export function renderRecommendationsFragment(
  recommendations: AnalyticsRecommendation[]
): ExportSectionFragment {
  const rows = recommendations.map((r) => [
    r.id,
    r.priority,
    r.category,
    r.title,
    r.rationale,
    r.evidenceLabel ?? "",
  ]);

  return {
    id: "recommendations",
    title: "Recommendations",
    markdown:
      rows.length > 0
        ? mdTable(
            ["Id", "Priority", "Category", "Title", "Rationale", "Evidence"],
            rows
          )
        : "_No recommendations for this period._",
    html:
      rows.length > 0
        ? htmlTable(
            ["Id", "Priority", "Category", "Title", "Rationale", "Evidence"],
            rows
          )
        : "<p><em>No recommendations for this period.</em></p>",
    csv: [
      csvRow([
        "id",
        "priority",
        "category",
        "title",
        "rationale",
        "evidence_label",
      ]),
      ...recommendations.map((r) =>
        csvRow([
          r.id,
          r.priority,
          r.category,
          r.title,
          r.rationale,
          r.evidenceLabel ?? "",
        ])
      ),
    ].join("\n"),
  };
}
