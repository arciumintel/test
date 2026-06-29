import {
  CheckCircle2,
  Circle,
  HelpCircle,
  Lock,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CourseModuleOutlineGroup } from "@/lib/courses";

type CourseModuleOutlineProps = {
  groups: CourseModuleOutlineGroup[];
  completedLessonIds: Set<string>;
  finalQuiz?: { passThreshold: number } | null;
  finalQuizPassed?: boolean;
  locked?: boolean;
  renderLessonLabel?: (
    lesson: { id: string; title: string; order: number },
    index: number
  ) => ReactNode;
};

export function CourseModuleOutline({
  groups,
  completedLessonIds,
  finalQuiz,
  finalQuizPassed = false,
  locked = false,
  renderLessonLabel,
}: CourseModuleOutlineProps) {
  let lessonCounter = 0;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id ?? "ungrouped"} className="overflow-hidden rounded-xl border">
          {groups.length > 1 && (
            <div className="border-b bg-muted/30 px-4 py-2.5">
              <h3 className="text-sm font-semibold">{group.title}</h3>
            </div>
          )}
          {group.lessons.map((lesson) => {
            lessonCounter += 1;
            const done = completedLessonIds.has(lesson.id);
            const label = renderLessonLabel
              ? renderLessonLabel(lesson, lessonCounter - 1)
              : `Lesson ${lessonCounter}: ${lesson.title}`;

            return (
              <div
                key={lesson.id}
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3 last:border-b-0",
                  locked && !done && "bg-warning/5"
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : locked ? (
                  <Lock className="size-5 shrink-0 text-warning" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm">{label}</span>
              </div>
            );
          })}
        </div>
      ))}

      {finalQuiz && (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center gap-3 bg-info/5 px-4 py-3">
            {finalQuizPassed ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" />
            ) : (
              <HelpCircle className="size-5 shrink-0 text-info" />
            )}
            <span className="flex-1 text-sm font-medium">
              Final quiz
              <span className="ml-2 font-normal text-muted-foreground">
                Pass at {finalQuiz.passThreshold}% to complete
              </span>
            </span>
          </div>
        </div>
      )}

      {groups.every((g) => g.lessons.length === 0) && !finalQuiz && (
        <div className="rounded-xl border px-4 py-6 text-center text-sm text-muted-foreground">
          Lessons are being prepared for this course.
        </div>
      )}
    </div>
  );
}
