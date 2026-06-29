import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/level-badge";
import { formatDuration } from "@/lib/utils";
import {
  learningPathCourseHref,
  type PublishedLearningPath,
} from "@/lib/learning-paths";
import type { CourseLevel } from "@prisma/client";

export function LearningPathTimeline({
  paths,
  productSlug,
}: {
  paths: PublishedLearningPath[];
  productSlug: string;
}) {
  if (paths.length === 0) return null;

  return (
    <div className="space-y-8">
      {paths.map((path) => (
        <section key={path.id} aria-labelledby={`path-${path.slug}`}>
          <div className="mb-4">
            <h2
              id={`path-${path.slug}`}
              className="text-xl font-semibold tracking-tight"
            >
              {path.title}
            </h2>
            {path.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {path.description}
              </p>
            )}
          </div>
          <ol className="relative space-y-0 border-l border-border pl-6">
            {path.courses.map((course, index) => (
              <li key={course.id} className="relative pb-8 last:pb-0">
                <span
                  className="absolute -left-[1.625rem] mt-1.5 size-3 rounded-full border-2 border-primary bg-background"
                  aria-hidden
                />
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Step {index + 1}</span>
                    <LevelBadge level={course.level as CourseLevel} />
                    {course.estimatedDuration != null && (
                      <span>{formatDuration(course.estimatedDuration)}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {course.summary}
                  </p>
                  <Link
                    href={learningPathCourseHref(productSlug, course.slug)}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View course
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
