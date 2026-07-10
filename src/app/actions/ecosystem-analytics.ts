"use server";

import { z } from "zod";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { getEcosystemOverview } from "@/lib/ecosystem-analytics";
import {
  ecosystemReportToCsv,
  ecosystemReportToMarkdown,
} from "@/lib/ecosystem-report";
import { authorizeStaff, toActionError } from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const exportSchema = z.object({
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
  format: z.enum(["markdown", "csv"]),
});

export async function exportEcosystemReport(
  raw: z.input<typeof exportSchema>
): Promise<Result<{ content: string; filename: string; mimeType: string }>> {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const range = resolveAnalyticsDateRange(
    parseAnalyticsRangePreset(parsed.data.rangePreset)
  );
  const overview = await getEcosystemOverview(range);

  const date = new Date().toISOString().slice(0, 10);

  trackEventFireAndForget({
    eventName: "ecosystem_report_generated",
    source: "server_action",
    path: "/admin/analytics",
    userId: auth.user.id,
    metadata: {
      reportPeriodStart: range.from?.toISOString().slice(0, 10) ?? "all",
      reportPeriodEnd: range.to.toISOString().slice(0, 10),
      format: parsed.data.format,
    },
  });

  if (parsed.data.format === "csv") {
    return {
      ok: true,
      content: ecosystemReportToCsv(overview),
      filename: `arcademy-ecosystem-report-${date}.csv`,
      mimeType: "text/csv;charset=utf-8",
    };
  }

  return {
    ok: true,
    content: ecosystemReportToMarkdown(overview, range),
    filename: `arcademy-ecosystem-report-${date}.md`,
    mimeType: "text/markdown;charset=utf-8",
  };
}
