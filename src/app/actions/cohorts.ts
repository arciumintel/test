"use server";

import { z } from "zod";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { buildCohort, cohortToCsv, cohortToJson } from "@/lib/cohorts";
import { authorizeStaff, toActionError } from "@/lib/access-control";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const exportSchema = z.object({
  courseId: z.string().optional(),
  minScore: z.number().int().min(0).max(100).nullable().optional(),
  rangePreset: z.enum(["7d", "30d", "90d", "all"]).optional(),
  format: z.enum(["csv", "json"]),
});

export async function exportCohort(
  raw: z.input<typeof exportSchema>
): Promise<Result<{ content: string; filename: string; mimeType: string }>> {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const range = resolveAnalyticsDateRange(
    parseAnalyticsRangePreset(parsed.data.rangePreset)
  );
  const cohort = await buildCohort({
    courseId: parsed.data.courseId || null,
    minScore: parsed.data.minScore ?? null,
    range,
  });

  const date = new Date().toISOString().slice(0, 10);

  if (parsed.data.format === "json") {
    return {
      ok: true,
      content: cohortToJson(cohort.rows),
      filename: `arcademy-cohort-${date}.json`,
      mimeType: "application/json;charset=utf-8",
    };
  }

  return {
    ok: true,
    content: cohortToCsv(cohort.rows),
    filename: `arcademy-cohort-${date}.csv`,
    mimeType: "text/csv;charset=utf-8",
  };
}
