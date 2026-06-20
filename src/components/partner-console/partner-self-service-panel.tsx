"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Loader2,
  Save,
  Send,
  BarChart3,
} from "lucide-react";
import type { PartnerIntakeReviewStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  submitPartnerReview,
  upsertPartnerIntakeFields,
  type PartnerSelfServicePayload,
} from "@/app/actions/project-partner-self-service";
import { productPath } from "@/lib/paths";

const WORKFLOW_STEPS: {
  status: PartnerIntakeReviewStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "received",
    label: "Received",
    description: "Your source materials are on file.",
  },
  {
    status: "in_review",
    label: "In review",
    description: "Arcademy staff is reviewing your submission.",
  },
  {
    status: "draft_created",
    label: "Draft created",
    description: "A course draft is ready for your factual review.",
  },
  {
    status: "partner_review",
    label: "Partner review",
    description: "Your feedback is with Arcademy staff.",
  },
  {
    status: "approved",
    label: "Approved",
    description: "Content approved. Awaiting publish.",
  },
  {
    status: "published",
    label: "Published",
    description: "Live on Arcademy.",
  },
];

const STATUS_INDEX = Object.fromEntries(
  WORKFLOW_STEPS.map((s, i) => [s.status, i])
) as Record<PartnerIntakeReviewStatus, number>;

type Props = {
  productId: string;
  initial: PartnerSelfServicePayload;
};

export function PartnerSelfServicePanel({ productId, initial }: Props) {
  const router = useRouter();
  const { product, intake } = initial;

  const [sourceMaterialUrl, setSourceMaterialUrl] = React.useState(
    intake?.sourceMaterialUrl ?? ""
  );
  const [requestedCourseTopic, setRequestedCourseTopic] = React.useState(
    intake?.requestedCourseTopic ?? ""
  );
  const [partnerNotes, setPartnerNotes] = React.useState(
    intake?.partnerNotes ?? ""
  );
  const [busy, setBusy] = React.useState(false);
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  const currentStatus = intake?.reviewStatus ?? "received";
  const currentStep = STATUS_INDEX[currentStatus] ?? 0;
  const isFinalized =
    currentStatus === "approved" || currentStatus === "published";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const res = await upsertPartnerIntakeFields(productId, {
      sourceMaterialUrl: sourceMaterialUrl || null,
      requestedCourseTopic: requestedCourseTopic || null,
      partnerNotes: partnerNotes || null,
    });

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleSubmitReview() {
    setSubmittingReview(true);
    setError(null);
    setReviewSubmitted(false);

    const res = await submitPartnerReview(productId);
    setSubmittingReview(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setReviewSubmitted(true);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Partner self-service
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Submit materials, track review progress, and view basic course
          performance.
        </p>
        {product.partnerName && (
          <p className="mt-2 text-sm">
            Partner: <span className="font-medium">{product.partnerName}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={productPath(product.slug)} target="_blank">
              <ExternalLink className="size-4" />
              View public page
            </Link>
          </Button>
          {product.referralUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={product.referralUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Referral link
              </a>
            </Button>
          )}
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Arcademy staff retains final publish approval. You can update source
          materials and submit factual review when a draft is ready. You cannot
          approve or publish courses directly.
        </AlertDescription>
      </Alert>

      <section>
        <h2 className="text-lg font-semibold">Review workflow</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current status:{" "}
          <span className="font-medium text-foreground">
            {WORKFLOW_STEPS.find((s) => s.status === currentStatus)?.label ??
              "Not started"}
          </span>
        </p>
        <ol className="mt-6 space-y-0">
          {WORKFLOW_STEPS.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <li key={step.status} className="relative flex gap-4 pb-8">
                {!isLast && (
                  <span
                    className={`absolute left-[11px] top-6 h-full w-px ${
                      isComplete ? "bg-primary" : "bg-border"
                    }`}
                    aria-hidden
                  />
                )}
                <span
                  className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    isComplete
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="size-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Source materials</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share docs, decks, or URLs Arcademy staff can use when building your
          course.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="partner-source">Source material URL</Label>
            <Input
              id="partner-source"
              type="url"
              value={sourceMaterialUrl}
              onChange={(e) => setSourceMaterialUrl(e.target.value)}
              placeholder="https://docs.example.com/onboarding"
              disabled={isFinalized}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-topic">Requested course topic</Label>
            <Input
              id="partner-topic"
              value={requestedCourseTopic}
              onChange={(e) => setRequestedCourseTopic(e.target.value)}
              placeholder="Getting started with..."
              disabled={isFinalized}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-notes">Notes for Arcademy staff</Label>
            <Textarea
              id="partner-notes"
              value={partnerNotes}
              onChange={(e) => setPartnerNotes(e.target.value)}
              rows={5}
              placeholder="Factual corrections, audience notes, or questions..."
              disabled={isFinalized}
            />
          </div>

          {!isFinalized && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Save />}
                Save materials
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="size-4" />
                  Saved
                </span>
              )}
            </div>
          )}

          {isFinalized && (
            <p className="text-sm text-muted-foreground">
              This intake is finalized. Contact Arcademy staff to request
              changes.
            </p>
          )}
        </form>

        {intake?.canSubmitForReview && !isFinalized && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Ready for factual review?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit your review when you have checked the draft for accuracy.
              Staff will incorporate your feedback before approval.
            </p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              Submit partner review
            </Button>
            {reviewSubmitted && (
              <p className="mt-2 flex items-center gap-1 text-sm text-success">
                <Check className="size-4" />
                Review submitted. Staff will follow up.
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Course performance</h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          View starts, completions, lesson funnels, and quiz diagnostics for
          published courses.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/partner-console/${productId}/analytics`}>
            <BarChart3 className="size-4" />
            View analytics
          </Link>
        </Button>
      </section>
    </div>
  );
}
