"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Save, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/badge";
import { LearnerVisibilityField } from "@/components/admin/learner-visibility-field";
import {
  formatPathVisibility,
  isVisibleToLearners,
  visibilityToStatus,
} from "@/lib/learner-visibility";
import {
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  setLearningPathCourses,
} from "@/app/actions/learning-paths";
import type { LearningPathStatus } from "@prisma/client";

export type AdminLearningPath = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: LearningPathStatus;
  courses: {
    courseId: string;
    order: number;
    course: { id: string; title: string; slug: string; status: string };
  }[];
};

type ProductCourse = { id: string; title: string; status: string };

export function LearningPathManager({
  productId,
  paths,
  productCourses,
}: {
  productId: string;
  paths: AdminLearningPath[];
  productCourses: ProductCourse[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<string | "new" | null>(null);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Learning paths</h3>
          <p className="text-sm text-muted-foreground">
            Curated course sequences shown on the product page.
          </p>
        </div>
        {editing !== "new" && (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus />
            Add path
          </Button>
        )}
      </div>

      {editing === "new" && (
        <PathForm
          productId={productId}
          productCourses={productCourses}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {paths.map((path) =>
        editing === path.id ? (
          <PathForm
            key={path.id}
            productId={productId}
            path={path}
            productCourses={productCourses}
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={path.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{path.title}</h4>
                  <StatusBadge
                    variant={path.status === "published" ? "success" : "secondary"}
                  >
                    {formatPathVisibility(path.status)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {path.courses.length} courses in path
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(path.id)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await deleteLearningPath(path.id);
                    router.refresh();
                  }}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            </div>
            {path.courses.length > 0 && (
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {path.courses.map((pc) => (
                  <li key={pc.courseId}>{pc.course.title}</li>
                ))}
              </ol>
            )}
          </div>
        )
      )}
    </div>
  );
}

function PathForm({
  productId,
  path,
  productCourses,
  onDone,
  onCancel,
}: {
  productId: string;
  path?: AdminLearningPath;
  productCourses: ProductCourse[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(path?.title ?? "");
  const [slug, setSlug] = React.useState(path?.slug ?? "");
  const [description, setDescription] = React.useState(path?.description ?? "");
  const [visibleOnProductPage, setVisibleOnProductPage] = React.useState(
    isVisibleToLearners(path?.status ?? "draft")
  );
  const [selectedCourses, setSelectedCourses] = React.useState<string[]>(
    path?.courses.map((c) => c.courseId) ?? []
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleCourse(courseId: string) {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      title,
      slug: slug || undefined,
      description: description || null,
      status: visibilityToStatus(visibleOnProductPage),
    };

    const res = path
      ? await updateLearningPath(path.id, payload)
      : await createLearningPath(productId, payload);

    if ("error" in res) {
      setBusy(false);
      setError(res.error);
      return;
    }

    const pathId =
      path?.id ??
      ("ok" in res && res.ok && "id" in res && typeof res.id === "string"
        ? res.id
        : "");
    if (!pathId) {
      setBusy(false);
      setError("Could not save learning path.");
      return;
    }
    const coursesRes = await setLearningPathCourses(pathId, selectedCourses);
    setBusy(false);

    if ("error" in coursesRes) {
      setError(coursesRes.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-2">
        <Label htmlFor="path-title">Path title</Label>
        <Input
          id="path-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="path-slug">Slug (optional)</Label>
        <Input id="path-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="path-description">Description</Label>
        <Textarea
          id="path-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <LearnerVisibilityField
        id="path-visibility"
        visible={visibleOnProductPage}
        onChange={setVisibleOnProductPage}
        label="Product page visibility"
        checkboxLabel="Visible on product page"
        description="Published paths appear on the project landing page."
      />
      <div className="grid gap-2">
        <Label>Courses in order</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {productCourses.map((course) => (
            <label
              key={course.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedCourses.includes(course.id)}
                onChange={() => toggleCourse(course.id)}
                className="size-4 rounded border-input"
              />
              <span>{course.title}</span>
              <span className="text-xs text-muted-foreground">({course.status})</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {path ? "Save path" : "Create path"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X />
          Cancel
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
