import Link from "next/link";
import { Suspense } from "react";
import { AnalyticsExportAction } from "@/components/partner-console/analytics/analytics-export-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  try {
    const data = await getPartnerPlusCourseAnalytics(
      productId,
      courseId,
      resolveAnalyticsDateRange("all")
    );
    return {
      title: data ? `Analytics: ${data.title}` : "Course analytics",
    };
  } catch {
    return { title: "Course analytics" };
  }
}

function CourseAnalyticsBreadcrumb({
  productId,
  preset,
  courseTitle,
}: {
  productId: string;
  preset: string;
  courseTitle?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <Link
        href={`/partner-console/${productId}/analytics/courses?range=${preset}`}
        className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        Courses
      </Link>
      {courseTitle && (
        <>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-foreground">{courseTitle}</span>
        </>
      )}
    </nav>
  );
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
  const analyticsPath = `/partner-console/${productId}/analytics?range=${preset}`;

  let data: Awaited<ReturnType<typeof getPartnerPlusCourseAnalytics>> = null;
  let loadError = false;
  try {
    data = await getPartnerPlusCourseAnalytics(productId, courseId, range);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <>
        <CourseAnalyticsBreadcrumb productId={productId} preset={preset} />
        <h1 className="text-2xl font-semibold tracking-tight">
          Course analytics
        </h1>
        <div className="mt-8">
          <HomeSectionLoadError
            title="Course analytics did not load"
            description="Try refreshing the page, or check back in a few minutes."
          />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <CourseAnalyticsBreadcrumb productId={productId} preset={preset} />
        <h1 className="text-2xl font-semibold tracking-tight">
          Course analytics
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Metrics for {range.label}
        </p>
        <Card className="mt-8">
          <CardContent className="py-8 text-center">
            <p className="font-medium">Course not found</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              This course is missing or does not belong to your project.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={analyticsPath}>Back to project analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <CourseAnalyticsBreadcrumb
        productId={productId}
        preset={preset}
        courseTitle={data.title}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.title}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {formatCourseStatus(data.status as CourseStatus)}
            </Badge>
          </div>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Course metrics for {range.label}.
          </p>
        </div>
        <Suspense fallback={null}>
          <PartnerAnalyticsDateRange basePath={basePath} current={preset} />
        </Suspense>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <PartnerAnalyticsPrivacyNote />
        <AnalyticsExportAction
          productId={productId}
          rangePreset={preset}
          compareBaseline="none"
          scope="course"
          courseId={courseId}
        />
      </div>

      <div className="mt-8">
        <PartnerAnalyticsCourseDetail data={data} />
      </div>
    </>
  );
}
