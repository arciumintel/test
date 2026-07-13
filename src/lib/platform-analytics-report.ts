import "server-only";

import { prisma } from "@/lib/prisma";
import type { AnalyticsDateRange } from "@/lib/analytics-date-range";
import {
  getPlatformSummary,
  getProductAnalytics,
  type ProductAnalytics,
  type ProductCourseMetric,
} from "@/lib/analytics";
import {
  getReferralAnalytics,
  type ReferralAnalytics,
} from "@/lib/referral-analytics";
import {
  buildHtmlDocument,
  formatNullablePct,
  formatNumber,
  renderChartPlaceholder,
  renderKpiGrid,
  renderSection,
  renderTable,
  type ChartConfig,
} from "@/lib/analytics-html-report";

export type PlatformAnalyticsReport = {
  rangeLabel: string;
  summary: {
    learners: number;
    published: number;
    completions: number;
    badges: number;
  };
  products: ProductAnalytics[];
  courses: (ProductCourseMetric & {
    productName: string;
    productSlug: string;
  })[];
  referrals: ReferralAnalytics;
};

export async function getPlatformAnalyticsReport(
  range: AnalyticsDateRange
): Promise<PlatformAnalyticsReport> {
  const [summary, products, referrals] = await Promise.all([
    getPlatformSummary(),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true },
    }),
    getReferralAnalytics({ range }),
  ]);

  const productAnalytics = (
    await Promise.all(
      products.map((p) => getProductAnalytics(p.id, { range }))
    )
  ).filter((p): p is ProductAnalytics => p !== null);

  const courses = productAnalytics.flatMap((p) =>
    p.courses.map((c) => ({
      ...c,
      productName: p.productName,
      productSlug: p.productSlug,
    }))
  );

  return {
    rangeLabel: range.label,
    summary,
    products: productAnalytics,
    courses,
    referrals,
  };
}

export function platformAnalyticsReportToHtml(
  data: PlatformAnalyticsReport
): string {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const charts: ChartConfig[] = [];

  const productsWithActivity = data.products.filter(
    (p) => p.starts > 0 || p.completions > 0
  );

  if (productsWithActivity.length > 0) {
    charts.push({
      id: "platform-products",
      type: "bar",
      labels: productsWithActivity.map((p) => p.productName),
      datasets: [
        { label: "Starts", data: productsWithActivity.map((p) => p.starts) },
        {
          label: "Completions",
          data: productsWithActivity.map((p) => p.completions),
        },
      ],
      heightClass: productsWithActivity.length > 5 ? "tall" : "",
    });
  }

  const funnel = data.referrals.funnel;
  charts.push({
    id: "platform-referral-funnel",
    type: "bar",
    indexAxis: "y",
    labels: [
      "Project views",
      "Course detail views",
      "Course starts",
      "Completions",
    ],
    datasets: [
      {
        label: "Count",
        data: [
          funnel.projectViews,
          funnel.courseDetailViews,
          funnel.courseStarts,
          funnel.courseCompletions,
        ],
      },
    ],
    heightClass: "short",
  });

  if (data.referrals.topUtmSources.length > 0) {
    charts.push({
      id: "platform-utm-sources",
      type: "bar",
      labels: data.referrals.topUtmSources.map((r) => r.label),
      datasets: [
        {
          label: "Events",
          data: data.referrals.topUtmSources.map((r) => r.count),
        },
      ],
      heightClass: "short",
    });
  }

  if (data.referrals.topUtmCampaigns.length > 0) {
    charts.push({
      id: "platform-utm-campaigns",
      type: "bar",
      labels: data.referrals.topUtmCampaigns.map((r) => r.label),
      datasets: [
        {
          label: "Events",
          data: data.referrals.topUtmCampaigns.map((r) => r.count),
        },
      ],
      heightClass: "short",
    });
  }

  if (data.referrals.topReferrerDomains.length > 0) {
    charts.push({
      id: "platform-referrers",
      type: "bar",
      labels: data.referrals.topReferrerDomains.map((r) => r.label),
      datasets: [
        {
          label: "Events",
          data: data.referrals.topReferrerDomains.map((r) => r.count),
        },
      ],
      heightClass: "short",
    });
  }

  if (data.referrals.outboundByProduct.length > 0) {
    charts.push({
      id: "platform-outbound",
      type: "bar",
      labels: data.referrals.outboundByProduct.map((r) => r.label),
      datasets: [
        {
          label: "Clicks",
          data: data.referrals.outboundByProduct.map((r) => r.count),
        },
      ],
      heightClass: "short",
    });
  }

  const summarySection = renderSection(
    "Platform summary",
    renderKpiGrid([
      { label: "Learners", value: formatNumber(data.summary.learners) },
      {
        label: "Published courses",
        value: formatNumber(data.summary.published),
      },
      {
        label: "Completions",
        value: formatNumber(data.summary.completions),
      },
      {
        label: "Badge definitions",
        value: formatNumber(data.summary.badges),
      },
    ])
  );

  const productsTable = renderTable(
    [
      { key: "name", label: "Product" },
      { key: "published", label: "Published", align: "right" },
      { key: "starts", label: "Starts", align: "right" },
      { key: "completions", label: "Completions", align: "right" },
      { key: "rate", label: "Completion %", align: "right" },
      { key: "badges", label: "Badges", align: "right" },
    ],
    data.products.map((p) => ({
      name: p.productName,
      published: p.publishedCourses,
      starts: p.starts,
      completions: p.completions,
      rate: `${p.completionRate}%`,
      badges: p.badgeAwards,
    }))
  );

  const productsSection = renderSection(
    "Products",
    `${productsTable}${
      charts.some((c) => c.id === "platform-products")
        ? renderChartPlaceholder({
            id: "platform-products",
            type: "bar",
            labels: [],
            datasets: [],
          })
        : ""
    }`
  );

  const coursesTable = renderTable(
    [
      { key: "product", label: "Product" },
      { key: "title", label: "Course" },
      { key: "status", label: "Status" },
      { key: "starts", label: "Starts", align: "right" },
      { key: "completions", label: "Completions", align: "right" },
      { key: "badges", label: "Badges", align: "right" },
      { key: "pass", label: "Quiz pass", align: "right" },
    ],
    data.courses.map((c) => ({
      product: c.productName,
      title: c.title,
      status: c.status,
      starts: c.starts,
      completions: c.completions,
      badges: c.badgeAwards,
      pass: formatNullablePct(c.quizPassRate),
    }))
  );

  const coursesSection = renderSection("Courses", coursesTable);

  const referralKpis = renderKpiGrid([
    {
      label: "Project views",
      value: formatNumber(funnel.projectViews),
    },
    {
      label: "Course detail views",
      value: formatNumber(funnel.courseDetailViews),
    },
    {
      label: "Course starts",
      value: formatNumber(funnel.courseStarts),
    },
    {
      label: "Completions",
      value: formatNumber(funnel.courseCompletions),
    },
    {
      label: "Outbound referral clicks",
      value: formatNumber(data.referrals.outboundReferralClicks),
    },
  ]);

  const referralFunnelChart = renderChartPlaceholder({
    id: "platform-referral-funnel",
    type: "bar",
    labels: [],
    datasets: [],
    heightClass: "short",
  });

  const utmSources =
    data.referrals.topUtmSources.length > 0
      ? `<div>
  <p class="muted" style="margin:1rem 0 0.25rem;font-size:0.75rem;font-weight:600;">Top UTM sources</p>
  ${renderChartPlaceholder({
    id: "platform-utm-sources",
    type: "bar",
    labels: [],
    datasets: [],
    heightClass: "short",
  })}
</div>`
      : "";

  const utmCampaigns =
    data.referrals.topUtmCampaigns.length > 0
      ? `<div>
  <p class="muted" style="margin:1rem 0 0.25rem;font-size:0.75rem;font-weight:600;">Top UTM campaigns</p>
  ${renderChartPlaceholder({
    id: "platform-utm-campaigns",
    type: "bar",
    labels: [],
    datasets: [],
    heightClass: "short",
  })}
</div>`
      : "";

  const referrers =
    data.referrals.topReferrerDomains.length > 0
      ? `<div>
  <p class="muted" style="margin:1rem 0 0.25rem;font-size:0.75rem;font-weight:600;">Top referrer domains</p>
  ${renderChartPlaceholder({
    id: "platform-referrers",
    type: "bar",
    labels: [],
    datasets: [],
    heightClass: "short",
  })}
</div>`
      : "";

  const outbound =
    data.referrals.outboundByProduct.length > 0
      ? `<div>
  <p class="muted" style="margin:1rem 0 0.25rem;font-size:0.75rem;font-weight:600;">Outbound clicks by product</p>
  ${renderChartPlaceholder({
    id: "platform-outbound",
    type: "bar",
    labels: [],
    datasets: [],
    heightClass: "short",
  })}
</div>`
      : "";

  const referralsSection = renderSection(
    "Referral attribution",
    `${referralKpis}${referralFunnelChart}<div class="two-col">${utmSources}${utmCampaigns}</div>${referrers}${outbound}`
  );

  const bodyHtml = [
    summarySection,
    productsSection,
    coursesSection,
    referralsSection,
  ].join("\n");

  return buildHtmlDocument({
    title: "Platform Analytics",
    subtitle: "Arcademy staff report",
    generatedAt,
    rangeLabel: data.rangeLabel,
    bodyHtml,
    charts,
    footerNote:
      "Includes platform KPIs, product and course rollups, and referral attribution for the selected period.",
  });
}
