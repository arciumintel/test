import Link from "next/link";
import type { AnalyticsRecommendation } from "@/lib/analytics-recommendations";
import { AnalyticsInfoTip } from "@/components/partner-console/analytics/analytics-info-tip";

export function AnalyticsRecommendationsView({
  recommendations,
}: {
  recommendations: AnalyticsRecommendation[];
}) {
  const groups: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          Recommendations
          <AnalyticsInfoTip helpKey="recommendation_priority" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritized actions from your analytics.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recommendations for this period. Try a wider date range or wait for
          more learner activity.
        </p>
      ) : (
        groups.map((priority) => {
          const items = recommendations.filter((r) => r.priority === priority);
          if (items.length === 0) return null;
          return (
            <section key={priority}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {priority} priority
              </h3>
              <ul className="mt-3 space-y-3">
                {items.map((rec) => (
                  <li key={rec.id} className="rounded-lg border px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rec.category}
                    </p>
                    <p className="mt-1 font-medium">{rec.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rec.rationale}
                    </p>
                    <Link
                      href={rec.href}
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      {rec.evidenceLabel ?? "View evidence"}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
