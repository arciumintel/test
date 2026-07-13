import Link from "next/link";
import type { CertificationAnalytics } from "@/lib/certifications";
import {
  AnalyticsInfoTip,
  MetricHelpLabel,
} from "@/components/partner-console/analytics/analytics-info-tip";

export function AnalyticsCertificationsView({
  productId,
  data,
}: {
  productId: string;
  data: CertificationAnalytics;
}) {
  const settingsHref = `/partner-console/${productId}/analytics/settings`;

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Certifications validate competency. Badge awards remain progress signals
        under Courses / Overview — they are never auto-promoted to certifications.
      </p>

      {data.setupNeeded ? (
        <div className="rounded-lg border border-dashed px-4 py-6">
          <h2 className="text-lg font-semibold tracking-tight">
            No certifications yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.setupMessage}</p>
          <Link
            href={settingsHref}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Configure certifications
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Credential funnel</h2>
        <ol className="mt-4 space-y-2">
          {data.funnel.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-1">
                  {step.label}
                  {step.label === "Published certifications configured" ? (
                    <AnalyticsInfoTip helpKey="certifications_configured" />
                  ) : null}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {step.count}
                  {step.rateFromPrevious !== null
                    ? ` · ${step.rateFromPrevious}%`
                    : ""}
                </span>
              </li>
            ))}
        </ol>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
              Attainment
              <AnalyticsInfoTip helpKey="attainment" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.awardsInRange} awards in period · {data.certificateViewsInRange}{" "}
              certificate views
            </p>
          </div>
          <Link href={settingsHref} className="text-sm text-primary hover:underline">
            Manage definitions
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Certification</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Requirements</th>
                <th className="px-3 py-2 font-medium">Awards (period)</th>
                <th className="px-3 py-2 font-medium">All-time</th>
                <th className="px-3 py-2 font-medium">
                  <MetricHelpLabel helpKey="attainment">Attainment</MetricHelpLabel>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.certifications.map((c) => (
                <tr key={c.certificationId} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">
                    {c.status}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{c.requirementCount}</td>
                  <td className="px-3 py-2 tabular-nums">{c.awardsInRange}</td>
                  <td className="px-3 py-2 tabular-nums">{c.awardsAllTime}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {c.attainmentRatePct === null
                      ? "—"
                      : `${c.attainmentRatePct}%`}
                  </td>
                </tr>
              ))}
              {data.certifications.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No certifications configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
