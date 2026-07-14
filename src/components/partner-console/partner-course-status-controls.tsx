"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Globe, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  publishPartnerCourse,
  returnPartnerCourseToDraft,
  unpublishPartnerCourse,
} from "@/app/actions/project-courses";
import type { CourseStatus } from "@prisma/client";
import type { ReadinessReport } from "@/lib/publish-readiness";

export function PartnerCourseStatusControls({
  productId,
  courseId,
  status,
  readiness,
}: {
  productId: string;
  courseId: string;
  status: CourseStatus;
  readiness?: ReadinessReport;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePublish() {
    setBusy("publish");
    setError(null);
    const res = await publishPartnerCourse(productId, courseId);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleUnpublish() {
    setBusy("unpublish");
    setError(null);
    const res = await unpublishPartnerCourse(productId, courseId);
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

  const canPublish =
    status === "partner_draft" ||
    status === "staff_changes_requested" ||
    status === "submitted_for_review" ||
    status === "approved";
  const canUnpublish = status === "published";
  const canReturn =
    status === "staff_changes_requested" ||
    status === "submitted_for_review" ||
    status === "approved";
  const publishBlocked = readiness ? !readiness.ready : false;

  if (!canPublish && !canUnpublish && !canReturn) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {canPublish && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={busy !== null || publishBlocked}
          >
            {busy === "publish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Globe />
            )}
            Publish course
          </Button>
        )}
        {canUnpublish && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnpublish}
            disabled={busy !== null}
          >
            {busy === "unpublish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <EyeOff />
            )}
            Unpublish
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
      {status === "published" && (
        <p className="text-xs text-muted-foreground">This course is live.</p>
      )}
      {canPublish && publishBlocked && readiness && readiness.blockers[0] && (
        <p className="max-w-sm text-right text-xs text-muted-foreground">
          {readiness.blockers[0]}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
