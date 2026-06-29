import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/level-badge";
import { coursePath } from "@/lib/paths";
import type { CoursePrerequisite } from "@/lib/courses";

type CoursePrerequisitesProps = {
  prerequisites: CoursePrerequisite[];
};

export function CoursePrerequisites({ prerequisites }: CoursePrerequisitesProps) {
  if (prerequisites.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">Recommended before this course</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional — you can start this course without completing these first.
      </p>
      <ul className="mt-4 space-y-3">
        {prerequisites.map((course) => (
          <li key={course.id}>
            <Link
              href={coursePath(course.product.slug, course.slug)}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{course.title}</p>
                  <LevelBadge level={course.level} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {course.summary}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {course.product.name}
                </p>
              </div>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
