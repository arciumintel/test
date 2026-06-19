"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  returnPartnerCourseToDraft,
  submitPartnerCourseForReview,
} from "@/app/actions/project-courses";
import type { CourseStatus } from "@prisma/client";

export function PartnerCourseStatusControls({
  productId,
  courseId,
  status,
}: {
  productId: string;
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    setBusy("submit");
    setError(null);
    const res = await submitPartnerCourseForReview(productId, courseId);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleReturnToDraft() {
    setBusy("draft");
    setError(null);
    const res = await returnPartnerCourseToDraft(productId, courseId);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const canSubmit =
    status === "partner_draft" || status === "staff_changes_requested";
  const canReturn = status === "staff_changes_requested";
  const isLocked =
    status === "submitted_for_review" ||
    status === "approved" ||
    status === "published";

  if (!canSubmit && !canReturn && !isLocked) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {canSubmit && (
          <Button size="sm" onClick={handleSubmit} disabled={busy !== null}>
            {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />}
            Submit for review
          </Button>
        )}
        {canReturn && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReturnToDraft}
            disabled={busy !== null}
          >
            {busy === "draft" ? <Loader2 className="animate-spin" /> : <Undo2 />}
            Return to draft
          </Button>
        )}
      </div>
      {isLocked && (
        <p className="text-xs text-muted-foreground">
          {status === "submitted_for_review"
            ? "Awaiting Arcademy staff review."
            : status === "approved"
              ? "Approved — staff will publish when ready."
              : "This course is live."}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
