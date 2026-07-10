import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/level-badge";
import { COURSE_TYPE_LABELS } from "@/lib/course-catalog";
import { getCourseTypeBadgeVariant } from "@/lib/badge-colors";
import { coursePath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import type { CourseLevel, CourseType } from "@prisma/client";

export type HomeHeroCoursePreviewData = {
  slug: string;
  productSlug: string;
  productName: string;
  title: string;
  summary: string;
  level: CourseLevel;
  courseType?: CourseType;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  lessonCount: number;
  hasBadge: boolean;
};

export function HomeHeroCoursePreview({
  course,
}: {
  course: HomeHeroCoursePreviewData;
}) {
  const href = coursePath(course.productSlug, course.slug);

  return (
    <div className="home-hero-preview overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden border-b bg-surface-secondary">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <div className="course-card-placeholder flex h-full">
            <BookOpen
              className="course-card-placeholder-icon size-10 text-foreground/45"
              aria-hidden
            />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <LevelBadge level={course.level} />
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Start here
          </p>
          <h2 className="mt-1 text-pretty text-lg font-semibold leading-snug tracking-tight">
            {course.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {course.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {course.productName}
          </span>
          {course.courseType ? (
            <Badge
              variant={getCourseTypeBadgeVariant(course.courseType)}
              className="max-w-full truncate"
            >
              {COURSE_TYPE_LABELS[course.courseType]}
            </Badge>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" aria-hidden />
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(course.estimatedDuration)}
          </span>
          {course.hasBadge ? (
            <Badge variant="certification">
              <Award aria-hidden />
              Badge
            </Badge>
          ) : null}
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href={href}>
            Open course
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
