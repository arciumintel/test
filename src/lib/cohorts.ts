import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";

/**
 * Wallet cohort builder (staff-only).
 *
 * Produces qualified-wallet lists from completion data: wallets that earned
 * badges — optionally for a specific course, above a minimum final-quiz
 * score, within an award date range. Exports feed campaign allowlists,
 * Discord role assignment, and partner/Arcium BD conversations.
 */

export type CohortFilters = {
  courseId?: string | null;
  minScore?: number | null;
  range: AnalyticsDateRange;
};

export type CohortRow = {
  walletAddress: string;
  displayName: string | null;
  badgeCount: number;
  courses: string[];
  bestScore: number | null;
  lastAwardedAt: Date;
};

export type CohortResult = {
  rows: CohortRow[];
  totalWallets: number;
};

export async function buildCohort(filters: CohortFilters): Promise<CohortResult> {
  const awardedAt = filters.range.from
    ? { gte: filters.range.from, lte: filters.range.to }
    : undefined;

  const [awards, scoreGroups] = await Promise.all([
    prisma.badgeAward.findMany({
      where: {
        walletAddress: { not: null },
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(awardedAt ? { awardedAt } : {}),
      },
      orderBy: { awardedAt: "desc" },
      select: {
        userId: true,
        walletAddress: true,
        awardedAt: true,
        course: { select: { title: true } },
        user: { select: { displayName: true } },
      },
    }),
    prisma.quizAttempt.groupBy({
      by: ["userId"],
      where: {
        quiz: {
          lessonId: null,
          ...(filters.courseId ? { courseId: filters.courseId } : {}),
        },
      },
      _max: { score: true },
    }),
  ]);

  const bestScoreByUser = new Map(
    scoreGroups.map((g) => [g.userId, g._max.score])
  );

  const byWallet = new Map<string, CohortRow & { userId: string }>();
  for (const award of awards) {
    const wallet = award.walletAddress!;
    const existing = byWallet.get(wallet);
    if (existing) {
      existing.badgeCount += 1;
      existing.courses.push(award.course.title);
      if (award.awardedAt > existing.lastAwardedAt) {
        existing.lastAwardedAt = award.awardedAt;
      }
    } else {
      byWallet.set(wallet, {
        userId: award.userId,
        walletAddress: wallet,
        displayName: award.user.displayName,
        badgeCount: 1,
        courses: [award.course.title],
        bestScore: bestScoreByUser.get(award.userId) ?? null,
        lastAwardedAt: award.awardedAt,
      });
    }
  }

  let rows = [...byWallet.values()];
  if (filters.minScore != null) {
    rows = rows.filter(
      (row) => row.bestScore != null && row.bestScore >= filters.minScore!
    );
  }
  rows.sort((a, b) => b.lastAwardedAt.getTime() - a.lastAwardedAt.getTime());

  return {
    rows: rows.map(({ userId: _userId, ...row }) => row),
    totalWallets: rows.length,
  };
}

export function cohortToCsv(rows: CohortRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    "walletAddress,displayName,badgeCount,courses,bestScore,lastAwardedAt",
  ];
  for (const row of rows) {
    lines.push(
      [
        row.walletAddress,
        escape(row.displayName ?? ""),
        String(row.badgeCount),
        escape(row.courses.join("; ")),
        row.bestScore != null ? String(row.bestScore) : "",
        row.lastAwardedAt.toISOString(),
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function cohortToJson(rows: CohortRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      walletAddress: row.walletAddress,
      displayName: row.displayName,
      badgeCount: row.badgeCount,
      courses: row.courses,
      bestScore: row.bestScore,
      lastAwardedAt: row.lastAwardedAt.toISOString(),
    })),
    null,
    2
  );
}
