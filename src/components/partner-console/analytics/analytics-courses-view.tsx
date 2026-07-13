import Link from "next/link";
import type { ProductCourseMetric } from "@/lib/analytics";

export function AnalyticsCoursesView({
  productId,
  courses,
}: {
  productId: string;
  courses: ProductCourseMetric[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Courses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which courses under or over perform?
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Starts</th>
              <th className="px-3 py-2 font-medium">Completions</th>
              <th className="px-3 py-2 font-medium">Completion %</th>
              <th className="px-3 py-2 font-medium">Badges</th>
              <th className="px-3 py-2 font-medium">Quiz pass %</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.courseId} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link
                    href={`/partner-console/${productId}/analytics/courses/${course.courseId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {course.title}
                  </Link>
                </td>
                <td className="px-3 py-2 tabular-nums">{course.starts}</td>
                <td className="px-3 py-2 tabular-nums">{course.completions}</td>
                <td className="px-3 py-2 tabular-nums">
                  {course.starts > 0
                    ? Math.round((course.completions / course.starts) * 100)
                    : 0}
                  %
                </td>
                <td className="px-3 py-2 tabular-nums">{course.badgeAwards}</td>
                <td className="px-3 py-2 tabular-nums">
                  {course.quizPassRate === null
                    ? "—"
                    : `${course.quizPassRate}%`}
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No published courses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
