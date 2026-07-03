"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { LearnerVisibilityField } from "@/components/admin/learner-visibility-field";
import { BadgeMedallion } from "@/components/badge-medallion";
import {
  FormActions,
  FormSaveStatus,
  FormSubmitButton,
} from "@/components/ui/form-actions";
import {
  FormField,
  FormFieldGroup,
  FormHelperText,
  FormLabel,
} from "@/components/ui/form-field";
import { FormLayout } from "@/components/ui/form-layout";
import { FormSection } from "@/components/ui/form-section";
import {
  isVisibleToLearners,
  visibilityToStatus,
} from "@/lib/learner-visibility";
import { upsertBadge } from "@/app/actions/admin";
import { upsertPartnerBadge } from "@/app/actions/project-courses";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import type { BadgeStatus } from "@prisma/client";

type Initial = {
  name: string;
  description: string;
  imageUrl: string | null;
  criteria: string | null;
  issuer: string | null;
  status: BadgeStatus;
} | null;

export function BadgeForm({
  courseId,
  initial,
  variant = "admin",
  partnerProductId,
  readOnly = false,
}: {
  courseId: string;
  initial: Initial;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [criteria, setCriteria] = React.useState(initial?.criteria ?? "");
  const [issuer, setIssuer] = React.useState(initial?.issuer ?? "Arcademy");
  const [visibleToLearners, setVisibleToLearners] = React.useState(
    isVisibleToLearners(initial?.status ?? "published")
  );
  const isArchived = initial?.status === "archived";
  const [imageUrl, setImageUrl] = React.useState(initial?.imageUrl ?? "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const badgeStatus: BadgeStatus =
      variant === "partner"
        ? "draft"
        : isArchived
          ? "archived"
          : visibilityToStatus(visibleToLearners);
    const res =
      variant === "partner" && partnerProductId
        ? await upsertPartnerBadge(partnerProductId, courseId, {
            name,
            description,
            imageUrl: imageUrl || null,
            criteria: criteria || null,
            issuer: issuer || "Arcademy",
            status: badgeStatus,
          })
        : await upsertBadge(courseId, {
            name,
            description,
            imageUrl: imageUrl || null,
            criteria: criteria || null,
            issuer: issuer || "Arcademy",
            status: badgeStatus,
          });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <FormLayout onSubmit={submit}>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Learners receive this badge when they complete the course. Badges are
        stored off-chain and shown in the learner profile with a public
        verification page.
      </p>

      <FormSection title="Preview">
        <div className="flex min-w-0 items-start gap-5 rounded-xl border bg-input-background/50 p-5">
          <BadgeMedallion name={name || "Badge"} imageUrl={imageUrl} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words text-base font-medium">
              {name || "Badge preview"}
            </p>
            <p className="mt-1 line-clamp-3 break-words text-sm text-muted-foreground">
              {description || "Description appears here."}
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Badge details">
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="badge-name">Badge name</FormLabel>
            <Input
              id="badge-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Short name shown on profile cards"
              maxLength={L.badgeName}
              required
            />
            <FormHelperText>
              {name.length}/{L.badgeName} characters. Keep it concise.
            </FormHelperText>
          </FormField>

          <FormField>
            <FormLabel htmlFor="badge-desc">Description</FormLabel>
            <Textarea
              id="badge-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this badge represents"
              rows={3}
              maxLength={L.badgeDescription}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="badge-criteria">Completion criteria</FormLabel>
            <Textarea
              id="badge-criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Describe what learners must complete to earn this badge"
              rows={3}
              maxLength={L.badgeCriteria}
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="badge-issuer">Issuer</FormLabel>
              <Input
                id="badge-issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Organization issuing this badge"
                maxLength={L.badgeIssuer}
              />
            </FormField>

            {variant === "admin" && !isArchived && (
              <LearnerVisibilityField
                id="badge-visibility"
                visible={visibleToLearners}
                onChange={setVisibleToLearners}
                description="The badge goes live when you publish the course if it is still hidden."
              />
            )}
            {variant === "admin" && isArchived && (
              <p className="self-end text-sm text-muted-foreground">
                This badge is archived and cannot be shown to learners.
              </p>
            )}
          </div>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Media">
        <CloudinaryUpload
          label="Badge image (optional)"
          value={imageUrl}
          onChange={setImageUrl}
          productId={variant === "partner" ? partnerProductId : undefined}
        />
      </FormSection>

      {!readOnly && (
        <FormActions sticky>
          <FormSubmitButton busy={busy}>
            <Save />
            {initial ? "Save badge" : "Create badge"}
          </FormSubmitButton>
          <FormSaveStatus saved={saved} error={error} />
        </FormActions>
      )}
    </FormLayout>
  );
}
