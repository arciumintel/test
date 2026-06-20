import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { PartnerAnalyticsCourseDetail } from "@/components/partner-console/analytics/partner-analytics-course-detail";
import {
  PartnerAnalyticsDateRange,
  PartnerAnalyticsPrivacyNote,
} from "@/components/partner-console/analytics/partner-analytics-shared";
import {
  parseAnalyticsRangePreset,
  resolveAnalyticsDateRange,
} from "@/lib/analytics-date-range";
import { getPartnerPlusCourseAnalytics } from "@/lib/partner-analytics";
import { formatCourseStatus } from "@/lib/course-status";
import type { CourseStatus } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string; courseId: string }>;
}) {
  const { courseId, productId } = await params;
  const data = await getPartnerPlusCourseAnalytics(
    productId,
    courseId,
    resolveAnalyticsDateRange("all")
  );
  return {
    title: data ? `Analytics: ${data.title}` : "Course analytics",
  };
}

export default async function PartnerCourseAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string; courseId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { productId, courseId } = await params;
  const { range: rangeParam } = await searchParams;
  const preset = parseAnalyticsRangePreset(rangeParam);
  const range = resolveAnalyticsDateRange(preset);
  const basePath = `/partner-console/${productId}/analytics/courses/${courseId}`;

  let data: Awaited<ReturnType<typeof getPartnerPlusCourseAnalytics>> = null;
  let loadError = false;
  try {
    data = await getPartnerPlusCourseAnalytics(productId, courseId, range);
  } catch {
    loadError = true;
  }

  if (!loadError && !data) notFound();

  return (
    <>
      <Link
        href={`/partner-console/${productId}/analytics?range=${preset}`}
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Project analytics
      </Link>

      {data && (
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
          <Badge variant="secondary" className="capitalize">
            {formatCourseStatus(data.status as CourseStatus)}
          </Badge>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PartnerAnalyticsPrivacyNote />
        <Suspense fallback={null}>
          <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
        </Suspense>
      </div>

      <div className="mt-8">
        {loadError ? (
          <HomeSectionLoadError
            title="Course analytics did not load"
            description="Try refreshing the page, or check back in a few minutes."
          />
        ) : data ? (
          <PartnerAnalyticsCourseDetail data={data} />
        ) : null}
      </div>
    </>
  );
}
