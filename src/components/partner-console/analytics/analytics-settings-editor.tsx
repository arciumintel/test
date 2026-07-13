"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createConcept,
  deleteConcept,
  installAnalyticsPack,
  previewAnalyticsPackInstall,
  updateAnalyticsProfileConfig,
  updateEnabledMetricProviders,
  updateRecommendationPolicy,
  updateReadinessModel,
} from "@/app/actions/analytics-profile";
import { createCertification } from "@/app/actions/certifications";
import { setProductAnalyticsV2Flag } from "@/app/actions/analytics-v2";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AnalyticsInfoTip,
  MetricHelpLabel,
} from "@/components/partner-console/analytics/analytics-info-tip";
import { analyticsSectionLabel } from "@/lib/analytics-help";
import { ANALYTICS_SECTION_IDS } from "@/lib/analytics-packs";

type Terminology = {
  learnerLabel?: string;
  readinessLabel?: string;
  certificationLabel?: string;
  badgeLabel?: string;
};

type RecommendationPolicy = {
  funnelStageConversionMinPct?: number;
  criticalConceptMasteryMinPct?: number;
  questionMissRateMaxPct?: number;
  completionRateMinPct?: number;
  minVolumeForAlerts?: number;
  readinessScoreMin?: number;
  certificationAttainmentMinPct?: number;
};

type ConceptRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  importance: string;
  category: string | null;
};

type ReadinessRow = {
  id: string;
  name: string;
  description: string | null;
  readyThreshold: number;
  isDefault: boolean;
  requirements: Array<{ type: string; weight: number }>;
  levels: Array<{ id: string; label: string; minScore: number }>;
};

type PackInstall = {
  packId: string;
  packVersion: string;
};

type EnableableProvider = {
  id: string;
  displayName: string;
  metricIds: string[];
  partnerSafe: true;
  enableable: boolean;
};

export type AnalyticsSettingsEditorProps = {
  productId: string;
  canEditConfig: boolean;
  canEditSensitive: boolean;
  canEditPlatformTemplates: boolean;
  analyticsV2Enabled: boolean;
  terminology: Terminology;
  kpiSet: string[];
  sectionVisibility: string[];
  funnelStages: string[];
  recommendationPolicy: RecommendationPolicy;
  concepts: ConceptRow[];
  readinessModels: ReadinessRow[];
  packInstalls: PackInstall[];
  installablePacks: Array<{
    id: string;
    displayName: string;
    description: string;
    version: string;
  }>;
  enableableProviders: EnableableProvider[];
  enabledProviderIds: string[];
  certifications: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    requirementCount: number;
    awardCount: number;
  }>;
  courses: Array<{ id: string; title: string }>;
};

export function AnalyticsSettingsEditor({
  productId,
  canEditConfig,
  canEditSensitive,
  canEditPlatformTemplates,
  analyticsV2Enabled,
  terminology,
  kpiSet,
  sectionVisibility,
  funnelStages,
  recommendationPolicy,
  concepts,
  readinessModels,
  packInstalls,
  installablePacks,
  enableableProviders,
  enabledProviderIds,
  certifications,
  courses,
}: AnalyticsSettingsEditorProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [v2Enabled, setV2Enabled] = React.useState(analyticsV2Enabled);
  const [enabledProviders, setEnabledProviders] = React.useState<string[]>(
    enabledProviderIds
  );

  const [learnerLabel, setLearnerLabel] = React.useState(
    terminology.learnerLabel ?? "Learner"
  );
  const [readinessLabel, setReadinessLabel] = React.useState(
    terminology.readinessLabel ?? "Learning Readiness"
  );
  const [certificationLabel, setCertificationLabel] = React.useState(
    terminology.certificationLabel ?? "Certification"
  );
  const [badgeLabel, setBadgeLabel] = React.useState(
    terminology.badgeLabel ?? "Badge"
  );
  const [sections, setSections] = React.useState<string[]>(
    sectionVisibility.filter((id) => id !== "conversions")
  );
  const [kpiText, setKpiText] = React.useState(
    kpiSet.filter((id) => id !== "conversion_rate" && id !== "conversion_count").join("\n")
  );
  const [funnelText, setFunnelText] = React.useState(funnelStages.join("\n"));

  const [conceptName, setConceptName] = React.useState("");
  const [conceptImportance, setConceptImportance] = React.useState<
    "critical" | "core" | "supporting"
  >("core");

  const defaultReadiness = readinessModels.find((r) => r.isDefault) ?? readinessModels[0];
  const [readinessName, setReadinessName] = React.useState(
    defaultReadiness?.name ?? "Learning Readiness"
  );
  const [readinessThreshold, setReadinessThreshold] = React.useState(
    String(defaultReadiness?.readyThreshold ?? 70)
  );
  const [weights, setWeights] = React.useState(
    () =>
      defaultReadiness?.requirements ?? [
        { type: "course_completion", weight: 0.25 },
        { type: "quiz_performance", weight: 0.25 },
        { type: "concept_mastery", weight: 0.25 },
        { type: "required_path_completion", weight: 0.25 },
      ]
  );

  const [funnelMin, setFunnelMin] = React.useState(
    String(recommendationPolicy.funnelStageConversionMinPct ?? 50)
  );
  const [masteryMin, setMasteryMin] = React.useState(
    String(recommendationPolicy.criticalConceptMasteryMinPct ?? 60)
  );
  const [missMax, setMissMax] = React.useState(
    String(recommendationPolicy.questionMissRateMaxPct ?? 40)
  );
  const [completionMin, setCompletionMin] = React.useState(
    String(recommendationPolicy.completionRateMinPct ?? 20)
  );
  const [minVolume, setMinVolume] = React.useState(
    String(recommendationPolicy.minVolumeForAlerts ?? 10)
  );
  const [readinessMin, setReadinessMin] = React.useState(
    String(recommendationPolicy.readinessScoreMin ?? 50)
  );
  const [certMin, setCertMin] = React.useState(
    String(recommendationPolicy.certificationAttainmentMinPct ?? 10)
  );
  const [certName, setCertName] = React.useState("");
  const [certCourseId, setCertCourseId] = React.useState(courses[0]?.id ?? "");
  const [packNote, setPackNote] = React.useState<string | null>(null);

  async function run(action: () => Promise<{ error?: string; ok?: true }>) {
    setBusy(true);
    setError(null);
    const res = await action();
    setBusy(false);
    if (res && "error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function installPack(
    packId: string,
    terminologyResolution: "keep" | "overwrite" = "keep"
  ) {
    setBusy(true);
    setError(null);
    setPackNote(null);
    const preview = await previewAnalyticsPackInstall(productId, packId);
    if ("error" in preview) {
      setBusy(false);
      setError(preview.error);
      return;
    }
    const conflicts =
      (
        preview.preview as {
          terminologyConflicts?: Array<{ key: string; current: string; incoming: string }>;
        }
      )?.terminologyConflicts ?? [];
    if (conflicts.length > 0 && terminologyResolution === "keep") {
      setPackNote(
        `Terminology conflicts on ${conflicts.map((c) => c.key).join(", ")}. Installing with keep-existing. Use “Overwrite labels” to take pack terminology.`
      );
    }
    const res = await installAnalyticsPack(productId, packId, {
      terminologyResolution,
    });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (res.conflicts > 0) {
      setPackNote(
        `Merged pack with ${res.conflicts} terminology conflict(s) resolved as “${terminologyResolution}”.`
      );
    }
    router.refresh();
  }

  function toggleSection(id: string) {
    setSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!canEditConfig && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          You have Analyst access — configuration is read-only. Ask a Manager or
          Owner to change settings.
        </p>
      )}

      <FormSection
        title="Analytics experience"
        description="Run Analytics V2 (Overview / Courses / Recommendations) in parallel with Partner Analytics Plus. Leave off to keep the classic report."
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={v2Enabled}
            disabled={!canEditSensitive || busy}
            onChange={(e) => setV2Enabled(e.target.checked)}
          />
          <span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              Enable Analytics V2
              <AnalyticsInfoTip helpKey="settings_v2_flag" />
            </span>
            <span className="mt-0.5 block text-muted-foreground">
              Owner or Platform Admin only. Classic Plus remains available when
              this is off.
            </span>
          </span>
        </label>
        {canEditSensitive && (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const res = await setProductAnalyticsV2Flag(
                  productId,
                  v2Enabled
                );
                return res;
              })
            }
          >
            Save experience flag
          </Button>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Terminology & layout
            <AnalyticsInfoTip helpKey="settings_terminology" />
          </span>
        }
        description="Manager+ can rename labels and choose which analytics sections appear. Renaming does not change how metrics are calculated."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="term-learner">Learner label</Label>
            <Input
              id="term-learner"
              value={learnerLabel}
              disabled={!canEditConfig || busy}
              onChange={(e) => setLearnerLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-readiness">Readiness label</Label>
            <Input
              id="term-readiness"
              value={readinessLabel}
              disabled={!canEditConfig || busy}
              onChange={(e) => setReadinessLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-cert">Certification label</Label>
            <Input
              id="term-cert"
              value={certificationLabel}
              disabled={!canEditConfig || busy}
              onChange={(e) => setCertificationLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-badge">Badge label</Label>
            <Input
              id="term-badge"
              value={badgeLabel}
              disabled={!canEditConfig || busy}
              onChange={(e) => setBadgeLabel(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="inline-flex items-center gap-1.5">
            Dashboard sections
            <AnalyticsInfoTip helpKey="settings_sections" />
          </Label>
          <ul className="flex flex-wrap gap-2">
            {ANALYTICS_SECTION_IDS.filter((id) => id !== "conversions").map(
              (id) => {
              const active = sections.includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={!canEditConfig || busy}
                    onClick={() => toggleSection(id)}
                    className={
                      active
                        ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs"
                        : "rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {analyticsSectionLabel(id)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kpi-set" className="inline-flex items-center gap-1.5">
              KPI set (one id per line)
              <AnalyticsInfoTip helpKey="settings_kpi_set" />
            </Label>
            <Textarea
              id="kpi-set"
              rows={6}
              value={kpiText}
              disabled={!canEditConfig || busy}
              onChange={(e) => setKpiText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="funnel-stages">Funnel stages (one event per line)</Label>
            <Textarea
              id="funnel-stages"
              rows={6}
              value={funnelText}
              disabled={!canEditConfig || busy}
              onChange={(e) => setFunnelText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {canEditConfig && (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                updateAnalyticsProfileConfig(productId, {
                  terminology: {
                    learnerLabel,
                    readinessLabel,
                    certificationLabel,
                    badgeLabel,
                  },
                  sectionVisibility: sections,
                  kpiSet: kpiText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  funnelStages: funnelText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              )
            }
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Save terminology & layout
          </Button>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Concepts
            <AnalyticsInfoTip helpKey="importance" />
          </span>
        }
        description="Manager+ maintains the concept taxonomy used for tagging and mastery. Importance affects gap scoring (critical ≈ 1.5×, core ≈ 1×, supporting ≈ 0.6×)."
      >
        {concepts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No concepts yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {concepts.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.slug} · {c.importance}
                    {c.category ? ` · ${c.category}` : ""}
                  </p>
                </div>
                {canEditConfig && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => run(() => deleteConcept(productId, c.id))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEditConfig && (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder="New concept name"
              value={conceptName}
              disabled={busy}
              onChange={(e) => setConceptName(e.target.value)}
            />
            <Select
              value={conceptImportance}
              disabled={busy}
              onChange={(e) =>
                setConceptImportance(
                  e.target.value as "critical" | "core" | "supporting"
                )
              }
            >
              <option value="critical">Critical</option>
              <option value="core">Core</option>
              <option value="supporting">Supporting</option>
            </Select>
            <Button
              type="button"
              disabled={busy || !conceptName.trim()}
              onClick={() =>
                run(async () => {
                  const res = await createConcept(productId, {
                    name: conceptName,
                    importance: conceptImportance,
                  });
                  if (!("error" in res)) setConceptName("");
                  return res;
                })
              }
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Readiness model
            <AnalyticsInfoTip helpKey="settings_readiness_weights" />
          </span>
        }
        description="Owner+ only. Default Learning Readiness uses equal 20% weights across five components."
      >
        {!defaultReadiness ? (
          <p className="text-sm text-muted-foreground">
            No readiness model seeded yet.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ready-name">Model name</Label>
                <Input
                  id="ready-name"
                  value={readinessName}
                  disabled={!canEditSensitive || busy}
                  onChange={(e) => setReadinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ready-threshold"
                  className="inline-flex items-center gap-1.5"
                >
                  Ready threshold
                  <AnalyticsInfoTip helpKey="ready_threshold" />
                </Label>
                <Input
                  id="ready-threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={readinessThreshold}
                  disabled={!canEditSensitive || busy}
                  onChange={(e) => setReadinessThreshold(e.target.value)}
                />
              </div>
            </div>
            <ul className="space-y-2">
              {weights.map((req, index) => (
                <li key={req.type} className="grid grid-cols-[1fr_100px] items-center gap-3 text-sm">
                  <span className="font-mono text-xs">{req.type}</span>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    value={req.weight}
                    disabled={!canEditSensitive || busy}
                    onChange={(e) => {
                      const next = [...weights];
                      next[index] = {
                        ...req,
                        weight: Number(e.target.value),
                      };
                      setWeights(next);
                    }}
                  />
                </li>
              ))}
            </ul>
            {canEditSensitive && (
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    updateReadinessModel(productId, defaultReadiness.id, {
                      name: readinessName,
                      description: defaultReadiness.description,
                      readyThreshold: Number(readinessThreshold),
                      requirements: weights.map((w) => ({
                        type: w.type as
                          | "course_completion"
                          | "quiz_performance"
                          | "concept_mastery"
                          | "required_path_completion"
                          | "partner_conversion_events",
                        weight: w.weight,
                      })),
                      levels: defaultReadiness.levels,
                    })
                  )
                }
              >
                Save readiness model
              </Button>
            )}
            {!canEditSensitive && canEditConfig && (
              <p className="text-xs text-muted-foreground">
                Managers can view readiness but only Owners can change formulas.
              </p>
            )}
          </>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Partner conversion events
            <AnalyticsInfoTip helpKey="conversion_analytics" />
          </span>
        }
        description="Partner-defined conversion keys (for example docs visit or community join) are deferred to Analytics V2. Schema stubs remain for future use; they are not tracked or configurable in V1."
      >
        <p className="text-sm text-muted-foreground">
          Implementation planned for V2.
        </p>
      </FormSection>

      <FormSection
        title="Certifications"
        description="Competency credentials — distinct from course badges. Awards are never auto-promoted from BadgeAward."
      >
        {certifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No certifications yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {certifications.map((c) => (
              <li key={c.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs capitalize text-muted-foreground">
                  {c.status} · {c.requirementCount} requirements · {c.awardCount}{" "}
                  awards
                </span>
              </li>
            ))}
          </ul>
        )}
        {canEditConfig && (
          <div className="mt-4 space-y-3 rounded-md border border-dashed p-3">
            <div className="space-y-2">
              <Label htmlFor="cert-name">Name</Label>
              <Input
                id="cert-name"
                value={certName}
                disabled={busy}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="Foundations Certified"
              />
            </div>
            {courses.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="cert-course">Required course completion</Label>
                <Select
                  id="cert-course"
                  value={certCourseId}
                  disabled={busy}
                  onChange={(e) => setCertCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Publish a course first to attach a course_completion requirement.
              </p>
            )}
            <Button
              type="button"
              disabled={busy || !certName.trim()}
              onClick={() =>
                run(() =>
                  createCertification(productId, {
                    name: certName.trim(),
                    status: "published",
                    requirements:
                      certCourseId
                        ? [
                            {
                              type: "course_completion",
                              label: "Complete required course",
                              config: { courseId: certCourseId },
                              weight: 1,
                            },
                          ]
                        : [],
                  })
                )
              }
            >
              <Plus className="size-4" />
              Create certification
            </Button>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Recommendation thresholds"
        description="Owner+ tunes when recommendations fire."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              [
                "Funnel stage min %",
                funnelMin,
                setFunnelMin,
                "settings_threshold_funnel_drop" as const,
              ],
              [
                "Critical mastery min %",
                masteryMin,
                setMasteryMin,
                "settings_threshold_critical_mastery" as const,
              ],
              [
                "Question miss max %",
                missMax,
                setMissMax,
                "settings_threshold_miss_rate" as const,
              ],
              [
                "Completion min %",
                completionMin,
                setCompletionMin,
                "settings_threshold_completion" as const,
              ],
              ["Min volume for alerts", minVolume, setMinVolume, null],
              [
                "Readiness score min",
                readinessMin,
                setReadinessMin,
                "settings_threshold_readiness" as const,
              ],
              ["Certification attainment min %", certMin, setCertMin, null],
            ] as const
          ).map(([label, value, setter, helpKey]) => (
            <div key={label} className="space-y-2">
              <Label className="inline-flex items-center gap-1.5">
                {helpKey ? (
                  <MetricHelpLabel helpKey={helpKey}>{label}</MetricHelpLabel>
                ) : (
                  label
                )}
              </Label>
              <Input
                type="number"
                value={value}
                disabled={!canEditSensitive || busy}
                onChange={(e) => setter(e.target.value)}
              />
            </div>
          ))}
        </div>
        {canEditSensitive && (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                updateRecommendationPolicy(productId, {
                  funnelStageConversionMinPct: Number(funnelMin),
                  criticalConceptMasteryMinPct: Number(masteryMin),
                  questionMissRateMaxPct: Number(missMax),
                  completionRateMinPct: Number(completionMin),
                  minVolumeForAlerts: Number(minVolume),
                  readinessScoreMin: Number(readinessMin),
                  certificationAttainmentMinPct: Number(certMin),
                })
              )
            }
          >
            Save thresholds
          </Button>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Custom metric providers
            <AnalyticsInfoTip helpKey="settings_custom_providers" />
          </span>
        }
        description="Owner+ enables advanced providers. Core metrics are always on. All custom metrics are partner-safe aggregates for this project only."
      >
        {enableableProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No optional providers are available for this project yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {enableableProviders.map((provider) => {
              const checked = enabledProviders.includes(provider.id);
              return (
                <li
                  key={provider.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{provider.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Metrics: {provider.metricIds.join(", ")}
                    </p>
                  </div>
                  {canEditSensitive ? (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...enabledProviders, provider.id]
                            : enabledProviders.filter(
                                (id) => id !== provider.id
                              );
                          setEnabledProviders(next);
                        }}
                      />
                      Enabled
                    </label>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {checked ? "Enabled" : "Off"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {canEditSensitive && enableableProviders.length > 0 && (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                updateEnabledMetricProviders(productId, {
                  providerIds: enabledProviders,
                })
              )
            }
          >
            Save providers
          </Button>
        )}
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Analytics packs
            <AnalyticsInfoTip helpKey="settings_packs" />
          </span>
        }
        description="Owner+ installs packs. Merge unions sections/KPIs; terminology conflicts need Owner review (keep vs overwrite)."
      >
        {packNote ? (
          <p className="text-sm text-muted-foreground">{packNote}</p>
        ) : null}
        <ul className="space-y-2 text-sm">
          {packInstalls.map((p) => (
            <li key={p.packId} className="rounded-md border px-3 py-2">
              Installed: <span className="font-medium">{p.packId}</span> v
              {p.packVersion}
            </li>
          ))}
        </ul>
        {canEditSensitive &&
          installablePacks.map((pack) => (
            <div key={pack.id} className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => installPack(pack.id, "keep")}
              >
                Install {pack.displayName} ({pack.version})
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => installPack(pack.id, "overwrite")}
              >
                Overwrite labels
              </Button>
            </div>
          ))}
        {canEditPlatformTemplates && (
          <p className="text-xs text-muted-foreground">
            Platform Admin: pack manifests live in{" "}
            <code className="font-mono">src/lib/analytics-packs.ts</code>.
          </p>
        )}
      </FormSection>
    </div>
  );
}
