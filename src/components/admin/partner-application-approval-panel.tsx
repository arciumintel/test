"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  approvePartnerApplication,
  rejectPartnerApplication,
} from "@/app/actions/partner-application";

export function PartnerApplicationApprovalPanel({
  intakeId,
  canApprove,
}: {
  intakeId: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [rejectNotes, setRejectNotes] = React.useState("");
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [approved, setApproved] = React.useState(false);

  async function handleApprove() {
    setBusy("approve");
    setError(null);
    const res = await approvePartnerApplication(intakeId);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setApproved(true);
    router.refresh();
  }

  async function handleReject() {
    setBusy("reject");
    setError(null);
    const res = await rejectPartnerApplication(intakeId, rejectNotes || null);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (approved) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
        <span className="flex items-center gap-2 font-medium text-success">
          <Check className="size-4" />
          Partner approved — draft ecosystem project created and console access
          granted.
        </span>
      </div>
    );
  }

  if (!canApprove) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-5 space-y-4">
      <div>
        <h2 className="font-medium">Partner application</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve to create a draft ecosystem project and grant Partner console
          access to the applicant wallet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleApprove}
          disabled={busy !== null}
        >
          {busy === "approve" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <UserCheck />
          )}
          Approve partner
        </Button>
      </div>

      <div className="grid gap-2 border-t pt-4">
        <Label htmlFor="reject-notes">Reject with notes (optional)</Label>
        <Textarea
          id="reject-notes"
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={3}
          placeholder="Reason for rejection — stored in staff notes only"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleReject}
          disabled={busy !== null}
        >
          {busy === "reject" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <XCircle />
          )}
          Mark as rejected
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
