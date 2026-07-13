"use server";

import { redirect } from "next/navigation";
import { parseAnalyticsRangePreset } from "@/lib/analytics-date-range";

/** Legacy route — exports live on Analytics overview as an action. */
export default async function PartnerAnalyticsReportsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ range?: string; compare?: string }>;
}) {
  const { productId } = await params;
  const { range: rangeParam, compare: compareParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const compare = compareParam ?? "none";
  redirect(
    `/partner-console/${productId}/analytics?range=${preset}&compare=${compare}`
  );
}
