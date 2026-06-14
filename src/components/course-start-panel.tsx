"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Play, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startCourse } from "@/app/actions/learn";

type Props = {
  courseId: string;
  slug: string;
  isAuthed: boolean;
  started: boolean;
  completed: boolean;
  nextLessonId: string | null;
};

export function CourseStartPanel({
  courseId,
  slug,
  isAuthed,
  started,
  completed,
  nextLessonId,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function lessonHref(lessonId: string) {
    return `/courses/${slug}/lessons/${lessonId}`;
  }

  async function handleStart() {
    setBusy(true);
    setError(null);
    const res = await startCourse(courseId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (res.firstLessonId) router.push(lessonHref(res.firstLessonId));
  }

  if (!isAuthed) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center">
        <Wallet className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Connect your wallet to start</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use “Connect wallet” at the top right to track progress, take quizzes,
          and earn the badge.
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Course completed
        </div>
        {nextLessonId && (
          <Button variant="outline" className="w-full" asChild>
            <a href={lessonHref(nextLessonId)}>Review lessons</a>
          </Button>
        )}
      </div>
    );
  }

  if (started && nextLessonId) {
    return (
      <Button className="w-full" asChild>
        <a href={lessonHref(nextLessonId)}>
          Continue learning
          <ArrowRight />
        </a>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleStart} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        Start course
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
