import Link from "next/link";
import { AnalyticsSettingsEditor } from "@/components/partner-console/analytics/analytics-settings-editor";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { getAnalyticsSettingsData } from "@/app/actions/analytics-profile";

export const metadata = { title: "Analytics settings" };

export default async function PartnerAnalyticsSettingsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const data = await getAnalyticsSettingsData(productId);

  if ("error" in data) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">
          Analytics settings
        </h1>
        <div className="mt-8">
          <HomeSectionLoadError
            title="Analytics settings did not load"
            description={data.error}
          />
        </div>
      </>
    );
  }

  const { bundle } = data;
  const terminology =
    (bundle.profile.terminology as Record<string, string> | null) ?? {};
  const recommendationPolicy =
    (bundle.profile.recommendationPolicy as Record<string, number> | null) ??
    {};

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/partner-console/${productId}/analytics`}
              className="hover:text-foreground"
            >
              Analytics
            </Link>
            <span className="mx-1.5">/</span>
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Analytics settings
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Configure concepts, terminology, readiness, and conversions for this
            project. Role: {data.accessLevel.replace("_", " ")}.
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <AnalyticsSettingsEditor
          productId={productId}
          canEditConfig={data.canEditConfig}
          canEditSensitive={data.canEditSensitive}
          canEditPlatformTemplates={data.canEditPlatformTemplates}
          analyticsV2Enabled={data.analyticsV2Enabled}
          terminology={terminology}
          kpiSet={bundle.profile.kpiSet}
          sectionVisibility={bundle.profile.sectionVisibility}
          funnelStages={bundle.profile.funnelStages}
          recommendationPolicy={recommendationPolicy}
          concepts={bundle.concepts.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            importance: c.importance,
            category: c.category,
          }))}
          conversions={bundle.conversions.map((c) => ({
            id: c.id,
            key: c.key,
            label: c.label,
            eventName: c.eventName,
            description: c.description,
          }))}
          readinessModels={bundle.readinessModels.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            readyThreshold: r.readyThreshold,
            isDefault: r.isDefault,
            requirements: (r.requirements as Array<{
              type: string;
              weight: number;
            }>) ?? [],
            levels: (r.levels as Array<{
              id: string;
              label: string;
              minScore: number;
            }>) ?? [],
          }))}
          packInstalls={bundle.packInstalls.map((p) => ({
            packId: p.packId,
            packVersion: p.packVersion,
          }))}
          installablePacks={data.installablePacks}
          enableableProviders={data.enableableProviders}
          enabledProviderIds={data.enabledProviderIds}
          certifications={data.certifications.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            status: c.status,
            requirementCount: c.requirements.length,
            awardCount: c._count.awards,
          }))}
          courses={data.courses}
        />
      </div>
    </>
  );
}
