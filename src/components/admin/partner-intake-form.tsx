"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  FormActions,
  FormSaveStatus,
  FormSubmitButton,
} from "@/components/ui/form-actions";
import {
  FormField,
  FormFieldGroup,
  FormLabel,
} from "@/components/ui/form-field";
import { FormLayout } from "@/components/ui/form-layout";
import { FormSection } from "@/components/ui/form-section";
import {
  createPartnerIntake,
  updatePartnerIntake,
} from "@/app/actions/admin-partner-intake";
import type {
  PartnerIntakeReviewStatus,
  PartnerPreferredContactMethod,
} from "@prisma/client";

type ProductOption = { id: string; name: string };

type Initial = {
  id?: string;
  productId: string | null;
  partnerName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactX: string | null;
  contactDiscord: string | null;
  contactTelegram: string | null;
  preferredContactMethod: PartnerPreferredContactMethod | null;
  projectName: string | null;
  projectDescription: string | null;
  officialWebsite: string | null;
  officialX: string | null;
  officialDiscord: string | null;
  officialTelegram: string | null;
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

const PREFERRED_CONTACT_LABELS: Record<PartnerPreferredContactMethod, string> = {
  email: "Email",
  x: "X",
  discord: "Discord",
  telegram: "Telegram",
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
  const [contactX, setContactX] = React.useState(initial?.contactX ?? "");
  const [contactDiscord, setContactDiscord] = React.useState(
    initial?.contactDiscord ?? ""
  );
  const [contactTelegram, setContactTelegram] = React.useState(
    initial?.contactTelegram ?? ""
  );
  const [preferredContactMethod, setPreferredContactMethod] = React.useState<
    PartnerPreferredContactMethod | ""
  >(initial?.preferredContactMethod ?? "");
  const [projectName, setProjectName] = React.useState(initial?.projectName ?? "");
  const [projectDescription, setProjectDescription] = React.useState(
    initial?.projectDescription ?? ""
  );
  const [officialWebsite, setOfficialWebsite] = React.useState(
    initial?.officialWebsite ?? ""
  );
  const [officialX, setOfficialX] = React.useState(initial?.officialX ?? "");
  const [officialDiscord, setOfficialDiscord] = React.useState(
    initial?.officialDiscord ?? ""
  );
  const [officialTelegram, setOfficialTelegram] = React.useState(
    initial?.officialTelegram ?? ""
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
      contactX: contactX || null,
      contactDiscord: contactDiscord || null,
      contactTelegram: contactTelegram || null,
      preferredContactMethod: preferredContactMethod || null,
      projectName: projectName || null,
      projectDescription: projectDescription || null,
      officialWebsite: officialWebsite || null,
      officialX: officialX || null,
      officialDiscord: officialDiscord || null,
      officialTelegram: officialTelegram || null,
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
    <FormLayout onSubmit={handleSubmit}>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Internal intake tracking for partner-assisted publishing. Contact details
        stay staff-only and are not shown on public pages.
      </p>

      <FormSection title="Intake overview">
        <FormFieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="intake-partner">Partner / team name</FormLabel>
              <Input
                id="intake-partner"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                placeholder="Partner or team name"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-status">Review status</FormLabel>
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
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="intake-product">
              Linked project{" "}
              <span className="font-normal text-muted-foreground/80">(optional)</span>
            </FormLabel>
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
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Project details">
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="intake-project-name">
              Project name{" "}
              <span className="font-normal text-muted-foreground/80">(applications)</span>
            </FormLabel>
            <Input
              id="intake-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name from the application"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="intake-project-desc">Project description</FormLabel>
            <Textarea
              id="intake-project-desc"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              placeholder="Summary from the partner application"
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="intake-official-website">Official website</FormLabel>
              <Input
                id="intake-official-website"
                type="url"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-official-x">Official X</FormLabel>
              <Input
                id="intake-official-x"
                value={officialX}
                onChange={(e) => setOfficialX(e.target.value)}
                placeholder="@project"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-official-discord">Official Discord</FormLabel>
              <Input
                id="intake-official-discord"
                value={officialDiscord}
                onChange={(e) => setOfficialDiscord(e.target.value)}
                placeholder="https://discord.gg/..."
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-official-telegram">Official Telegram</FormLabel>
              <Input
                id="intake-official-telegram"
                value={officialTelegram}
                onChange={(e) => setOfficialTelegram(e.target.value)}
                placeholder="https://t.me/..."
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="intake-source">Documentation URL</FormLabel>
            <Input
              id="intake-source"
              type="url"
              value={sourceMaterialUrl}
              onChange={(e) => setSourceMaterialUrl(e.target.value)}
              placeholder="https://docs.example.com/onboarding"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="intake-topic">Requested course topic</FormLabel>
            <Input
              id="intake-topic"
              value={requestedCourseTopic}
              onChange={(e) => setRequestedCourseTopic(e.target.value)}
              placeholder="Describe the requested course topic"
            />
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Contact">
        <FormFieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="intake-contact">Contact name</FormLabel>
              <Input
                id="intake-contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Primary contact"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-email">Contact email</FormLabel>
              <Input
                id="intake-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </FormField>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <FormField>
              <FormLabel htmlFor="intake-contact-x">X</FormLabel>
              <Input
                id="intake-contact-x"
                value={contactX}
                onChange={(e) => setContactX(e.target.value)}
                placeholder="@handle"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-contact-discord">Discord</FormLabel>
              <Input
                id="intake-contact-discord"
                value={contactDiscord}
                onChange={(e) => setContactDiscord(e.target.value)}
                placeholder="username or invite link"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="intake-contact-telegram">Telegram</FormLabel>
              <Input
                id="intake-contact-telegram"
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                placeholder="@username"
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="intake-preferred-contact">
              Preferred contact method
            </FormLabel>
            <Select
              id="intake-preferred-contact"
              value={preferredContactMethod}
              onChange={(e) =>
                setPreferredContactMethod(
                  e.target.value as PartnerPreferredContactMethod | ""
                )
              }
            >
              <option value="">Not specified</option>
              {(
                Object.keys(
                  PREFERRED_CONTACT_LABELS
                ) as PartnerPreferredContactMethod[]
              ).map((method) => (
                <option key={method} value={method}>
                  {PREFERRED_CONTACT_LABELS[method]}
                </option>
              ))}
            </Select>
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Staff notes">
        <FormField>
          <FormLabel htmlFor="intake-notes">Internal notes</FormLabel>
          <Textarea
            id="intake-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Intake summary, review feedback, publish blockers..."
          />
        </FormField>
      </FormSection>

      <FormActions sticky>
        <FormSubmitButton busy={busy}>
          <Save />
          {isEdit ? "Save intake" : "Create intake"}
        </FormSubmitButton>
        <FormSaveStatus saved={saved} error={error} />
      </FormActions>
    </FormLayout>
  );
}
