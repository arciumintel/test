import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeCsv,
  composeMarkdown,
  csvCell,
  csvRow,
  mdTable,
} from "../src/lib/analytics-export-format";
import {
  renderConceptsFragment,
  renderRecommendationsFragment,
} from "../src/lib/analytics-export-sections";
import type {
  AnalyticsExportMeta,
  ExportSectionFragment,
} from "../src/lib/analytics-export-types";

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

describe("section serializers", () => {
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
    assert.match(frag.markdown, /incomplete|backfill|provisional/i);
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
});