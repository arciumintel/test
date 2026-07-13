import { AnalyticsSubnav } from "@/components/partner-console/analytics/analytics-subnav";
import { isAnalyticsV2Enabled } from "@/lib/analytics-feature-flags";
import { ensureAnalyticsProfileForProduct } from "@/lib/analytics-profile";

export default async function PartnerAnalyticsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  try {
    await ensureAnalyticsProfileForProduct(productId);
  } catch {
    // best-effort
  }

  const v2 = await isAnalyticsV2Enabled(productId);

  return (
    <div>
      {v2 ? <AnalyticsSubnav productId={productId} /> : null}
      <div className={v2 ? "mt-6" : undefined}>{children}</div>
    </div>
  );
}
