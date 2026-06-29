"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  HelpCircle,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { lessonPath, quizPath } from "@/lib/paths";
import type { CourseModuleOutlineGroup } from "@/lib/courses";

type LessonItem = {
  id: string;
  title: string;
};

type LessonOutlineProps = {
  courseHref: string;
  courseTitle: string;
  productSlug: string;
  courseSlug: string;
  groups?: CourseModuleOutlineGroup[];
  lessons: LessonItem[];
  activeLessonId: string;
  completedLessonIds: Set<string>;
  hasFinalQuiz: boolean;
};

function LessonLink({
  lesson,
  productSlug,
  courseSlug,
  activeLessonId,
  completedLessonIds,
  onNavigate,
}: {
  lesson: LessonItem;
  productSlug: string;
  courseSlug: string;
  activeLessonId: string;
  completedLessonIds: Set<string>;
  onNavigate?: () => void;
}) {
  const done = completedLessonIds.has(lesson.id);
  const active = lesson.id === activeLessonId;
  return (
    <Link
      href={lessonPath(productSlug, courseSlug, lesson.id)}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0",
        active ? "bg-accent font-medium" : "hover:bg-muted/50"
      )}
    >
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-success" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="line-clamp-2">{lesson.title}</span>
    </Link>
  );
}

function LessonOutlineNav({
  productSlug,
  courseSlug,
  groups,
  lessons,
  activeLessonId,
  completedLessonIds,
  hasFinalQuiz,
  onNavigate,
}: Omit<LessonOutlineProps, "courseHref" | "courseTitle"> & {
  onNavigate?: () => void;
}) {
  const showGrouped = groups && groups.some((g) => g.id !== null);

  if (showGrouped && groups) {
    return (
      <nav className="space-y-3">
        {groups.map((group) => (
          <div key={group.id ?? "ungrouped"} className="overflow-hidden rounded-xl border">
            {groups.length > 1 && (
              <div className="border-b bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </div>
            )}
            {group.lessons.map((lesson) => (
              <LessonLink
                key={lesson.id}
                lesson={lesson}
                productSlug={productSlug}
                courseSlug={courseSlug}
                activeLessonId={activeLessonId}
                completedLessonIds={completedLessonIds}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
        {hasFinalQuiz && (
          <div className="overflow-hidden rounded-xl border">
            <Link
              href={quizPath(productSlug, courseSlug)}
              onClick={onNavigate}
              className="flex items-center gap-2.5 bg-info/5 px-3 py-2.5 text-sm font-medium text-info hover:bg-info/10"
            >
              <HelpCircle className="size-4 shrink-0 text-info" />
              Final quiz
            </Link>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="overflow-hidden rounded-xl border">
      {lessons.map((lesson) => (
        <LessonLink
          key={lesson.id}
          lesson={lesson}
          productSlug={productSlug}
          courseSlug={courseSlug}
          activeLessonId={activeLessonId}
          completedLessonIds={completedLessonIds}
          onNavigate={onNavigate}
        />
      ))}
      {hasFinalQuiz && (
        <Link
          href={quizPath(productSlug, courseSlug)}
          onClick={onNavigate}
          className="flex items-center gap-2.5 bg-info/5 px-3 py-2.5 text-sm font-medium text-info hover:bg-info/10"
        >
          <HelpCircle className="size-4 shrink-0 text-info" />
          Final quiz
        </Link>
      )}
    </nav>
  );
}

export function LessonOutlineSidebar({
  courseHref,
  courseTitle,
  ...navProps
}: LessonOutlineProps) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-20 lg:h-fit">
      <Link
        href={courseHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {courseTitle}
      </Link>
      <LessonOutlineNav {...navProps} />
    </aside>
  );
}

export function LessonOutlineMobile({
  courseTitle,
  lessons,
  groups,
  ...navProps
}: LessonOutlineProps) {
  const [open, setOpen] = React.useState(false);
  const lessonCount =
    groups && groups.some((g) => g.id !== null)
      ? groups.reduce((n, g) => n + g.lessons.length, 0)
      : lessons.length;

  return (
    <div className="mb-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <List className="size-4 shrink-0" />
            Course outline ({lessonCount} lesson
            {lessonCount === 1 ? "" : "s"})
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100vw-2rem,20rem)]">
          <SheetHeader>
            <SheetTitle className="line-clamp-2">{courseTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LessonOutlineNav
              {...navProps}
              groups={groups}
              lessons={lessons}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
