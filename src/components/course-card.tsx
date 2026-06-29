import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/level-badge";
import { formatDuration } from "@/lib/utils";
import { coursePath } from "@/lib/paths";
import { COURSE_TYPE_LABELS } from "@/lib/course-catalog";
import type { CourseLevel, CourseType } from "@prisma/client";

export type CourseCardData = {
  productSlug: string;
  productName: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  courseType?: CourseType;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  lessonCount: number;
  hasBadge: boolean;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={coursePath(course.productSlug, course.slug)}
      className="group block min-w-0"
    >
      <Card className="h-full min-w-0 gap-0 overflow-hidden p-0 motion-safe:transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/15 via-accent to-secondary">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="size-10 text-primary/40" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <LevelBadge level={course.level} />
          </div>
        </div>
        <CardContent className="flex min-w-0 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 break-words text-pretty font-semibold leading-snug tracking-tight group-hover:text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-2 break-words text-pretty text-sm leading-relaxed text-muted-foreground">
            {course.summary}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="max-w-full truncate font-medium text-foreground/80">
              {course.productName}
            </span>
            {course.courseType && (
              <Badge variant="muted" className="max-w-full truncate">
                {COURSE_TYPE_LABELS[course.courseType]}
              </Badge>
            )}
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDuration(course.estimatedDuration)}
            </span>
            {course.hasBadge && (
              <Badge variant="warning">
                <Award />
                Badge
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
