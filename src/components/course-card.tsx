import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/level-badge";
import { formatDuration } from "@/lib/utils";
import { coursePath } from "@/lib/paths";
import type { CourseLevel } from "@prisma/client";

export type CourseCardData = {
  productSlug: string;
  productName: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  lessonCount: number;
  hasBadge: boolean;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={coursePath(course.productSlug, course.slug)}
      className="group block"
    >
      <Card className="h-full gap-0 overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/15 via-accent to-secondary">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
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
        <CardContent className="flex flex-col gap-3 p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {course.productName}
          </span>
          <h3 className="font-semibold leading-snug tracking-tight group-hover:text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.summary}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDuration(course.estimatedDuration)}
            </span>
            {course.hasBadge && (
              <Badge variant="muted">
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
