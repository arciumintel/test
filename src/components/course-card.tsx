import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Award, BookOpen, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/level-badge";
import { formatDuration } from "@/lib/utils";
import { coursePath } from "@/lib/paths";
import { COURSE_TYPE_LABELS } from "@/lib/course-catalog";
import { getCourseTypeBadgeVariant } from "@/lib/badge-colors";
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
      className="group block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="course-card h-full min-w-0 gap-0 overflow-hidden p-0 transition-[border-color,background-color,transform] duration-200 motion-safe:hover:-translate-y-1">
        <div className="course-card-artwork relative aspect-[16/9] w-full overflow-hidden">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="course-card-placeholder flex h-full">
              <BookOpen
                className="course-card-placeholder-icon size-10 text-foreground/45"
                aria-hidden
              />
            </div>
          )}
          <div className="absolute left-3 top-3 z-10">
            <LevelBadge level={course.level} />
          </div>
        </div>
        <CardContent className="course-card-content flex min-w-0 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 break-words text-pretty font-semibold leading-snug tracking-tight transition-colors group-hover:text-text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-2 break-words text-pretty text-sm leading-relaxed text-muted-foreground">
            {course.summary}
          </p>
          <div className="mt-1 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
              <span className="max-w-full truncate font-medium text-foreground/80">
                {course.productName}
              </span>
              {course.courseType && (
                <Badge
                  variant={getCourseTypeBadgeVariant(course.courseType)}
                  className="max-w-full truncate"
                >
                  {COURSE_TYPE_LABELS[course.courseType]}
                </Badge>
              )}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3.5" aria-hidden />
                {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {formatDuration(course.estimatedDuration)}
              </span>
              {course.hasBadge && (
                <Badge variant="certification">
                  <Award aria-hidden />
                  Badge
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
