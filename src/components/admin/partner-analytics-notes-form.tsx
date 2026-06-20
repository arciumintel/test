"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePartnerAnalyticsNotes } from "@/app/actions/partner-analytics";

export function PartnerAnalyticsNotesForm({
  productId,
  initialNotes,
}: {
  productId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = React.useState(initialNotes ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await updatePartnerAnalyticsNotes(productId, notes || null);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="partner-analytics-notes">Partner analytics notes</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional narrative shown to project admins on their analytics dashboard and exports.
        </p>
      </div>
      <Textarea
        id="partner-analytics-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="e.g. Completion dipped after Lesson 3 was expanded — staff is reviewing a shorter revision."
      />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          Save notes
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}
