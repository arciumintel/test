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
