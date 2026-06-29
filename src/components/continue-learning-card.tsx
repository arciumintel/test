import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { coursePath } from "@/lib/paths";
import type { LearnerCourseProgress } from "@/lib/learner-progress";

type ContinueLearningCardProps = {
  course: LearnerCourseProgress;
};

function resumeLabel(course: LearnerCourseProgress): string {
  if (course.completedLessons < course.totalLessons) return "Resume lesson";
  if (course.pct < 100) return "Take quiz";
  return "Continue";
}

export function ContinueLearningCard({ course }: ContinueLearningCardProps) {
  return (
    <section
      aria-labelledby="continue-learning-heading"
      className="border-b bg-muted/20"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Card className="overflow-hidden border-info/20">
          <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p
                id="continue-learning-heading"
                className="text-xs font-medium uppercase tracking-wide text-info"
              >
                Continue where you left off
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                {course.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.productName}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={course.pct} className="max-w-xs flex-1" />
                <span className="shrink-0 text-xs font-medium text-xp">
                  {course.pct}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button asChild>
                <Link href={course.resumeHref}>
                  {resumeLabel(course)}
                  <ArrowRight />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={coursePath(course.productSlug, course.slug)}>
                  Course overview
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
