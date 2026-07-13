import { CourseAnalyticsView } from "@/components/analytics/course-analytics-view";
import type { CourseAnalytics } from "@/lib/analytics";
import type {
  AttemptsBeforePassBucket,
  QuizQuestionDiagnostic,
} from "@/lib/quiz-diagnostics-shared";

export function AnalyticsPanel({
  data,
  quizDiagnostics,
  attemptsBeforePass,
}: {
  data: CourseAnalytics;
  quizDiagnostics?: QuizQuestionDiagnostic[];
  attemptsBeforePass?: AttemptsBeforePassBucket[];
}) {
  return (
    <CourseAnalyticsView
      data={data}
      quizDiagnostics={quizDiagnostics}
      attemptsBeforePass={attemptsBeforePass}
    />
  );
}
