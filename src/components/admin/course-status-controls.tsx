"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, EyeOff, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishApprovedCourse, setCourseStatus } from "@/app/actions/admin";
import type { CourseStatus } from "@prisma/client";
import { PARTNER_WORKFLOW_STATUSES } from "@/lib/course-schemas";

const LEGACY_STATUSES: CourseStatus[] = ["draft", "published", "archived"];

export function CourseStatusControls({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const isPartnerWorkflow = PARTNER_WORKFLOW_STATUSES.includes(
    status as (typeof PARTNER_WORKFLOW_STATUSES)[number]
  );

  async function update(next: "draft" | "published" | "archived", key: string) {
    setBusy(key);
    setError(null);
    const res =
      next === "published" && status === "approved"
        ? await publishApprovedCourse(courseId)
        : await setCourseStatus(courseId, next);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (isPartnerWorkflow && status !== "approved" && status !== "published") {
    return null;
  }

  if (!LEGACY_STATUSES.includes(status) && status !== "approved") {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {status === "approved" && (
          <Button size="sm" onClick={() => update("published", "publish")} disabled={busy !== null}>
            {busy === "publish" ? <Loader2 className="animate-spin" /> : <Globe />}
            Publish approved course
          </Button>
        )}
        {status !== "published" && status !== "approved" && (
          <Button
            size="sm"
            onClick={() => update("published", "publish")}
            disabled={busy !== null}
          >
            {busy === "publish" ? <Loader2 className="animate-spin" /> : <Globe />}
            Publish
          </Button>
        )}
        {status === "published" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update("draft", "unpublish")}
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
        {status !== "archived" && status !== "partner_draft" && status !== "submitted_for_review" && status !== "staff_changes_requested" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update("archived", "archive")}
            disabled={busy !== null}
          >
            {busy === "archive" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Archive />
            )}
            Archive
          </Button>
        )}
        {status === "archived" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update("draft", "restore")}
            disabled={busy !== null}
          >
            {busy === "restore" ? <Loader2 className="animate-spin" /> : null}
            Restore to draft
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
