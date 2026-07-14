# V2 Contextual Analytics Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make partner Analytics exports match the V2 UI sections (narrative HTML/Markdown first, CSV always available) via contextual “Export this view” plus an Overview full pack—without adding Export to the Analytics subnav.

**Architecture:** Split export into (1) pure section serializers (DTO → MD/HTML/CSV fragments), (2) a server-only data loader that gathers the same aggregates as each Analytics page, and (3) an orchestrator that composes fragments by `scope`. Reuse `getAnalyticsEngineView` for overview/courses/recommendations when a fresh snapshot exists; call section libs directly for concepts/assessments/readiness/certifications. Keep Plus-shaped export when `analyticsV2` is off.

**Tech Stack:** Next.js App Router · existing Zod server actions · `analytics-html-report` helpers · Node built-in `node:test` via `tsx` (no new test runner dependency)

**Spec:** [`docs/features/v2-contextual-analytics-export.md`](../../features/v2-contextual-analytics-export.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/analytics-export-types.ts` | **Create.** `AnalyticsExportScope`, shared meta, fragment types |
| `src/lib/analytics-export-format.ts` | **Create.** Pure CSV escape, MD tables, HTML section wrappers, privacy footer |
| `src/lib/analytics-export-sections.ts` | **Create.** Pure renderers: each section DTO → `{ markdown, html, csv }` |
| `src/lib/analytics-export-data.ts` | **Create.** Server-only `loadAnalyticsExportBundle(scope, …)` |
| `src/lib/analytics-export.ts` | **Modify.** Orchestrate scope → format; V2-off Plus fallback |
| `scripts/analytics-export-format.test.ts` | **Create.** `node:test` coverage for pure formatters/serializers |
| `src/app/actions/analytics-v2.ts` | **Modify.** Zod `scope` + `courseId`; telemetry metadata |
| `src/components/.../analytics-export-action.tsx` | **Modify.** `scope`, format order HTML→MD→CSV, Overview “Complete pack” |
| `src/components/.../partner-analytics-export-panel.tsx` | **Modify or delete usage.** Prefer single `AnalyticsExportAction`; retire panel if unused |
| Partner Analytics pages (overview already wired; add Concepts/Assessments/Readiness/Certifications; pass `scope` everywhere) | **Modify.** |
| `docs/features/v2-contextual-analytics-export.md` | **Modify.** Mark acceptance items done as they land (optional at end) |

**Do not modify:** `analytics-subnav.tsx` (no Export nav item). Concept/question drill-down pages.

---

## Recommended task order

```
Task 1  Types + pure format helpers + tests
Task 2  Section serializers (pure) + tests
Task 3  Data loader (server-only)
Task 4  Orchestrator (buildAnalyticsExport)
Task 5  Server action + telemetry
Task 6  AnalyticsExportAction UI
Task 7  Wire section pages + scopes
Task 8  Manual QA + brief acceptance checkboxes
```

---

### Task 1: Types and pure format helpers

**Files:**
- Create: `src/lib/analytics-export-types.ts`
- Create: `src/lib/analytics-export-format.ts`
- Create: `scripts/analytics-export-format.test.ts`

- [ ] **Step 1: Add shared types**

```typescript
// src/lib/analytics-export-types.ts
export const ANALYTICS_EXPORT_SCOPES = [
  "overview",
  "courses",
  "course",
  "concepts",
  "assessments",
  "readiness",
  "certifications",
  "recommendations",
  "full",
] as const;

export type AnalyticsExportScope = (typeof ANALYTICS_EXPORT_SCOPES)[number];

export type AnalyticsExportFormat = "markdown" | "csv" | "html";

export type AnalyticsExportMeta = {
  productId: string;
  productName: string;
  rangeLabel: string;
  rangePreset: string;
  compareBaseline: string;
  generatedAt: string; // ISO date YYYY-MM-DD
  scope: AnalyticsExportScope;
};

export type ExportSectionFragment = {
  id: string;
  title: string;
  markdown: string;
  html: string;
  /** CSV body without trailing newline; may include multiple blocks */
  csv: string;
};

export type AnalyticsExportResult = {
  content: string;
  filename: string;
  mimeType: string;
};
```

- [ ] **Step 2: Add pure format helpers**

```typescript
// src/lib/analytics-export-format.ts
import { escapeHtml } from "@/lib/analytics-html-report";
import type { AnalyticsExportMeta, ExportSectionFragment } from "@/lib/analytics-export-types";

export function csvCell(value: string | number | null | undefined): string {
  const s =
    value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

export function mdTable(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows
    .map(
      (r) =>
        `| ${r.map((c) => (c === null || c === undefined ? "—" : String(c))).join(" | ")} |`
    )
    .join("\n");
  return `${head}\n${sep}\n${body || `| ${headers.map(() => "_None_").join(" | ")} |`}`;
}

export function htmlTable(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const th = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows
    .map((r) => {
      const tds = r
        .map((c) => {
          const text =
            c === null || c === undefined ? "—" : String(c);
          return `<td>${escapeHtml(text)}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("\n");
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs || ""}</tbody></table>`;
}

export const PRIVACY_FOOTER_MD =
  "_Individual learner data is not included in this report. Aggregates only._";

export function privacyFooterHtml(): string {
  return `<p class="privacy"><em>Individual learner data is not included in this report. Aggregates only.</em></p>`;
}

export function composeMarkdown(
  meta: AnalyticsExportMeta,
  fragments: ExportSectionFragment[]
): string {
  const header = `# Arcademy Analytics — ${meta.productName}

Generated: ${meta.generatedAt}
Period: ${meta.rangeLabel}
Compare: ${meta.compareBaseline}
Scope: ${meta.scope}
`;
  const body = fragments
    .map((f) => `## ${f.title}\n\n${f.markdown.trim()}`)
    .join("\n\n");
  return `${header}\n${body}\n\n---\n\n${PRIVACY_FOOTER_MD}\n`;
}

export function composeCsv(
  meta: AnalyticsExportMeta,
  fragments: ExportSectionFragment[]
): string {
  const metaBlock = [
    csvRow(["meta_key", "meta_value"]),
    csvRow(["product", meta.productName]),
    csvRow(["period", meta.rangeLabel]),
    csvRow(["compare", meta.compareBaseline]),
    csvRow(["scope", meta.scope]),
    csvRow(["generated", meta.generatedAt]),
  ].join("\n");

  const sections = fragments
    .map((f) => `\n# section:${f.id}\n${f.csv.trim()}`)
    .join("\n");

  return `${metaBlock}\n${sections}\n`;
}

export function composeHtmlDocument(
  meta: AnalyticsExportMeta,
  fragments: ExportSectionFragment[]
): string {
  // Reuse REPORT_CSS patterns from analytics-html-report if practical;
  // otherwise a minimal page shell is enough for narrative share.
  const sections = fragments
    .map(
      (f) =>
        `<section id="${escapeHtml(f.id)}"><h2>${escapeHtml(f.title)}</h2>${f.html}</section>`
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Arcademy Analytics — ${escapeHtml(meta.productName)}</title>
<style>
body{font-family:Segoe UI,system-ui,sans-serif;max-width:960px;margin:0 auto;padding:2rem 1.5rem;color:#1a1a1a;background:#f7f6f3;line-height:1.5;font-size:14px}
h1{font-size:1.5rem}h2{font-size:1.15rem;margin-top:2rem;border-bottom:1px solid #e2e0db;padding-bottom:.35rem}
table{width:100%;border-collapse:collapse;margin:.75rem 0}th,td{border:1px solid #e2e0db;padding:.4rem .55rem;text-align:left}
th{background:#e8f0ec}.meta{color:#5c5c5c;font-size:.85rem}.privacy{margin-top:2rem;color:#5c5c5c;font-size:.85rem}
</style>
</head>
<body>
<header>
<p class="meta">Arcademy Analytics</p>
<h1>${escapeHtml(meta.productName)}</h1>
<p class="meta">Generated ${escapeHtml(meta.generatedAt)} · ${escapeHtml(meta.rangeLabel)} · Compare: ${escapeHtml(meta.compareBaseline)} · Scope: ${escapeHtml(meta.scope)}</p>
</header>
${sections}
${privacyFooterHtml()}
</body>
</html>`;
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function buildFilename(
  meta: AnalyticsExportMeta,
  format: "markdown" | "csv" | "html"
): string {
  const slug = slugifyName(meta.productName) || "project";
  const ext = format === "markdown" ? "md" : format;
  return `arcademy-analytics-${slug}-${meta.scope}-${meta.rangePreset}.${ext}`;
}

export function mimeFor(format: "markdown" | "csv" | "html"): string {
  if (format === "csv") return "text/csv;charset=utf-8";
  if (format === "html") return "text/html;charset=utf-8";
  return "text/markdown;charset=utf-8";
}
```

- [ ] **Step 3: Write `node:test` coverage**

```typescript
// scripts/analytics-export-format.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeCsv,
  composeMarkdown,
  csvCell,
  csvRow,
  mdTable,
} from "../src/lib/analytics-export-format";
import type { AnalyticsExportMeta, ExportSectionFragment } from "../src/lib/analytics-export-types";

const meta: AnalyticsExportMeta = {
  productId: "p1",
  productName: "Demo Co",
  rangeLabel: "Last 30 days",
  rangePreset: "30d",
  compareBaseline: "none",
  generatedAt: "2026-07-14",
  scope: "overview",
};

describe("csv helpers", () => {
  it("escapes quotes", () => {
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  });
  it("builds a row", () => {
    assert.equal(csvRow(["a", 1, null]), '"a","1",""');
  });
});

describe("mdTable", () => {
  it("renders headers and rows", () => {
    const md = mdTable(["A", "B"], [["x", 2]]);
    assert.match(md, /\| A \| B \|/);
    assert.match(md, /\| x \| 2 \|/);
  });
});

describe("compose", () => {
  const frag: ExportSectionFragment = {
    id: "kpi",
    title: "Summary",
    markdown: "| Metric | Value |\n| --- | --- |\n| Starts | 10 |",
    html: "<table></table>",
    csv: csvRow(["metric", "value"]) + "\n" + csvRow(["starts", 10]),
  };

  it("includes privacy footer in markdown", () => {
    const md = composeMarkdown(meta, [frag]);
    assert.match(md, /Aggregates only/);
    assert.match(md, /## Summary/);
  });

  it("marks CSV sections", () => {
    const csv = composeCsv(meta, [frag]);
    assert.match(csv, /# section:kpi/);
    assert.match(csv, /"scope","overview"/);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec tsx --test scripts/analytics-export-format.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics-export-types.ts src/lib/analytics-export-format.ts scripts/analytics-export-format.test.ts
git commit -m "$(cat <<'EOF'
feat(analytics): add export types and pure format helpers

EOF
)"
```

---

### Task 2: Section serializers (pure)

**Files:**
- Create: `src/lib/analytics-export-sections.ts`
- Modify: `scripts/analytics-export-format.test.ts` (add section tests)

Renderers take **already-loaded** DTOs and return `ExportSectionFragment`. Do not import Prisma or `server-only` here.

- [ ] **Step 1: Implement section renderers**

Implement these exported functions (imports from existing types):

```typescript
// src/lib/analytics-export-sections.ts
import type { BehaviourAnalytics } from "@/lib/analytics-behaviour";
import type { CohortAnalytics } from "@/lib/analytics-cohorts";
import type { CertificationAnalytics } from "@/lib/certifications";
import type { ConceptMasteryRow, ConceptCoverageSummary } from "@/lib/concept-mastery";
import type { AnalyticsRecommendation } from "@/lib/analytics-recommendations";
import type { QuestionIntelligenceRow } from "@/lib/question-intelligence";
import type { ReadinessModelEval } from "@/lib/readiness-eval";
import type { PartnerPlusAnalytics, PartnerPlusCourseAnalytics } from "@/lib/partner-analytics";
import type { AnalyticsEngineResult } from "@/lib/analytics-engine";
import type { ExportSectionFragment } from "@/lib/analytics-export-types";
import { csvRow, htmlTable, mdTable } from "@/lib/analytics-export-format";
import { escapeHtml, formatNullablePct, formatNumber } from "@/lib/analytics-html-report";

export function renderOverviewFragment(
  engine: AnalyticsEngineResult
): ExportSectionFragment {
  const { overview, metrics, recommendations } = engine;
  // Markdown / HTML / CSV covering:
  // - KPI strip from metrics (partner-safe ids present on overview UI)
  // - summary + discovery (same numbers overview shows)
  // - funnel, weeklyTrends
  // - cohorts.cohorts, behaviour.metrics
  // - staffNotes if present
  // - top recommendations (title, priority, rationale) — short list
  // Use mdTable / htmlTable / csvRow helpers.
  // ...
}

export function renderCoursesFragment(
  courses: PartnerPlusAnalytics["courses"]
): ExportSectionFragment { /* course table */ }

export function renderCourseDetailFragment(
  course: PartnerPlusCourseAnalytics
): ExportSectionFragment { /* diagnostics + top missed */ }

export function renderConceptsFragment(input: {
  coverage: ConceptCoverageSummary;
  rows: ConceptMasteryRow[];
  gaps: ConceptMasteryRow[];
  backfillIncomplete: boolean;
}): ExportSectionFragment {
  // If backfillIncomplete, lead with a clear incomplete-data note in all formats.
}

export function renderAssessmentsFragment(input: {
  questions: QuestionIntelligenceRow[];
  backfillIncomplete: boolean;
}): ExportSectionFragment { /* miss rates; incomplete note if needed */ }

export function renderReadinessFragment(
  models: ReadinessModelEval[]
): ExportSectionFragment { /* default model score + component rows */ }

export function renderCertificationsFragment(
  data: CertificationAnalytics
): ExportSectionFragment { /* summary + per-cert rows */ }

export function renderRecommendationsFragment(
  recommendations: AnalyticsRecommendation[]
): ExportSectionFragment { /* id, priority, title, rationale, evidenceLabel */ }
```

Fill each function completely using `mdTable` / `htmlTable` / `csvRow`. Prefer fields the corresponding `analytics-*-view.tsx` already displays—do not invent metrics.

- [ ] **Step 2: Add fixture tests for concepts incomplete note and recommendations**

```typescript
// append to scripts/analytics-export-format.test.ts
import { renderConceptsFragment, renderRecommendationsFragment } from "../src/lib/analytics-export-sections";

it("concepts fragment warns when backfill incomplete", () => {
  const frag = renderConceptsFragment({
    coverage: {
      lessonTotal: 0,
      lessonTagged: 0,
      questionTotal: 0,
      questionTagged: 0,
      coveragePct: 0,
      complete: false,
    },
    rows: [],
    gaps: [],
    backfillIncomplete: true,
  });
  assert.match(frag.markdown, /incomplete|backfill|not ready/i);
});

it("recommendations fragment includes rationale", () => {
  const frag = renderRecommendationsFragment([
    {
      id: "r1",
      priority: "high",
      category: "opportunity",
      title: "Fix drop-off",
      rationale: "Funnel stage conversion is low",
      evidenceMetricIds: [],
      href: "/x",
    },
  ]);
  assert.match(frag.markdown, /Fix drop-off/);
  assert.match(frag.markdown, /Funnel stage conversion is low/);
  assert.match(frag.csv, /r1/);
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm exec tsx --test scripts/analytics-export-format.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/analytics-export-sections.ts scripts/analytics-export-format.test.ts
git commit -m "$(cat <<'EOF'
feat(analytics): add pure V2 export section serializers

EOF
)"
```

---

### Task 3: Server-only data loader

**Files:**
- Create: `src/lib/analytics-export-data.ts`

- [ ] **Step 1: Implement `loadAnalyticsExportBundle`**

```typescript
// src/lib/analytics-export-data.ts
import "server-only";

import type {
  AnalyticsCompareBaseline,
  AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import {
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { getAnalyticsEngineView } from "@/lib/analytics-snapshots";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import {
  getConceptCoverage,
  getConceptMasteryRows,
  rankKnowledgeGaps,
} from "@/lib/concept-mastery";
import { getQuestionIntelligenceRows } from "@/lib/question-intelligence";
import { getQuestionAttemptBackfillStatus } from "@/lib/question-attempt-backfill";
import { evaluateReadinessModels } from "@/lib/readiness-eval";
import { getCertificationAnalytics } from "@/lib/certifications";
import {
  getPartnerPlusCourseAnalytics,
  getPartnerPlusAnalytics,
} from "@/lib/partner-analytics";
import type { AnalyticsExportScope } from "@/lib/analytics-export-types";
import type { AnalyticsEngineResult } from "@/lib/analytics-engine";
import type { ExportSectionFragment } from "@/lib/analytics-export-types";
import {
  renderOverviewFragment,
  renderCoursesFragment,
  renderCourseDetailFragment,
  renderConceptsFragment,
  renderAssessmentsFragment,
  renderReadinessFragment,
  renderCertificationsFragment,
  renderRecommendationsFragment,
} from "@/lib/analytics-export-sections";

export type LoadedExportBundle = {
  productName: string;
  rangeLabel: string;
  v2Enabled: boolean;
  /** When v2Enabled is false, callers may use legacy Plus serializers instead. */
  engine: AnalyticsEngineResult | null;
  fragments: ExportSectionFragment[];
};

export async function loadAnalyticsExportBundle(input: {
  productId: string;
  scope: AnalyticsExportScope;
  rangePreset: AnalyticsRangePreset;
  compareBaseline: AnalyticsCompareBaseline;
  courseId?: string;
}): Promise<LoadedExportBundle | null> {
  const v2Enabled = await isAnalyticsV2Enabled(input.productId);
  const range = resolveAnalyticsDateRange(input.rangePreset);

  // Prefer snapshot-backed engine for overview / courses / recommendations / full
  const view = await getAnalyticsEngineView({
    productId: input.productId,
    preset: input.rangePreset,
    compare: input.compareBaseline,
    allowLiveFallback: true,
  });
  const engine = view.data;
  if (!engine) return null;

  const rangeLabel = /* use engine.range label helper or PartnerPlus rangeLabel */
    (await getPartnerPlusAnalytics(input.productId, range))?.rangeLabel ??
    input.rangePreset;

  if (!v2Enabled) {
    return {
      productName: engine.productName,
      rangeLabel,
      v2Enabled: false,
      engine,
      fragments: [],
    };
  }

  const fragments: ExportSectionFragment[] = [];
  const need = (s: AnalyticsExportScope) =>
    input.scope === "full" || input.scope === s;

  if (need("overview")) {
    fragments.push(renderOverviewFragment(engine));
  }
  if (need("courses")) {
    fragments.push(renderCoursesFragment(engine.courses));
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
  }
  if (need("concepts")) {
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
  if (need("assessments")) {
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
  if (need("readiness")) {
    const models = await evaluateReadinessModels(input.productId, range);
    fragments.push(renderReadinessFragment(models));
  }
  if (need("certifications")) {
    const certs = await getCertificationAnalytics(input.productId, range);
    fragments.push(renderCertificationsFragment(certs));
  }
  if (need("recommendations")) {
    fragments.push(renderRecommendationsFragment(engine.recommendations));
  }

  // Full pack order: overview → courses → concepts → assessments →
  // readiness → certifications → recommendations (already pushed in that order if need() order is preserved).
  // When scope === "full", call sections in explicit order instead of unordered need().

  return {
    productName: engine.productName,
    rangeLabel,
    v2Enabled: true,
    engine,
    fragments,
  };
}
```

**Important:** For `scope === "full"`, build fragments in this **fixed order** (do not rely on unordered `need()`):

1. overview  
2. courses  
3. concepts  
4. assessments  
5. readiness  
6. certifications  
7. recommendations  

When `scope` is a single section, push only that section’s fragment.

- [ ] **Step 2: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors related to new file (fix any that appear).

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics-export-data.ts
git commit -m "$(cat <<'EOF'
feat(analytics): load V2 export payloads by section scope

EOF
)"
```

---

### Task 4: Orchestrator — `buildAnalyticsExport`

**Files:**
- Modify: `src/lib/analytics-export.ts`

- [ ] **Step 1: Replace body to branch on V2 + scope**

Keep `buildStaffPartnerReportMarkdown` working (staff markdown should use `scope: "full"` when V2 is on, Plus path when off).

```typescript
// src/lib/analytics-export.ts — target shape
import "server-only";

import type { AnalyticsCompareBaseline, AnalyticsRangePreset } from "@/lib/analytics-date-range";
import {
  parseAnalyticsCompareBaseline,
  parseAnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import { loadAnalyticsExportBundle } from "@/lib/analytics-export-data";
import {
  buildFilename,
  composeCsv,
  composeHtmlDocument,
  composeMarkdown,
  mimeFor,
} from "@/lib/analytics-export-format";
import type {
  AnalyticsExportFormat,
  AnalyticsExportResult,
  AnalyticsExportScope,
} from "@/lib/analytics-export-types";
import {
  getPartnerPlusAnalytics,
  getPartnerPlusCourseAnalytics,
  partnerPlusReportToCsv,
  partnerPlusReportToHtml,
  partnerPlusReportToMarkdown,
} from "@/lib/partner-analytics";
import { resolveAnalyticsDateRange } from "@/lib/analytics-date-range";
import { runAnalyticsEngine } from "@/lib/analytics-engine";

export type { AnalyticsExportFormat, AnalyticsExportResult, AnalyticsExportScope };

async function buildLegacyPlusExport(input: {
  productId: string;
  rangePreset: AnalyticsRangePreset;
  compareBaseline: AnalyticsCompareBaseline;
  format: AnalyticsExportFormat;
}): Promise<AnalyticsExportResult | null> {
  // Preserve existing Plus behavior (current buildAnalyticsExport body).
  // ... move current implementation here unchanged ...
}

export async function buildAnalyticsExport(input: {
  productId: string;
  rangePreset?: string;
  compareBaseline?: string;
  format: AnalyticsExportFormat;
  scope?: AnalyticsExportScope;
  courseId?: string;
}): Promise<AnalyticsExportResult | null> {
  const preset = parseAnalyticsRangePreset(input.rangePreset);
  const compare = parseAnalyticsCompareBaseline(input.compareBaseline);
  const scope: AnalyticsExportScope = input.scope ?? "full";

  const bundle = await loadAnalyticsExportBundle({
    productId: input.productId,
    scope,
    rangePreset: preset,
    compareBaseline: compare,
    courseId: input.courseId,
  });
  if (!bundle) return null;

  if (!bundle.v2Enabled) {
    return buildLegacyPlusExport({
      productId: input.productId,
      rangePreset: preset,
      compareBaseline: compare,
      format: input.format,
    });
  }

  const meta = {
    productId: input.productId,
    productName: bundle.productName,
    rangeLabel: bundle.rangeLabel,
    rangePreset: preset,
    compareBaseline: compare,
    generatedAt: new Date().toISOString().slice(0, 10),
    scope,
  };

  const content =
    input.format === "csv"
      ? composeCsv(meta, bundle.fragments)
      : input.format === "html"
        ? composeHtmlDocument(meta, bundle.fragments)
        : composeMarkdown(meta, bundle.fragments);

  return {
    content,
    filename: buildFilename(meta, input.format),
    mimeType: mimeFor(input.format),
  };
}

// buildStaffPartnerReportMarkdown: call buildAnalyticsExport({ ..., scope: "full", format: "markdown" })
```

- [ ] **Step 2: Run unit tests again (pure) + typecheck**

```bash
pnpm exec tsx --test scripts/analytics-export-format.test.ts
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics-export.ts
git commit -m "$(cat <<'EOF'
feat(analytics): orchestrate scoped V2 exports with Plus fallback

EOF
)"
```

---

### Task 5: Server action + telemetry

**Files:**
- Modify: `src/app/actions/analytics-v2.ts`

- [ ] **Step 1: Extend Zod schema and pass scope**

```typescript
const exportSchema = z.object({
  productId: z.string().min(1),
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
  compareBaseline: z
    .enum(["none", "previous_week", "previous_month", "previous_quarter"])
    .optional(),
  format: z.enum(["markdown", "csv", "html"]),
  scope: z
    .enum([
      "overview",
      "courses",
      "course",
      "concepts",
      "assessments",
      "readiness",
      "certifications",
      "recommendations",
      "full",
    ])
    .optional()
    .default("full"),
  courseId: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.scope === "course" && !val.courseId) {
    ctx.addIssue({
      code: "custom",
      message: "courseId is required when scope is course",
      path: ["courseId"],
    });
  }
});
```

In `exportAnalyticsReport`:

```typescript
const built = await buildAnalyticsExport({
  productId: parsed.data.productId,
  rangePreset: preset,
  compareBaseline: compare,
  format: parsed.data.format,
  scope: parsed.data.scope,
  courseId: parsed.data.courseId,
});
// metadata: { format, rangePreset, compare, scope: parsed.data.scope, generatorRole, engine: "v2" | "plus" }
```

Also update `partner-analytics.ts` action path if it still calls `buildAnalyticsExport` without scope (default `"full"` is fine).

- [ ] **Step 2: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/analytics-v2.ts src/app/actions/partner-analytics.ts
git commit -m "$(cat <<'EOF'
feat(analytics): accept export scope in exportAnalyticsReport

EOF
)"
```

---

### Task 6: `AnalyticsExportAction` UI

**Files:**
- Modify: `src/components/partner-console/analytics/analytics-export-action.tsx`
- Modify: `src/components/partner-console/analytics/partner-analytics-export-panel.tsx` (thin wrapper calling same props, or remove if unused)

- [ ] **Step 1: Update component API**

```tsx
// analytics-export-action.tsx — key props
export function AnalyticsExportAction({
  productId,
  rangePreset,
  compareBaseline,
  scope = "full",
  courseId,
  showFullPack = false,
}: {
  productId: string;
  rangePreset: string;
  compareBaseline: string;
  scope?:
    | "overview"
    | "courses"
    | "course"
    | "concepts"
    | "assessments"
    | "readiness"
    | "certifications"
    | "recommendations"
    | "full";
  courseId?: string;
  /** Overview only: offer Complete pack (scope=full) beside this-view export */
  showFullPack?: boolean;
}) {
  // Format button order: HTML, Markdown, CSV (narrative first).
  // Primary group: Export this view (uses `scope`).
  // If showFullPack: secondary "Complete pack" with HTML / Markdown / CSV (scope="full").
  // Labels: "HTML report", "Markdown", "CSV" — short helper text optional:
  // "Share a readable report, or open CSV in a spreadsheet."
}
```

Call `exportAnalyticsReport` with `{ productId, rangePreset, compareBaseline, format, scope, courseId }`.

- [ ] **Step 2: Ensure Overview uses `scope="overview"` + `showFullPack`**

On V2 overview page (`analytics/page.tsx`):

```tsx
<AnalyticsExportAction
  productId={productId}
  rangePreset={preset}
  compareBaseline={compare}
  scope="overview"
  showFullPack
/>
```

On V2-off overview, keep `scope` omitted or `"full"` so Plus path runs (orchestrator ignores V2 scopes when flag off).

- [ ] **Step 3: Commit**

```bash
git add src/components/partner-console/analytics/analytics-export-action.tsx src/components/partner-console/analytics/partner-analytics-export-panel.tsx src/app/partner-console/\[productId\]/analytics/page.tsx
git commit -m "$(cat <<'EOF'
feat(analytics): section-aware export action with complete pack

EOF
)"
```

---

### Task 7: Wire remaining Analytics pages

**Files:**
- Modify: `src/app/partner-console/[productId]/analytics/courses/page.tsx` → `scope="courses"`
- Modify: `src/app/partner-console/[productId]/analytics/courses/[courseId]/page.tsx` → `scope="course"` + `courseId`
- Modify: `src/app/partner-console/[productId]/analytics/recommendations/page.tsx` → `scope="recommendations"`
- Modify: `src/app/partner-console/[productId]/analytics/concepts/page.tsx` — **add** `AnalyticsExportAction` with `scope="concepts"`
- Modify: `src/app/partner-console/[productId]/analytics/assessments/page.tsx` — **add** with `scope="assessments"`
- Modify: `src/app/partner-console/[productId]/analytics/readiness/page.tsx` — **add** with `scope="readiness"`
- Modify: `src/app/partner-console/[productId]/analytics/certifications/page.tsx` — **add** with `scope="certifications"`

- [ ] **Step 1: Add export controls to Concepts / Assessments / Readiness / Certifications headers**

Pattern (match Courses page layout):

```tsx
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { parseAnalyticsCompareBaseline } from "@/lib/analytics-date-range";

// Read compare from searchParams the same way Overview does when available;
// if the page only has range today, pass compareBaseline="none".

<div className="flex flex-wrap items-center gap-4">
  <AnalyticsExportAction
    productId={productId}
    rangePreset={preset}
    compareBaseline={compare ?? "none"}
    scope="concepts" // or assessments | readiness | certifications
  />
</div>
```

Place next to the date-range control / title row so it is visible without becoming a nav item.

- [ ] **Step 2: Pass correct scopes on existing Courses / Recommendations / course detail pages**

- [ ] **Step 3: Confirm `analytics-subnav.tsx` has no Export item**

- [ ] **Step 4: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/partner-console/\[productId\]/analytics/
git commit -m "$(cat <<'EOF'
feat(analytics): wire scoped export on all primary analytics sections

EOF
)"
```

---

### Task 8: Manual QA + acceptance

**Files:**
- Modify: `docs/features/v2-contextual-analytics-export.md` (check off acceptance items)

- [ ] **Step 1: Manual verification checklist**

With `analyticsV2` enabled for a product that has seeded activity:

1. Overview → HTML report opens as a readable memo including cohorts/behaviour (not Plus-only KPIs).
2. Overview → Complete pack Markdown includes all section headings in order.
3. Overview → Complete pack CSV contains `# section:` markers for each section.
4. Concepts / Assessments / Readiness / Certifications each download a scoped file.
5. Courses list and course detail still export.
6. CSV buttons work on each page.
7. Subnav has no Export link.
8. Flip `analyticsV2` off → export still downloads Plus-shaped report.
9. Concept/question drill-down pages have **no** new export control.

- [ ] **Step 2: Run automated tests + lint**

```bash
pnpm exec tsx --test scripts/analytics-export-format.test.ts
pnpm lint
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Update feature brief acceptance checkboxes to `[x]` where verified**

- [ ] **Step 4: Final commit if brief updated**

```bash
git add docs/features/v2-contextual-analytics-export.md
git commit -m "$(cat <<'EOF'
docs(analytics): mark contextual export acceptance criteria

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Contextual export, not nav | Tasks 6–7; subnav untouched |
| Narrative HTML/MD first, CSV available | Tasks 1, 6 (button order) |
| Full pack = single memo + multi-section CSV | Tasks 1 (`compose*`), 3 (`full` order), 6 (`showFullPack`) |
| Section scopes including `course` | Tasks 3–5, 7 |
| Wire missing V2 sections | Task 7 |
| V2-off Plus fallback | Task 4 |
| Backfill incomplete note | Task 2 concepts/assessments |
| No drill-down export | Task 7 (explicit skip) |
| Telemetry includes scope | Task 5 |
| Aggregates-only footer | Task 1 privacy helpers |
| Snapshot-friendly reads | Task 3 (`getAnalyticsEngineView`) |

## Placeholder scan

No TBD / “implement later” / “similar to Task N” left as instructions without concrete signatures. Section renderer bodies in Task 2 are specified by field lists and must be filled from UI DTOs during implementation—not left as stubs in the shipped PR.

## Type consistency

- `AnalyticsExportScope` / `AnalyticsExportFormat` defined in `analytics-export-types.ts`
- `ExportSectionFragment` consumed by `composeMarkdown` / `composeCsv` / `composeHtmlDocument`
- Action Zod enums match `ANALYTICS_EXPORT_SCOPES`
- UI `scope` prop unions match the same string literals
