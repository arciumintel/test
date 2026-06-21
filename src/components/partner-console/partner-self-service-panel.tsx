"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import type { PartnerIntakeReviewStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/utils";

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

function LiveStatus({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p role="status" aria-live="polite" className={className}>
      {children}
    </p>
  );
}

function WorkflowStep({
  step,
  index,
  currentStep,
  isLast,
}: {
  step: (typeof WORKFLOW_STEPS)[number];
  index: number;
  currentStep: number;
  isLast: boolean;
}) {
  const isComplete = index < currentStep;
  const isCurrent = index === currentStep;

  return (
    <li
      className="relative flex gap-4 pb-8"
      aria-current={isCurrent ? "step" : undefined}
    >
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
        aria-hidden
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
        <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
      </div>
    </li>
  );
}

type Props = {
  productId: string;
  initial: PartnerSelfServicePayload;
};

export function PartnerSelfServicePanel({ productId, initial }: Props) {
  const router = useRouter();
  const { product, intake, reviewDraftCourse, hasPublishedCourses } = initial;

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
  const [confirmingReview, setConfirmingReview] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  const currentStatus = intake?.reviewStatus ?? "received";
  const currentStep = STATUS_INDEX[currentStatus] ?? 0;
  const currentStepMeta = WORKFLOW_STEPS[currentStep];
  const isFinalized =
    currentStatus === "approved" || currentStatus === "published";
  const showAnalytics =
    currentStatus === "published" || hasPublishedCourses;

  const coursesPath = `/partner-console/${productId}/courses`;
  const draftReviewHref = reviewDraftCourse
    ? `${coursesPath}/${reviewDraftCourse.id}`
    : coursesPath;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    setSaved(false);

    const res = await upsertPartnerIntakeFields(productId, {
      sourceMaterialUrl: sourceMaterialUrl || null,
      requestedCourseTopic: requestedCourseTopic || null,
      partnerNotes: partnerNotes || null,
    });

    setBusy(false);
    if ("error" in res) {
      setSaveError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleSubmitReview() {
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSubmitted(false);

    const res = await submitPartnerReview(productId);
    setSubmittingReview(false);
    setConfirmingReview(false);
    if ("error" in res) {
      setReviewError(res.error);
      return;
    }
    setReviewSubmitted(true);
    router.refresh();
  }

  const completedSteps = WORKFLOW_STEPS.slice(0, currentStep);
  const activeAndUpcomingSteps = WORKFLOW_STEPS.slice(currentStep);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Submit course materials
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Share source docs, track review progress, and respond when a draft is
          ready.
        </p>
        {product.partnerName && (
          <p className="mt-2 text-sm">
            Partner: <span className="font-medium">{product.partnerName}</span>
          </p>
        )}
        {intake?.updatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Materials last saved {formatDate(intake.updatedAt)}
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
              <a
                href={product.referralUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
          materials and submit accuracy feedback when a draft is ready. You
          cannot approve or publish courses directly.
        </AlertDescription>
      </Alert>

      <section
        aria-labelledby="next-step-heading"
        className="rounded-lg border border-border bg-muted/30 p-4"
      >
        <h2 id="next-step-heading" className="text-sm font-semibold">
          Next step
        </h2>
        {currentStatus === "received" && !isFinalized && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {sourceMaterialUrl.trim()
                ? "Save your materials so Arcademy staff can start building your course."
                : "Add a source material URL, then save to start your intake."}
            </p>
            {!sourceMaterialUrl.trim() && (
              <Button type="submit" form="partner-materials-form" className="mt-3">
                <Save className="size-4" />
                Save materials
              </Button>
            )}
          </>
        )}
        {currentStatus === "in_review" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Arcademy staff is reviewing your materials. No action needed right
            now.
          </p>
        )}
        {currentStatus === "draft_created" && !isFinalized && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Open your course draft, check it for accuracy, then submit your
              review below.
            </p>
            <Button asChild className="mt-3">
              <Link href={draftReviewHref}>
                <BookOpen className="size-4" />
                {reviewDraftCourse
                  ? `Review draft: ${reviewDraftCourse.title}`
                  : "Review course drafts"}
              </Link>
            </Button>
          </>
        )}
        {currentStatus === "partner_review" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Your review was submitted. Arcademy staff will incorporate feedback
            and follow up before approval.
          </p>
        )}
        {currentStatus === "approved" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Content is approved. Arcademy staff will publish when ready.
          </p>
        )}
        {currentStatus === "published" && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Your course is live on Arcademy.
            </p>
            {showAnalytics && (
              <Button asChild variant="outline" className="mt-3" size="sm">
                <Link href={`/partner-console/${productId}/analytics`}>
                  <BarChart3 className="size-4" />
                  View analytics
                </Link>
              </Button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="workflow-heading">
        <h2 id="workflow-heading" className="text-lg font-semibold">
          Review workflow
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {currentStep + 1} of {WORKFLOW_STEPS.length}:{" "}
          <span className="font-medium text-foreground">
            {currentStepMeta?.label ?? "Not started"}
          </span>
        </p>

        {completedSteps.length > 0 && (
          <details className="mt-4 rounded-md border border-border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              {completedSteps.length} completed step
              {completedSteps.length === 1 ? "" : "s"}
            </summary>
            <ol className="mt-4 space-y-0" aria-label="Completed workflow steps">
              {completedSteps.map((step, index) => (
                <WorkflowStep
                  key={step.status}
                  step={step}
                  index={index}
                  currentStep={currentStep}
                  isLast={index === completedSteps.length - 1}
                />
              ))}
            </ol>
          </details>
        )}

        <ol
          className="mt-4 space-y-0"
          aria-label={
            completedSteps.length > 0
              ? "Current and upcoming workflow steps"
              : "Review workflow steps"
          }
        >
          {activeAndUpcomingSteps.map((step, offset) => {
            const index = currentStep + offset;
            const isLast = index === WORKFLOW_STEPS.length - 1;
            return (
              <WorkflowStep
                key={step.status}
                step={step}
                index={index}
                currentStep={currentStep}
                isLast={isLast}
              />
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="materials-heading">
        <h2 id="materials-heading" className="text-lg font-semibold">
          Source materials
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share docs, decks, or URLs Arcademy staff can use when building your
          course.
        </p>

        <form
          id="partner-materials-form"
          onSubmit={handleSave}
          className="mt-4 space-y-4"
        >
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
                <LiveStatus className="flex items-center gap-1 text-sm text-success">
                  <Check className="size-4" aria-hidden />
                  Materials saved
                </LiveStatus>
              )}
            </div>
          )}

          {saveError && (
            <LiveStatus className="text-sm text-destructive">{saveError}</LiveStatus>
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
            <p className="text-sm font-medium">Submit accuracy feedback</p>
            <p className="mt-1 text-sm text-muted-foreground">
              After you review the draft, submit your feedback. Staff will
              incorporate it before approval.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href={draftReviewHref}>
                  <BookOpen className="size-4" />
                  {reviewDraftCourse ? "Open draft" : "Open course drafts"}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
              {!confirmingReview ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmingReview(true);
                    setReviewError(null);
                  }}
                  disabled={submittingReview}
                >
                  <Send className="size-4" />
                  Submit partner review
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Confirm submission
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmingReview(false)}
                    disabled={submittingReview}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {confirmingReview && !submittingReview && (
              <p className="mt-2 text-xs text-muted-foreground">
                This sends your review to Arcademy staff. You cannot undo this
                step.
              </p>
            )}
            {reviewError && (
              <LiveStatus className="mt-2 text-sm text-destructive">
                {reviewError}
              </LiveStatus>
            )}
            {reviewSubmitted && (
              <LiveStatus className="mt-2 flex items-center gap-1 text-sm text-success">
                <Check className="size-4" aria-hidden />
                Review submitted. Staff will follow up.
              </LiveStatus>
            )}
          </div>
        )}
      </section>

      {showAnalytics ? (
        <section aria-labelledby="performance-heading">
          <h2 id="performance-heading" className="text-lg font-semibold">
            Course performance
          </h2>
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
      ) : (
        <section aria-labelledby="performance-heading">
          <h2 id="performance-heading" className="text-lg font-semibold">
            Course performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytics will be available after your course is published on
            Arcademy.
          </p>
        </section>
      )}
    </div>
  );
}
