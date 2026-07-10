import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { StatMetric } from "@/components/ui/stat-metric";
import { CohortExportPanel } from "@/components/admin/cohort-export-panel";
import { prisma } from "@/lib/prisma";
import { buildCohort } from "@/lib/cohorts";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Cohorts · Admin" };

function truncateWallet(address: string): string {
  return address.length > 12
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : address;
}

export default async function CohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; course?: string; minScore?: string }>;
}) {
  const params = await searchParams;
  const preset = parseAnalyticsRangePreset(params.range);
  const range = resolveAnalyticsDateRange(preset);
  const courseId = params.course?.trim() || null;
  const parsedMinScore = Number.parseInt(params.minScore ?? "", 10);
  const minScore =
    Number.isInteger(parsedMinScore) && parsedMinScore >= 0 && parsedMinScore <= 100
      ? parsedMinScore
      : null;

  const [cohort, courses] = await Promise.all([
    buildCohort({ courseId, minScore, range }),
    prisma.course.findMany({
      where: { badgeAwards: { some: {} } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const walletsWithScore = cohort.rows.filter((r) => r.bestScore != null).length;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Wallet cohorts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Qualified wallets from badge completions — export allowlists for
            campaigns, Discord roles, and ecosystem partners.
          </p>
        </div>
        <CohortExportPanel
          courseId={courseId}
          minScore={minScore}
          rangePreset={preset}
          disabled={cohort.rows.length === 0}
        />
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div className="grid gap-1.5">
          <Label htmlFor="course-filter">Course</Label>
          <select
            id="course-filter"
            name="course"
            defaultValue={courseId ?? ""}
            className="h-9 min-w-[14rem] rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Any course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="min-score">Min final-quiz score</Label>
          <input
            id="min-score"
            name="minScore"
            type="number"
            min={0}
            max={100}
            defaultValue={minScore ?? ""}
            placeholder="e.g. 80"
            className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="range-filter">Awarded within</Label>
          <select
            id="range-filter"
            name="range"
            defaultValue={preset}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatMetric label="Qualified wallets" value={cohort.totalWallets} />
        <StatMetric
          label="With recorded quiz score"
          value={walletsWithScore}
        />
        <StatMetric label="Period" value={range.label} />
      </div>

      <Card className="mt-6">
        <CardContent className="pt-4">
          {cohort.rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No qualified wallets"
              description="No badge awards match these filters yet. Widen the date range or remove the score filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Wallet</th>
                    <th className="py-2 pr-4 font-medium">Display name</th>
                    <th className="py-2 pr-4 text-right font-medium">Badges</th>
                    <th className="py-2 pr-4 font-medium">Courses</th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Best score
                    </th>
                    <th className="py-2 text-right font-medium">Last award</th>
                  </tr>
                </thead>
                <tbody>
                  {cohort.rows.map((row) => (
                    <tr key={row.walletAddress} className="border-b last:border-0">
                      <td
                        className="py-2.5 pr-4 font-mono text-xs"
                        title={row.walletAddress}
                      >
                        {truncateWallet(row.walletAddress)}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.displayName ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.badgeCount}
                      </td>
                      <td className="max-w-[16rem] truncate py-2.5 pr-4">
                        {row.courses.join(", ")}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.bestScore != null ? `${row.bestScore}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {formatDate(row.lastAwardedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground">
        Exports contain full wallet addresses — share only with teams that need
        them. When no course filter is set, best score is the wallet&apos;s
        highest final-quiz score across all courses.
      </p>
    </>
  );
}
