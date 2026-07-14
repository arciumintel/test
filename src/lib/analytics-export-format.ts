import type {
  AnalyticsExportMeta,
  ExportSectionFragment,
} from "@/lib/analytics-export-types";

/** Local copy — avoid importing server-only analytics-html-report from pure helpers. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvRow(
  cells: Array<string | number | null | undefined>
): string {
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
          const text = c === null || c === undefined ? "—" : String(c);
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
