"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/app/actions/learn";

type Props = {
  lessonId: string;
  alreadyComplete: boolean;
  nextHref: string;
  nextLabel: string;
};

export function LessonActions({
  lessonId,
  alreadyComplete,
  nextHref,
  nextLabel,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleComplete() {
    setBusy(true);
    setError(null);
    const res = await completeLesson(lessonId);
    if ("error" in res) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(nextHref);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {alreadyComplete && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" />
            Completed
          </span>
        )}
        <Button onClick={handleComplete} disabled={busy}>
          {busy ? (
            <Loader2 className="animate-spin" />
          ) : alreadyComplete ? (
            <ArrowRight />
          ) : (
            <Check />
          )}
          {alreadyComplete ? nextLabel : `Complete & ${nextLabel.toLowerCase()}`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
