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

type LessonItem = {
  id: string;
  title: string;
};

type LessonOutlineProps = {
  courseHref: string;
  courseTitle: string;
  productSlug: string;
  courseSlug: string;
  lessons: LessonItem[];
  activeLessonId: string;
  completedLessonIds: Set<string>;
  hasFinalQuiz: boolean;
};

function LessonOutlineNav({
  productSlug,
  courseSlug,
  lessons,
  activeLessonId,
  completedLessonIds,
  hasFinalQuiz,
  onNavigate,
}: Omit<LessonOutlineProps, "courseHref" | "courseTitle"> & {
  onNavigate?: () => void;
}) {
  return (
    <nav className="overflow-hidden rounded-xl border">
      {lessons.map((lesson) => {
        const done = completedLessonIds.has(lesson.id);
        const active = lesson.id === activeLessonId;
        return (
          <Link
            key={lesson.id}
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
      })}
      {hasFinalQuiz && (
        <Link
          href={quizPath(productSlug, courseSlug)}
          onClick={onNavigate}
          className="flex items-center gap-2.5 bg-muted/40 px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
        >
          <HelpCircle className="size-4 shrink-0 text-primary" />
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
  ...navProps
}: LessonOutlineProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mb-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <List className="size-4 shrink-0" />
            Course outline ({lessons.length} lesson
            {lessons.length === 1 ? "" : "s"})
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100vw-2rem,20rem)]">
          <SheetHeader>
            <SheetTitle className="line-clamp-2">{courseTitle}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LessonOutlineNav
              {...navProps}
              lessons={lessons}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
