import Link from "next/link";
import type { ReadinessModelEval } from "@/lib/readiness-eval";
import {
  AnalyticsInfoTip,
  MetricHelpLabel,
} from "@/components/partner-console/analytics/analytics-info-tip";

export function AnalyticsReadinessView({
  productId,
  models,
}: {
  productId: string;
  models: ReadinessModelEval[];
}) {
  const settingsHref = `/partner-console/${productId}/analytics/settings`;

  if (models.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6">
        <h2 className="text-lg font-semibold tracking-tight">Readiness</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No readiness model found. Learning Readiness should seed automatically.
        </p>
        <Link href={settingsHref} className="mt-3 inline-block text-sm text-primary hover:underline">
          Open Analytics settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {models.map((model) => (
        <section key={model.modelId} className="space-y-6">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{model.name}</h2>
              {model.isDefault ? (
                <span className="text-xs text-muted-foreground">Default</span>
              ) : null}
            </div>
            {model.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{model.description}</p>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border px-3 py-2">
              <dt className="text-xs text-muted-foreground">
                <MetricHelpLabel helpKey="readiness_average_score">
                  Average score
                </MetricHelpLabel>
              </dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                {model.averageScore === null ? "—" : model.averageScore}
              </dd>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <dt className="text-xs text-muted-foreground">Level</dt>
              <dd className="mt-0.5 text-2xl font-semibold">
                {model.level?.label ?? "—"}
              </dd>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <dt className="text-xs text-muted-foreground">
                <MetricHelpLabel helpKey="ready_threshold">
                  Ready threshold
                </MetricHelpLabel>
              </dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                {model.readyThreshold}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight">
              Components
              <AnalyticsInfoTip helpKey="readiness_components" />
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              If a component isn’t set up yet, it scores a neutral 50 so missing
              setup doesn’t crash the model — finish setup for a real signal.
            </p>
            <ul className="mt-3 space-y-2">
              {model.components.map((c) => (
                <li
                  key={`${model.modelId}-${c.type}`}
                  className="rounded-lg border px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.score === null ? "—" : c.score} · weight{" "}
                      {Math.round(c.weight * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    Status: {c.status.replace("_", " ")}
                  </p>
                  {c.setupMessage ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {c.setupMessage}{" "}
                      {c.setupHref ? (
                        <Link
                          href={c.setupHref}
                          className="text-primary hover:underline"
                        >
                          Set up
                        </Link>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {model.levels.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Levels</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {model.levels.map((l) => (
                  <li key={l.id} className="rounded-md border px-2 py-1">
                    {l.label} ≥ {l.minScore}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}

      <p className="text-sm text-muted-foreground">
        Rename and reweight models in{" "}
        <Link href={settingsHref} className="text-primary hover:underline">
          Analytics settings
        </Link>
        .
      </p>
    </div>
  );
}
