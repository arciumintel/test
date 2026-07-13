import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedChartJs: string | null = null;

function loadChartJs(): string {
  if (cachedChartJs) return cachedChartJs;
  const path = join(
    process.cwd(),
    "node_modules",
    "chart.js",
    "dist",
    "chart.umd.min.js"
  );
  cachedChartJs = readFileSync(path, "utf8");
  return cachedChartJs;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNullablePct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return `${value}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US");
}

const REPORT_CSS = `
:root {
  --bg: #f7f6f3;
  --surface: #ffffff;
  --ink: #1a1a1a;
  --muted: #5c5c5c;
  --border: #e2e0db;
  --accent: #1f4d3a;
  --accent-soft: #e8f0ec;
  --chart-1: #1f4d3a;
  --chart-2: #3d7a62;
  --chart-3: #8a9a7b;
  --chart-4: #c4a35a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: var(--ink);
  background: var(--bg);
  line-height: 1.5;
  font-size: 14px;
}
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}
header.report-header {
  border-bottom: 2px solid var(--accent);
  padding-bottom: 1.25rem;
  margin-bottom: 2rem;
}
header.report-header .brand {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
  margin: 0 0 0.35rem;
}
header.report-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
header.report-header .meta {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.875rem;
}
section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem 1.35rem;
  margin-bottom: 1.25rem;
}
section h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ink);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}
.kpi {
  background: var(--accent-soft);
  border-radius: 6px;
  padding: 0.85rem 1rem;
}
.kpi .label {
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0;
}
.kpi .value {
  font-size: 1.5rem;
  font-weight: 650;
  margin: 0.2rem 0 0;
  letter-spacing: -0.02em;
  color: var(--accent);
}
.kpi .hint {
  font-size: 0.7rem;
  color: var(--muted);
  margin: 0.15rem 0 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
th, td {
  text-align: left;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
th {
  font-weight: 600;
  color: var(--muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.chart-wrap {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 280px;
  margin-top: 0.5rem;
}
.chart-wrap.tall { height: 320px; }
.chart-wrap.short { height: 220px; }
.notes {
  white-space: pre-wrap;
  color: var(--ink);
  font-size: 0.875rem;
}
.footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.75rem;
}
.muted { color: var(--muted); }
.course-block { margin-top: 1.25rem; }
.course-block:first-of-type { margin-top: 0.5rem; }
.course-block h3 {
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
}
.two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 720px) {
  .two-col { grid-template-columns: 1fr 1fr; }
}
@media print {
  body { background: #fff; }
  .page { max-width: none; padding: 0; }
  section { break-inside: avoid; border-color: #ccc; }
  .chart-wrap { break-inside: avoid; }
}
`.trim();

export type KpiCard = {
  label: string;
  value: string;
  hint?: string;
};

export type TableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ChartConfig = {
  id: string;
  type: "bar" | "line" | "doughnut";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
    tension?: number;
  }[];
  options?: Record<string, unknown>;
  heightClass?: "short" | "tall" | "";
  indexAxis?: "x" | "y";
};

export function renderKpiGrid(kpis: KpiCard[]): string {
  const cards = kpis
    .map(
      (k) => `<div class="kpi">
  <p class="label">${escapeHtml(k.label)}</p>
  <p class="value">${escapeHtml(k.value)}</p>
  ${k.hint ? `<p class="hint">${escapeHtml(k.hint)}</p>` : ""}
</div>`
    )
    .join("\n");
  return `<div class="kpi-grid">\n${cards}\n</div>`;
}

export function renderTable(
  columns: TableColumn[],
  rows: Record<string, string | number | null | undefined>[]
): string {
  if (rows.length === 0) {
    return `<p class="muted">No data for this period.</p>`;
  }
  const head = columns
    .map(
      (c) =>
        `<th class="${c.align === "right" ? "num" : ""}">${escapeHtml(c.label)}</th>`
    )
    .join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const raw = row[c.key];
          const text =
            raw === null || raw === undefined ? "—" : String(raw);
          return `<td class="${c.align === "right" ? "num" : ""}">${escapeHtml(text)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("\n");
  return `<table>
<thead><tr>${head}</tr></thead>
<tbody>
${body}
</tbody>
</table>`;
}

export function renderSection(title: string, body: string): string {
  return `<section>
  <h2>${escapeHtml(title)}</h2>
  ${body}
</section>`;
}

export function renderChartPlaceholder(
  chart: ChartConfig
): string {
  const height =
    chart.heightClass === "tall"
      ? "tall"
      : chart.heightClass === "short"
        ? "short"
        : "";
  return `<div class="chart-wrap ${height}"><canvas id="${escapeHtml(chart.id)}"></canvas></div>`;
}

const PALETTE = ["#1f4d3a", "#3d7a62", "#8a9a7b", "#c4a35a", "#6b7c93"];

export function chartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => PALETTE[i % PALETTE.length]);
}

export function buildChartInitScript(charts: ChartConfig[]): string {
  if (charts.length === 0) return "";

  const configs = charts.map((chart) => {
    const datasets = chart.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor:
        ds.backgroundColor ??
        (chart.type === "line" ? PALETTE[i % PALETTE.length] + "33" : PALETTE[i % PALETTE.length]),
      borderColor: ds.borderColor ?? PALETTE[i % PALETTE.length],
      fill: ds.fill ?? chart.type === "line",
      tension: ds.tension ?? (chart.type === "line" ? 0.3 : 0),
      borderWidth: 2,
    }));

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: chart.indexAxis ?? "x",
      plugins: {
        legend: {
          display: chart.datasets.length > 1 || chart.type === "doughnut",
          position: "bottom" as const,
        },
      },
      scales:
        chart.type === "doughnut"
          ? undefined
          : {
              x: {
                ticks: { maxRotation: 45, minRotation: 0 },
                grid: { color: "rgba(0,0,0,0.05)" },
              },
              y: {
                beginAtZero: true,
                ticks: { precision: 0 },
                grid: { color: "rgba(0,0,0,0.05)" },
              },
            },
      ...chart.options,
    };

    return {
      id: chart.id,
      type: chart.type,
      data: { labels: chart.labels, datasets },
      options,
    };
  });

  return `
<script>
(function() {
  var configs = ${JSON.stringify(configs)};
  configs.forEach(function(cfg) {
    var el = document.getElementById(cfg.id);
    if (!el || typeof Chart === "undefined") return;
    new Chart(el, { type: cfg.type, data: cfg.data, options: cfg.options });
  });
})();
</script>`;
}

export function buildHtmlDocument(options: {
  title: string;
  subtitle: string;
  generatedAt: string;
  rangeLabel: string;
  bodyHtml: string;
  charts: ChartConfig[];
  footerNote?: string;
}): string {
  const chartJs = loadChartJs();
  const chartScript = buildChartInitScript(options.charts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(options.title)}</title>
<style>
${REPORT_CSS}
</style>
</head>
<body>
<div class="page">
  <header class="report-header">
    <p class="brand">Arcademy</p>
    <h1>${escapeHtml(options.title)}</h1>
    <p class="meta">${escapeHtml(options.subtitle)} · Period: ${escapeHtml(options.rangeLabel)} · Generated ${escapeHtml(options.generatedAt)}</p>
  </header>
  ${options.bodyHtml}
  <footer class="footer">
    ${options.footerNote ? `<p>${escapeHtml(options.footerNote)}</p>` : ""}
    <p>Confidential — for authorized Arcademy staff and partner use.</p>
  </footer>
</div>
<script>
${chartJs}
</script>
${chartScript}
</body>
</html>`;
}
