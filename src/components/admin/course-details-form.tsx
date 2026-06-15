"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { createCourse, updateCourse } from "@/app/actions/admin";
import type { CourseLevel } from "@prisma/client";

type Initial = {
  id?: string;
  title: string;
  productId: string;
  summary: string;
  description: string | null;
  level: CourseLevel;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  learningOutcomes: string[];
};

type ProductOption = {
  id: string;
  name: string;
  status: string;
};

export function CourseDetailsForm({
  initial,
  products,
}: {
  initial?: Initial;
  products: ProductOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [productId, setProductId] = React.useState(
    initial?.productId ?? products[0]?.id ?? ""
  );
  const [summary, setSummary] = React.useState(initial?.summary ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [level, setLevel] = React.useState<CourseLevel>(
    initial?.level ?? "beginner"
  );
  const [thumbnailUrl, setThumbnailUrl] = React.useState(
    initial?.thumbnailUrl ?? ""
  );
  const [estimatedDuration, setEstimatedDuration] = React.useState(
    initial?.estimatedDuration ? String(initial.estimatedDuration) : ""
  );
  const [outcomes, setOutcomes] = React.useState<string[]>(
    initial?.learningOutcomes?.length ? initial.learningOutcomes : [""]
  );

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const payload = {
      title,
      productId,
      summary,
      description: description || null,
      level,
      thumbnailUrl: thumbnailUrl || null,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
      learningOutcomes: outcomes.map((o) => o.trim()).filter(Boolean),
    };

    const res =
      isEdit && initial?.id
        ? await updateCourse(initial.id, payload)
        : await createCourse(payload);

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!isEdit && "id" in res) {
      router.push(`/admin/courses/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Welcome to Arcium"
          required
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="product">Ecosystem Project</Label>
          <Select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.status !== "published" ? ` (${product.status})` : ""}
              </option>
            ))}
          </Select>
          {products.length === 0 && (
            <p className="text-xs text-destructive">
              Create an ecosystem project before creating courses.
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="duration">Estimated duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={0}
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="30"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="level">Difficulty</Label>
        <Select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value as CourseLevel)}
          className="max-w-xs"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A short, plain-language description shown on course cards."
          required
          rows={2}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">
          About this course <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A fuller explanation of what the course covers and who it's for."
          rows={5}
        />
      </div>

      <div className="grid gap-2">
        <Label>What you&apos;ll learn</Label>
        <div className="space-y-2">
          {outcomes.map((outcome, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={outcome}
                onChange={(e) =>
                  setOutcomes((prev) =>
                    prev.map((o, idx) => (idx === i ? e.target.value : o))
                  )
                }
                placeholder={`Outcome ${i + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setOutcomes((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setOutcomes((prev) => [...prev, ""])}
        >
          <Plus />
          Add outcome
        </Button>
      </div>

      <CloudinaryUpload
        label="Course thumbnail"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy || products.length === 0}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {isEdit ? "Save changes" : "Create course"}
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
