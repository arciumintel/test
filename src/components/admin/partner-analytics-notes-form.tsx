"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormHelperText,
  FormLabel,
} from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
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
    <FormSection
      title="Partner analytics notes"
      description="Optional narrative shown to project admins on their analytics dashboard and exports."
    >
      <FormField>
        <FormLabel htmlFor="partner-analytics-notes">Notes</FormLabel>
        <Textarea
          id="partner-analytics-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="Summarize trends, context, or recommended follow-ups for partners"
        />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="sm" onClick={handleSave} disabled={busy}>
            <Save />
            Save notes
          </Button>
          {saved ? (
            <FormHelperText className="text-success">Saved.</FormHelperText>
          ) : null}
          {error ? (
            <FormHelperText className="text-destructive">{error}</FormHelperText>
          ) : null}
        </div>
      </FormField>
    </FormSection>
  );
}
