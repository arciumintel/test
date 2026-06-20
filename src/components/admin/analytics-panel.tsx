import { CourseAnalyticsView } from "@/components/analytics/course-analytics-view";
import type { CourseAnalytics } from "@/lib/analytics";

export function AnalyticsPanel({ data }: { data: CourseAnalytics }) {
  return <CourseAnalyticsView data={data} />;
}
