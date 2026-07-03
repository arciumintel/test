"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function PartnerApplicationForm() {
  const router = useRouter();
  const [partnerName, setPartnerName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");
  const [sourceMaterialUrl, setSourceMaterialUrl] = React.useState("");
  const [requestedCourseTopic, setRequestedCourseTopic] = React.useState("");
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
      projectName,
      projectDescription,
      sourceMaterialUrl: sourceMaterialUrl || null,
      requestedCourseTopic: requestedCourseTopic || null,
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
        access to the Partner console to submit source material, review course
        drafts for factual accuracy, and view basic reporting. Arcademy staff
        owns final publishing and learner-facing copy.
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
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Optional details">
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="apply-source">
              Source material URL{" "}
              <span className="font-normal text-muted-foreground/80">(optional)</span>
            </FormLabel>
            <Input
              id="apply-source"
              type="url"
              value={sourceMaterialUrl}
              onChange={(e) => setSourceMaterialUrl(e.target.value)}
              placeholder="https://docs.example.com"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="apply-topic">
              Requested course topic{" "}
              <span className="font-normal text-muted-foreground/80">(optional)</span>
            </FormLabel>
            <Input
              id="apply-topic"
              value={requestedCourseTopic}
              onChange={(e) => setRequestedCourseTopic(e.target.value)}
              placeholder="Describe the course topic you have in mind"
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
