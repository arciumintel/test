"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
      <div className="rounded-xl border bg-muted/30 p-8 text-center">
        <Check className="mx-auto size-10 text-success" />
        <h2 className="mt-4 text-lg font-semibold">Application received</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Arcademy staff will review your application. You can check back here
          or visit the Partner console once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tell us about your ecosystem project. After staff approval, you will get
        access to the Partner console to manage courses, lessons, and Discord
        integration.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="apply-partner">Partner / team name</Label>
          <Input
            id="apply-partner"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
            placeholder="Your team or organization"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="apply-contact">Contact name</Label>
          <Input
            id="apply-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apply-email">Contact email</Label>
        <Input
          id="apply-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apply-project">Ecosystem project name</Label>
        <Input
          id="apply-project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          placeholder="Official project name as it should appear on Arcademy"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apply-description">Short project description</Label>
        <Textarea
          id="apply-description"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          required
          rows={4}
          placeholder="What does your project do, and who is it for?"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apply-source">
          Source material URL{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="apply-source"
          type="url"
          value={sourceMaterialUrl}
          onChange={(e) => setSourceMaterialUrl(e.target.value)}
          placeholder="https://docs.example.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apply-topic">
          Requested course topic{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="apply-topic"
          value={requestedCourseTopic}
          onChange={(e) => setRequestedCourseTopic(e.target.value)}
          placeholder="Getting started with..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
          Submit application
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
