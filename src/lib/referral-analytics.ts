import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import { occurredAtFilter } from "@/lib/analytics-date-range";

export type ReferralCountRow = {
  label: string;
  count: number;
};

export type ReferralFunnel = {
  projectViews: number;
  courseDetailViews: number;
  courseStarts: number;
  courseCompletions: number;
};

export type ReferralAnalytics = {
  funnel: ReferralFunnel;
  topUtmSources: ReferralCountRow[];
  topUtmCampaigns: ReferralCountRow[];
  topReferrerDomains: ReferralCountRow[];
  outboundReferralClicks: number;
  outboundByProduct: ReferralCountRow[];
};

function parseReferrerDomain(referrer: string | null): string | null {
  if (!referrer?.trim()) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

function aggregateCounts(
  rows: { key: string | null }[],
  limit = 10
): ReferralCountRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.key) continue;
    counts.set(row.key, (counts.get(row.key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getReferralAnalytics(options: {
  range: AnalyticsDateRange;
  productId?: string | null;
}): Promise<ReferralAnalytics> {
  const occurredAt = occurredAtFilter(options.range);
  const productFilter = options.productId
    ? { ecosystemProjectId: options.productId }
    : {};

  const baseWhere = {
    ...(occurredAt ? { occurredAt } : {}),
    ...productFilter,
  };

  const referredWhere = {
    ...baseWhere,
    OR: [
      { utmSource: { not: null } },
      { utmCampaign: { not: null } },
      { referrer: { not: null } },
    ],
  };

  const [
    projectViews,
    courseDetailViews,
    courseStarts,
    courseCompletions,
    utmSourceRows,
    utmCampaignRows,
    referrerRows,
    outboundClicks,
    outboundRows,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        ...baseWhere,
        eventName: "ecosystem_project_viewed",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        ...baseWhere,
        eventName: "course_detail_viewed",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        ...baseWhere,
        eventName: "course_started",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        ...baseWhere,
        eventName: "course_completed",
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...referredWhere,
        utmSource: { not: null },
      },
      select: { utmSource: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...referredWhere,
        utmCampaign: { not: null },
      },
      select: { utmCampaign: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...referredWhere,
        referrer: { not: null },
      },
      select: { referrer: true },
    }),
    prisma.analyticsEvent.count({
      where: {
        ...(occurredAt ? { occurredAt } : {}),
        ...(options.productId
          ? { ecosystemProjectId: options.productId }
          : {}),
        eventName: "ecosystem_project_referral_clicked",
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...(occurredAt ? { occurredAt } : {}),
        eventName: "ecosystem_project_referral_clicked",
        ecosystemProjectId: { not: null },
      },
      select: { ecosystemProjectId: true },
    }),
  ]);

  const productIds = [
    ...new Set(
      outboundRows
        .map((r) => r.ecosystemProjectId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  return {
    funnel: {
      projectViews,
      courseDetailViews,
      courseStarts,
      courseCompletions,
    },
    topUtmSources: aggregateCounts(
      utmSourceRows.map((r) => ({ key: r.utmSource }))
    ),
    topUtmCampaigns: aggregateCounts(
      utmCampaignRows.map((r) => ({ key: r.utmCampaign }))
    ),
    topReferrerDomains: aggregateCounts(
      referrerRows.map((r) => ({ key: parseReferrerDomain(r.referrer) }))
    ),
    outboundReferralClicks: outboundClicks,
    outboundByProduct: aggregateCounts(
      outboundRows.map((r) => ({
        key: r.ecosystemProjectId
          ? (productNameById.get(r.ecosystemProjectId) ??
            r.ecosystemProjectId)
          : null,
      })),
      20
    ),
  };
}

export async function listProductsForReferralFilter() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
