"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePartnerCourse,
  requestPartnerChanges,
} from "@/app/actions/admin";
import type { CourseStatus } from "@prisma/client";

export function StaffPartnerReviewControls({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [showNotes, setShowNotes] = React.useState(false);

  async function handleApprove() {
    setBusy("approve");
    setError(null);
    const res = await approvePartnerCourse(courseId);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleRequestChanges() {
    setBusy("changes");
    setError(null);
    const res = await requestPartnerChanges(courseId, notes);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setShowNotes(false);
    setNotes("");
    router.refresh();
  }

  if (status !== "submitted_for_review") {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "submitted_for_review" && (
          <>
            <Button size="sm" onClick={handleApprove} disabled={busy !== null}>
              {busy === "approve" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotes((v) => !v)}
              disabled={busy !== null}
            >
              <MessageSquare />
              Request changes
            </Button>
          </>
        )}
      </div>
      {showNotes && (
        <div className="w-full max-w-md space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Explain what the partner should revise..."
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRequestChanges}
            disabled={busy !== null}
          >
            {busy === "changes" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MessageSquare />
            )}
            Send change request
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
