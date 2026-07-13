"use server";

import { z } from "zod";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import {
  getPlatformAnalyticsReport,
  platformAnalyticsReportToHtml,
} from "@/lib/platform-analytics-report";
import { authorizeStaff, toActionError } from "@/lib/access-control";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const exportSchema = z.object({
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
});

export async function exportPlatformAnalyticsHtmlReport(
  raw: z.input<typeof exportSchema> = {}
): Promise<Result<{ content: string; filename: string; mimeType: string }>> {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const range = resolveAnalyticsDateRange(
    parseAnalyticsRangePreset(parsed.data.rangePreset)
  );
  const data = await getPlatformAnalyticsReport(range);
  const content = platformAnalyticsReportToHtml(data);
  const date = new Date().toISOString().slice(0, 10);

  return {
    ok: true,
    content,
    filename: `arcademy-platform-analytics-${date}.html`,
    mimeType: "text/html;charset=utf-8",
  };
}
