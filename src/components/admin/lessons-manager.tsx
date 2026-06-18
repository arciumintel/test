"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "@/app/actions/admin";
import {
  createPartnerLesson,
  updatePartnerLesson,
  deletePartnerLesson,
  reorderPartnerLessons,
} from "@/app/actions/project-courses";
import type { LessonStatus } from "@prisma/client";

export type AdminLesson = {
  id: string;
  title: string;
  order: number;
  status: LessonStatus;
  content: string;
  mediaUrl: string | null;
  required: boolean;
  estimatedDuration: number | null;
};

export function LessonsManager({
  courseId,
  lessons,
  variant = "admin",
  partnerProductId,
  readOnly = false,
}: {
  courseId: string;
  lessons: AdminLesson[];
  variant?: "admin" | "partner";
  partnerProductId?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [reordering, setReordering] = React.useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= lessons.length) return;
    const ids = lessons.map((l) => l.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    if (variant === "partner" && partnerProductId) {
      await reorderPartnerLessons(partnerProductId, courseId, ids);
    } else {
      await reorderLessons(courseId, ids);
    }
    setReordering(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}. Learners
          progress through these in order.
        </p>
        {!readOnly && editing !== "new" && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus />
            Add lesson
          </Button>
        )}
      </div>

      {!readOnly && editing === "new" && (
        <LessonForm
          courseId={courseId}
          variant={variant}
          partnerProductId={partnerProductId}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-2">
        {lessons.map((lesson, i) =>
          editing === lesson.id ? (
            <LessonForm
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              variant={variant}
              partnerProductId={partnerProductId}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={lesson.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
            >
              {!readOnly && (
                <>
                  <GripVertical className="size-4 text-muted-foreground/50" />
                  <div className="flex flex-col">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || reordering}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === lessons.length - 1 || reordering}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                </>
              )}
              <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium">
                {lesson.title}
              </span>
              <Badge variant={lesson.status === "published" ? "success" : "secondary"}>
                {lesson.status}
              </Badge>
              {!lesson.required && (
                <Badge variant="muted">Optional</Badge>
              )}
              {!readOnly && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(lesson.id)}
                  >
                    <Pencil />
                  </Button>
                  <DeleteLessonButton
                    lessonId={lesson.id}
                    variant={variant}
                    partnerProductId={partnerProductId}
                    onDeleted={() => router.refresh()}
                  />
                </>
              )}
            </div>
          )
        )}
        {lessons.length === 0 && editing !== "new" && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No lessons yet. Add the first one.
          </div>
        )}
      </div>
    </div>
  );
}

function LessonForm({
  courseId,
  lesson,
  variant = "admin",
  partnerProductId,
  onDone,
  onCancel,
}: {
  courseId: string;
  lesson?: AdminLesson;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(lesson?.title ?? "");
  const [content, setContent] = React.useState(lesson?.content ?? "");
  const [mediaUrl, setMediaUrl] = React.useState(lesson?.mediaUrl ?? "");
  const [status, setStatus] = React.useState<LessonStatus>(
    lesson?.status ?? "draft"
  );
  const [required, setRequired] = React.useState(lesson?.required ?? true);
  const [estimatedDuration, setEstimatedDuration] = React.useState(
    lesson?.estimatedDuration ? String(lesson.estimatedDuration) : ""
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title,
      content,
      mediaUrl: mediaUrl || null,
      status,
      required,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
    };
    const res =
      lesson && variant === "partner" && partnerProductId
        ? await updatePartnerLesson(partnerProductId, lesson.id, payload)
        : lesson
          ? await updateLesson(lesson.id, payload)
          : variant === "partner" && partnerProductId
            ? await createPartnerLesson(partnerProductId, courseId, payload)
            : await createLesson(courseId, payload);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border bg-muted/20 p-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="lesson-title">Lesson title</Label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lesson-content">
          Content
          <span className="text-xs font-normal text-muted-foreground">
            Markdown-style: # heading, - bullet, **bold**
          </span>
        </Label>
        <Textarea
          id="lesson-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          required
          className="font-mono text-[0.85rem]"
        />
      </div>
      <CloudinaryUpload
        label="Lesson media (optional)"
        value={mediaUrl}
        onChange={setMediaUrl}
        productId={variant === "partner" ? partnerProductId : undefined}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="lesson-status">Status</Label>
          <Select
            id="lesson-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LessonStatus)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lesson-duration">Estimated duration (minutes)</Label>
          <Input
            id="lesson-duration"
            type="number"
            min={0}
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Required for course completion
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {lesson ? "Save lesson" : "Add lesson"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X />
          Cancel
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}

function DeleteLessonButton({
  lessonId,
  variant = "admin",
  partnerProductId,
  onDeleted,
}: {
  lessonId: string;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    setBusy(true);
    if (variant === "partner" && partnerProductId) {
      await deletePartnerLesson(partnerProductId, lessonId);
    } else {
      await deleteLesson(lessonId);
    }
    setBusy(false);
    onDeleted();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : null}
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setConfirming(true)}
      aria-label="Delete lesson"
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  );
}
