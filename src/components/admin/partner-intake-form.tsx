"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createPartnerIntake,
  updatePartnerIntake,
} from "@/app/actions/admin-partner-intake";
import type { PartnerIntakeReviewStatus } from "@prisma/client";

type ProductOption = { id: string; name: string };

type Initial = {
  id?: string;
  productId: string | null;
  partnerName: string;
  contactName: string | null;
  contactEmail: string | null;
  projectName: string | null;
  projectDescription: string | null;
  sourceMaterialUrl: string | null;
  requestedCourseTopic: string | null;
  reviewStatus: PartnerIntakeReviewStatus;
  notes: string | null;
};

const STATUS_LABELS: Record<PartnerIntakeReviewStatus, string> = {
  received: "Received",
  in_review: "In review",
  draft_created: "Draft created",
  partner_review: "Partner review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};

export function PartnerIntakeForm({
  initial,
  products,
}: {
  initial?: Initial;
  products: ProductOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [productId, setProductId] = React.useState(initial?.productId ?? "");
  const [partnerName, setPartnerName] = React.useState(initial?.partnerName ?? "");
  const [contactName, setContactName] = React.useState(initial?.contactName ?? "");
  const [contactEmail, setContactEmail] = React.useState(initial?.contactEmail ?? "");
  const [projectName, setProjectName] = React.useState(initial?.projectName ?? "");
  const [projectDescription, setProjectDescription] = React.useState(
    initial?.projectDescription ?? ""
  );
  const [sourceMaterialUrl, setSourceMaterialUrl] = React.useState(
    initial?.sourceMaterialUrl ?? ""
  );
  const [requestedCourseTopic, setRequestedCourseTopic] = React.useState(
    initial?.requestedCourseTopic ?? ""
  );
  const [reviewStatus, setReviewStatus] = React.useState<PartnerIntakeReviewStatus>(
    initial?.reviewStatus ?? "received"
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const payload = {
      productId: productId || null,
      partnerName,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      projectName: projectName || null,
      projectDescription: projectDescription || null,
      sourceMaterialUrl: sourceMaterialUrl || null,
      requestedCourseTopic: requestedCourseTopic || null,
      reviewStatus,
      notes: notes || null,
    };

    const res =
      isEdit && initial?.id
        ? await updatePartnerIntake(initial.id, payload)
        : await createPartnerIntake(payload);

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!isEdit && "id" in res) {
      router.push(`/admin/partner-intake/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Internal intake tracking for partner-assisted publishing. Contact details
        stay staff-only and are not shown on public pages.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="intake-partner">Partner / team name</Label>
          <Input
            id="intake-partner"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="intake-status">Review status</Label>
          <Select
            id="intake-status"
            value={reviewStatus}
            onChange={(e) =>
              setReviewStatus(e.target.value as PartnerIntakeReviewStatus)
            }
          >
            {(Object.keys(STATUS_LABELS) as PartnerIntakeReviewStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              )
            )}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="intake-project-name">
            Project name{" "}
            <span className="text-muted-foreground">(applications)</span>
          </Label>
          <Input
            id="intake-project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="intake-project-desc">Project description</Label>
          <Textarea
            id="intake-project-desc"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="intake-product">
          Linked project{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select
          id="intake-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">Not linked yet</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="intake-contact">Contact name</Label>
          <Input
            id="intake-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="intake-email">Contact email</Label>
          <Input
            id="intake-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="intake-source">Source material URL</Label>
        <Input
          id="intake-source"
          type="url"
          value={sourceMaterialUrl}
          onChange={(e) => setSourceMaterialUrl(e.target.value)}
          placeholder="https://docs.example.com/onboarding"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="intake-topic">Requested course topic</Label>
        <Input
          id="intake-topic"
          value={requestedCourseTopic}
          onChange={(e) => setRequestedCourseTopic(e.target.value)}
          placeholder="Getting started with..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="intake-notes">Staff notes</Label>
        <Textarea
          id="intake-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Intake summary, review feedback, publish blockers..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {isEdit ? "Save intake" : "Create intake"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" />
            Saved
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
