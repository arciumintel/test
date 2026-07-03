"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
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
import { createCourse, updateCourse } from "@/app/actions/admin";
import {
  createPartnerCourse,
  updatePartnerCourse,
} from "@/app/actions/project-courses";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
import type { CourseLevel, CourseType } from "@prisma/client";

type EditorVariant = "admin" | "partner";

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
  variant = "admin",
  partnerProductId,
  coursePathPrefix,
  readOnly = false,
}: {
  initial?: Initial;
  products: ProductOption[];
  prerequisiteOptions?: PrerequisiteOption[];
  variant?: EditorVariant;
  partnerProductId?: string;
  coursePathPrefix?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [productId, setProductId] = React.useState(
    initial?.productId ?? partnerProductId ?? products[0]?.id ?? ""
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
        ? variant === "partner" && partnerProductId
          ? await updatePartnerCourse(partnerProductId, initial.id, payload)
          : await updateCourse(initial.id, payload)
        : variant === "partner" && partnerProductId
          ? await createPartnerCourse(partnerProductId, payload)
          : await createCourse(payload);

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!isEdit && "id" in res) {
      const base =
        coursePathPrefix ??
        (variant === "partner" && partnerProductId
          ? `/partner-console/${partnerProductId}/courses`
          : "/admin/courses");
      router.push(`${base}/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <FormLayout onSubmit={handleSubmit}>
      <FormSection
        title="General information"
        description="Core details shown on course cards and the course landing page."
      >
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, learner-friendly course title"
              maxLength={L.courseTitle}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="summary">Summary</FormLabel>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe what learners will gain in one or two sentences"
              maxLength={L.courseSummary}
              required
              rows={3}
            />
            <FormHelperText>
              Shown on course cards in the catalog.
            </FormHelperText>
          </FormField>

          <FormField>
            <FormLabel htmlFor="description">
              About this course{" "}
              <span className="font-normal text-muted-foreground/80">(optional)</span>
            </FormLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what the course covers and who it is for"
              maxLength={L.courseDescription}
              rows={5}
            />
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection
        title="Classification"
        description="How this course is organized and filtered in the catalog."
      >
        <FormFieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="product">Project</FormLabel>
              <Select
                id="product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                disabled={variant === "partner"}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.status !== "published" ? ` (${product.status})` : ""}
                  </option>
                ))}
              </Select>
              {products.length === 0 && (
                <FormHelperText className="text-destructive">
                  Create a project before creating courses.
                </FormHelperText>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="duration">Estimated duration</FormLabel>
              <Input
                id="duration"
                type="number"
                min={0}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="30"
              />
              <FormHelperText>Approximate completion time in minutes.</FormHelperText>
            </FormField>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="level">Difficulty</FormLabel>
              <Select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </FormField>

            <FormField>
              <FormLabel htmlFor="courseType">Course type</FormLabel>
              <Select
                id="courseType"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value as CourseType)}
              >
                <option value="foundational">Foundational</option>
                <option value="product_onboarding">Project onboarding</option>
                <option value="builder_intro">Builder intro</option>
              </Select>
              <FormHelperText>Used for filtering and recommendations.</FormHelperText>
            </FormField>
          </div>

          {prerequisiteOptions.length > 0 && (
            <FormField>
              <FormLabel>Prerequisite courses</FormLabel>
              <FormHelperText>
                Optional. Learners should complete these before starting this course.
              </FormHelperText>
              <div className="space-y-2 rounded-xl border bg-input-background/50 p-4">
                {prerequisiteOptions.map((course) => (
                  <label
                    key={course.id}
                    className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-foreground"
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
                      className="size-4 shrink-0 rounded-md border-input"
                    />
                    <span className="min-w-0 break-words">{course.title}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}
        </FormFieldGroup>
      </FormSection>

      <FormSection
        title="Learning outcomes"
        description="What learners will be able to do after completing this course."
      >
        <FormField>
          <div className="space-y-3">
            {outcomes.map((outcome, i) => (
              <div key={i} className="flex min-w-0 items-center gap-2">
                <Input
                  value={outcome}
                  onChange={(e) =>
                    setOutcomes((prev) =>
                      prev.map((o, idx) => (idx === i ? e.target.value : o))
                    )
                  }
                  placeholder={`Describe outcome ${i + 1}`}
                  maxLength={L.learningOutcome}
                  className="min-w-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setOutcomes((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  aria-label={`Remove outcome ${i + 1}`}
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
            className="mt-4 w-fit"
            onClick={() => setOutcomes((prev) => [...prev, ""])}
          >
            <Plus />
            Add outcome
          </Button>
        </FormField>
      </FormSection>

      <FormSection title="Media">
        <CloudinaryUpload
          label="Course thumbnail"
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          productId={variant === "partner" ? partnerProductId : undefined}
        />
      </FormSection>

      {!readOnly && (
        <FormActions sticky>
          <FormSubmitButton busy={busy} disabled={products.length === 0}>
            <Save />
            {isEdit ? "Save changes" : "Create course"}
          </FormSubmitButton>
          <FormSaveStatus saved={saved} error={error} />
        </FormActions>
      )}
    </FormLayout>
  );
}
