"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { BadgeMedallion } from "@/components/badge-medallion";
import { upsertBadge } from "@/app/actions/admin";

type Initial = {
  name: string;
  description: string;
  imageUrl: string | null;
} | null;

export function BadgeForm({
  courseId,
  initial,
}: {
  courseId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [imageUrl, setImageUrl] = React.useState(initial?.imageUrl ?? "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await upsertBadge(courseId, {
      name,
      description,
      imageUrl: imageUrl || null,
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
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Learners receive this badge when they complete the course. Badges are
        stored off-chain and shown in the learner profile.
      </p>

      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
        <BadgeMedallion name={name || "Badge"} imageUrl={imageUrl} />
        <div>
          <p className="font-medium">{name || "Badge preview"}</p>
          <p className="text-sm text-muted-foreground">
            {description || "Description appears here."}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="badge-name">Badge name</Label>
        <Input
          id="badge-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Arcium Foundations"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="badge-desc">Description</Label>
        <Textarea
          id="badge-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Awarded for completing Welcome to Arcium."
          rows={2}
          required
        />
      </div>
      <CloudinaryUpload
        label="Badge image (optional)"
        value={imageUrl}
        onChange={setImageUrl}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {initial ? "Save badge" : "Create badge"}
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
