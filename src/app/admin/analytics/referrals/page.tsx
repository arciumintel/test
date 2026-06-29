import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PartnerAnalyticsDateRange } from "@/components/partner-console/analytics/partner-analytics-shared";
import { prisma } from "@/lib/prisma";
import {
  getReferralAnalytics,
  listProductsForReferralFilter,
} from "@/lib/referral-analytics";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";

export const metadata: Metadata = { title: "Referral analytics · Admin" };

function CountBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function ReferralAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; product?: string }>;
}) {
  const params = await searchParams;
  const preset = parseAnalyticsRangePreset(params.range);
  const range = resolveAnalyticsDateRange(preset);
  const productId = params.product?.trim() || null;

  const [analytics, products] = await Promise.all([
    getReferralAnalytics({ range, productId }),
    listProductsForReferralFilter(),
  ]);

  const selectedProduct = productId
    ? products.find((p) => p.id === productId)
    : null;

  const funnelMax = Math.max(
    analytics.funnel.projectViews,
    analytics.funnel.courseDetailViews,
    analytics.funnel.courseStarts,
    analytics.funnel.courseCompletions,
    1
  );

  const basePath = "/admin/analytics/referrals";

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Referral attribution
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inbound UTM and referrer performance · {range.label}
            {selectedProduct ? ` · ${selectedProduct.name}` : ""}
          </p>
        </div>
        <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <input type="hidden" name="range" value={preset} />
        <div className="grid gap-1.5">
          <Label htmlFor="product-filter">Project</Label>
          <select
            id="product-filter"
            name="product"
            defaultValue={productId ?? ""}
            className="h-9 min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All projects</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply
        </button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inbound funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CountBar
              label="Project page views"
              value={analytics.funnel.projectViews}
              max={funnelMax}
            />
            <CountBar
              label="Course detail views"
              value={analytics.funnel.courseDetailViews}
              max={funnelMax}
            />
            <CountBar
              label="Course starts"
              value={analytics.funnel.courseStarts}
              max={funnelMax}
            />
            <CountBar
              label="Course completions"
              value={analytics.funnel.courseCompletions}
              max={funnelMax}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outbound referral clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {analytics.outboundReferralClicks}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clicks on ecosystem project referral links
            </p>
            {analytics.outboundByProduct.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {analytics.outboundByProduct.map((row) => (
                  <li
                    key={row.label}
                    className="flex justify-between gap-2 text-muted-foreground"
                  >
                    <span className="truncate">{row.label}</span>
                    <span className="tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top UTM sources</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topUtmSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No UTM data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {analytics.topUtmSources.map((row) => (
                  <li key={row.label} className="flex justify-between gap-2">
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top UTM campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topUtmCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaign data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {analytics.topUtmCampaigns.map((row) => (
                  <li key={row.label} className="flex justify-between gap-2">
                    <span>{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top referrer domains</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topReferrerDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No referrer data yet.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {analytics.topReferrerDomains.map((row) => (
                  <li
                    key={row.label}
                    className="flex justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Aggregate metrics only — wallet addresses are never shown. Partner console
        remains UTM-free per product policy.
      </p>
    </>
  );
}
