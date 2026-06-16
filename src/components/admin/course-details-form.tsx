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
import type { CourseLevel, CourseType } from "@prisma/client";

type Initial = {
  id?: string;
  title: string;
  productId: string;
  summary: string;
  description: string | null;
  level: CourseLevel;
  courseType: CourseType;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  learningOutcomes: string[];
  prerequisiteCourseIds: string[];
};

type ProductOption = {
  id: string;
  name: string;
  status: string;
};

type PrerequisiteOption = {
  id: string;
  title: string;
};

export function CourseDetailsForm({
  initial,
  products,
  prerequisiteOptions = [],
}: {
  initial?: Initial;
  products: ProductOption[];
  prerequisiteOptions?: PrerequisiteOption[];
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
  const [courseType, setCourseType] = React.useState<CourseType>(
    initial?.courseType ?? "foundational"
  );
  const [prerequisiteCourseIds, setPrerequisiteCourseIds] = React.useState<string[]>(
    initial?.prerequisiteCourseIds ?? []
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
      courseType,
      thumbnailUrl: thumbnailUrl || null,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
      learningOutcomes: outcomes.map((o) => o.trim()).filter(Boolean),
      prerequisiteCourseIds,
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

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="level">Difficulty</Label>
          <Select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as CourseLevel)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="courseType">Course type</Label>
          <Select
            id="courseType"
            value={courseType}
            onChange={(e) => setCourseType(e.target.value as CourseType)}
          >
            <option value="foundational">Foundational</option>
            <option value="product_onboarding">Ecosystem project onboarding</option>
            <option value="builder_intro">Builder intro</option>
          </Select>
        </div>
      </div>

      {prerequisiteOptions.length > 0 && (
        <div className="grid gap-2">
          <Label>Prerequisite courses</Label>
          <p className="text-xs text-muted-foreground">
            Optional. Learners should complete these before starting this course.
          </p>
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            {prerequisiteOptions.map((course) => (
              <label
                key={course.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={prerequisiteCourseIds.includes(course.id)}
                  onChange={(e) => {
                    setPrerequisiteCourseIds((prev) =>
                      e.target.checked
                        ? [...prev, course.id]
                        : prev.filter((id) => id !== course.id)
                    );
                  }}
                  className="size-4 rounded border-input"
                />
                {course.title}
              </label>
            ))}
          </div>
        </div>
      )}

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
