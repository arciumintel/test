"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  FormActions,
  FormSubmitButton,
} from "@/components/ui/form-actions";
import {
  FormField,
  FormFieldGroup,
  FormLabel,
} from "@/components/ui/form-field";
import { FormLayout } from "@/components/ui/form-layout";
import { FormSection } from "@/components/ui/form-section";
import { submitPartnerApplication } from "@/app/actions/partner-application";

type PreferredContactMethod = "email" | "x" | "discord" | "telegram";

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="font-normal text-muted-foreground/80">(optional)</span>
    </>
  );
}

export function PartnerApplicationForm() {
  const router = useRouter();
  const [partnerName, setPartnerName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactX, setContactX] = React.useState("");
  const [contactDiscord, setContactDiscord] = React.useState("");
  const [contactTelegram, setContactTelegram] = React.useState("");
  const [preferredContactMethod, setPreferredContactMethod] =
    React.useState<PreferredContactMethod>("email");
  const [projectName, setProjectName] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");
  const [officialWebsite, setOfficialWebsite] = React.useState("");
  const [officialX, setOfficialX] = React.useState("");
  const [officialDiscord, setOfficialDiscord] = React.useState("");
  const [officialTelegram, setOfficialTelegram] = React.useState("");
  const [sourceMaterialUrl, setSourceMaterialUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await submitPartnerApplication({
      partnerName,
      contactName,
      contactEmail,
      contactX: contactX || null,
      contactDiscord: contactDiscord || null,
      contactTelegram: contactTelegram || null,
      preferredContactMethod,
      projectName,
      projectDescription,
      officialWebsite: officialWebsite || null,
      officialX: officialX || null,
      officialDiscord: officialDiscord || null,
      officialTelegram: officialTelegram || null,
      sourceMaterialUrl: sourceMaterialUrl || null,
    });

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-[960px] rounded-2xl border bg-muted/30 p-10 text-center">
        <Check className="mx-auto size-10 text-success" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Application received</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Arcademy staff will review your application. You can check back here
          or visit the Partner console once approved.
        </p>
      </div>
    );
  }

  return (
    <FormLayout onSubmit={handleSubmit}>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Tell us about your ecosystem project. After staff approval, you will get
        access to the Partner console to publish your project page, create and
        publish courses, and view reporting for your learners.
      </p>

      <FormSection title="Contact information">
        <FormFieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="apply-partner">Partner / team name</FormLabel>
              <Input
                id="apply-partner"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                placeholder="Your team or organization"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-contact">Contact name</FormLabel>
              <Input
                id="apply-contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                placeholder="Primary point of contact"
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="apply-email">Contact email</FormLabel>
            <Input
              id="apply-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-3">
            <FormField>
              <FormLabel htmlFor="apply-contact-x">
                <OptionalLabel>X</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-contact-x"
                value={contactX}
                onChange={(e) => setContactX(e.target.value)}
                placeholder="@handle"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-contact-discord">
                <OptionalLabel>Discord</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-contact-discord"
                value={contactDiscord}
                onChange={(e) => setContactDiscord(e.target.value)}
                placeholder="username or invite link"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-contact-telegram">
                <OptionalLabel>Telegram</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-contact-telegram"
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                placeholder="@username"
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="apply-preferred-contact">
              Preferred Contact Method
            </FormLabel>
            <Select
              id="apply-preferred-contact"
              value={preferredContactMethod}
              onChange={(e) =>
                setPreferredContactMethod(
                  e.target.value as PreferredContactMethod
                )
              }
              required
            >
              <option value="email">Email</option>
              <option value="x">X</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
            </Select>
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Project details">
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="apply-project">Ecosystem project name</FormLabel>
            <Input
              id="apply-project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="Official project name as it should appear on Arcademy"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="apply-description">Short project description</FormLabel>
            <Textarea
              id="apply-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
              rows={4}
              placeholder="What does your project do, and who is it for?"
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="apply-official-website">
                <OptionalLabel>Official Website</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-official-website"
                type="url"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-official-x">
                <OptionalLabel>Official X</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-official-x"
                value={officialX}
                onChange={(e) => setOfficialX(e.target.value)}
                placeholder="@project or https://x.com/project"
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-official-discord">
                <OptionalLabel>Official Discord</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-official-discord"
                value={officialDiscord}
                onChange={(e) => setOfficialDiscord(e.target.value)}
                placeholder="https://discord.gg/..."
              />
            </FormField>
            <FormField>
              <FormLabel htmlFor="apply-official-telegram">
                <OptionalLabel>Official Telegram</OptionalLabel>
              </FormLabel>
              <Input
                id="apply-official-telegram"
                value={officialTelegram}
                onChange={(e) => setOfficialTelegram(e.target.value)}
                placeholder="https://t.me/..."
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="apply-docs">Documentation URL (optional)</FormLabel>
            <Input
              id="apply-docs"
              type="url"
              value={sourceMaterialUrl}
              onChange={(e) => setSourceMaterialUrl(e.target.value)}
              placeholder="https://docs.example.com"
            />
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormActions sticky>
        <FormSubmitButton busy={busy}>
          <Send />
          Submit application
        </FormSubmitButton>
        {error ? (
          <span className="text-sm text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </FormActions>
    </FormLayout>
  );
}
