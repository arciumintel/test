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
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { LearnerVisibilityField } from "@/components/admin/learner-visibility-field";
import {
  formatLearnerVisibility,
  isVisibleToLearners,
  visibilityToStatus,
} from "@/lib/learner-visibility";
import {
  ModuleManager,
  ModuleForm,
  ModuleListRow,
  ModulesPanelHeader,
  type AdminModule,
} from "@/components/admin/module-manager";
import { QuizManager, type AdminQuiz } from "@/components/admin/quiz-manager";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  reorderModules,
} from "@/app/actions/admin";
import {
  createPartnerLesson,
  updatePartnerLesson,
  deletePartnerLesson,
  reorderPartnerLessons,
} from "@/app/actions/project-courses";
import { FIELD_LIMITS as L } from "@/lib/field-limits";
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
  moduleId: string | null;
};

export type AdminLessonQuiz = AdminQuiz;

export function LessonsManager({
  courseId,
  lessons,
  modules = [],
  lessonQuizzes = {},
  variant = "admin",
  partnerProductId,
  readOnly = false,
}: {
  courseId: string;
  lessons: AdminLesson[];
  modules?: AdminModule[];
  lessonQuizzes?: Record<string, AdminLessonQuiz>;
  variant?: "admin" | "partner";
  partnerProductId?: string;
  readOnly?: boolean;
}) {
  const useGroupedModules = modules.length > 0 && variant === "admin";

  if (useGroupedModules) {
    return (
      <GroupedLessonsManager
        courseId={courseId}
        lessons={lessons}
        modules={modules}
        lessonQuizzes={lessonQuizzes}
        readOnly={readOnly}
      />
    );
  }

  return (
    <FlatLessonsManager
      courseId={courseId}
      lessons={lessons}
      modules={modules}
      lessonQuizzes={lessonQuizzes}
      variant={variant}
      partnerProductId={partnerProductId}
      readOnly={readOnly}
    />
  );
}

function FlatLessonsManager({
  courseId,
  lessons,
  modules,
  lessonQuizzes,
  variant,
  partnerProductId,
  readOnly,
}: {
  courseId: string;
  lessons: AdminLesson[];
  modules: AdminModule[];
  lessonQuizzes: Record<string, AdminLessonQuiz>;
  variant: "admin" | "partner";
  partnerProductId?: string;
  readOnly: boolean;
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
      <ModuleManager courseId={courseId} modules={modules} readOnly={readOnly} />

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
          modules={modules}
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
              lessonQuiz={lessonQuizzes[lesson.id] ?? null}
              modules={modules}
              variant={variant}
              partnerProductId={partnerProductId}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={i}
              readOnly={readOnly}
              reordering={reordering}
              canMoveUp={i > 0}
              canMoveDown={i < lessons.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onEdit={() => setEditing(lesson.id)}
              onDeleted={() => router.refresh()}
              variant={variant}
              partnerProductId={partnerProductId}
            />
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

function GroupedLessonsManager({
  courseId,
  lessons,
  modules,
  lessonQuizzes,
  readOnly,
}: {
  courseId: string;
  lessons: AdminLesson[];
  modules: AdminModule[];
  lessonQuizzes: Record<string, AdminLessonQuiz>;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editingLesson, setEditingLesson] = React.useState<string | "new" | null>(
    null
  );
  const [editingModule, setEditingModule] = React.useState<string | "new" | null>(
    null
  );
  const [reorderingLessons, setReorderingLessons] = React.useState(false);
  const [reorderingModules, setReorderingModules] = React.useState(false);
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    () => new Set()
  );
  const [expandedUngrouped, setExpandedUngrouped] = React.useState(true);

  const ungroupedLessons = lessons.filter((lesson) => !lesson.moduleId);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  async function moveModule(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= modules.length) return;
    const ids = modules.map((m) => m.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReorderingModules(true);
    await reorderModules(courseId, ids);
    setReorderingModules(false);
    router.refresh();
  }

  async function moveLessonInGroup(groupLessonIds: string[], lessonId: string, dir: -1 | 1) {
    const indexInGroup = groupLessonIds.indexOf(lessonId);
    const targetInGroup = indexInGroup + dir;
    if (targetInGroup < 0 || targetInGroup >= groupLessonIds.length) return;

    const globalIds = lessons.map((l) => l.id);
    const globalIndex = globalIds.indexOf(lessonId);
    const swapId = groupLessonIds[targetInGroup];
    const swapGlobalIndex = globalIds.indexOf(swapId);
    [globalIds[globalIndex], globalIds[swapGlobalIndex]] = [
      globalIds[swapGlobalIndex],
      globalIds[globalIndex],
    ];

    setReorderingLessons(true);
    await reorderLessons(courseId, globalIds);
    setReorderingLessons(false);
    router.refresh();
  }

  function renderLessonList(groupLessons: AdminLesson[], groupLessonIds: string[]) {
    return groupLessons.map((lesson, i) => {
      const globalIndex = lessons.findIndex((item) => item.id === lesson.id);

      if (editingLesson === lesson.id) {
        return (
          <LessonForm
            key={lesson.id}
            courseId={courseId}
            lesson={lesson}
            lessonQuiz={lessonQuizzes[lesson.id] ?? null}
            modules={modules}
            variant="admin"
            onDone={() => {
              setEditingLesson(null);
              router.refresh();
            }}
            onCancel={() => setEditingLesson(null)}
          />
        );
      }

      return (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          index={globalIndex}
          readOnly={readOnly}
          reordering={reorderingLessons}
          canMoveUp={i > 0}
          canMoveDown={i < groupLessons.length - 1}
          onMoveUp={() => moveLessonInGroup(groupLessonIds, lesson.id, -1)}
          onMoveDown={() => moveLessonInGroup(groupLessonIds, lesson.id, 1)}
          onEdit={() => setEditingLesson(lesson.id)}
          onDeleted={() => router.refresh()}
          variant="admin"
          nested
        />
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <ModulesPanelHeader
          readOnly={readOnly}
          showAddButton={editingModule !== "new"}
          onAdd={() => setEditingModule("new")}
        />

        {!readOnly && editingModule === "new" && (
          <ModuleForm
            courseId={courseId}
            onDone={() => {
              setEditingModule(null);
              router.refresh();
            }}
            onCancel={() => setEditingModule(null)}
          />
        )}

        <div className="space-y-3">
          {modules.map((mod, i) => {
            const moduleLessons = lessons.filter((lesson) => lesson.moduleId === mod.id);
            const moduleLessonIds = moduleLessons.map((lesson) => lesson.id);
            const expanded = expandedModules.has(mod.id);

            return (
              <div key={mod.id} className="space-y-2">
                {editingModule === mod.id ? (
                  <ModuleForm
                    courseId={courseId}
                    module={mod}
                    onDone={() => {
                      setEditingModule(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingModule(null)}
                  />
                ) : (
                  <ModuleListRow
                    module={mod}
                    readOnly={readOnly}
                    expanded={expanded}
                    onToggle={() => toggleModule(mod.id)}
                    lessonCount={moduleLessons.length}
                    moveUpDisabled={i === 0 || reorderingModules}
                    moveDownDisabled={i === modules.length - 1 || reorderingModules}
                    onMoveUp={() => moveModule(i, -1)}
                    onMoveDown={() => moveModule(i, 1)}
                    onEdit={() => setEditingModule(mod.id)}
                    onDeleted={() => router.refresh()}
                  />
                )}

                {expanded && (
                  <div className="ml-4 space-y-2 border-l pl-4">
                    {moduleLessons.length > 0 ? (
                      renderLessonList(moduleLessons, moduleLessonIds)
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">
                        No lessons assigned to this module yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}. Learners
          progress through these in order.
        </p>
        {!readOnly && editingLesson !== "new" && (
          <Button size="sm" onClick={() => setEditingLesson("new")}>
            <Plus />
            Add lesson
          </Button>
        )}
      </div>

      {!readOnly && editingLesson === "new" && (
        <LessonForm
          courseId={courseId}
          modules={modules}
          variant="admin"
          onDone={() => {
            setEditingLesson(null);
            router.refresh();
          }}
          onCancel={() => setEditingLesson(null)}
        />
      )}

      {ungroupedLessons.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpandedUngrouped((open) => !open)}
            className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-left"
            aria-expanded={expandedUngrouped}
          >
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                expandedUngrouped ? "rotate-0" : "-rotate-90"
              }`}
            />
            <span className="text-sm font-medium">Additional lessons</span>
            <span className="text-xs text-muted-foreground">
              {ungroupedLessons.length} lesson
              {ungroupedLessons.length === 1 ? "" : "s"}
            </span>
          </button>

          {expandedUngrouped && (
            <div className="ml-4 space-y-2 border-l pl-4">
              {renderLessonList(
                ungroupedLessons,
                ungroupedLessons.map((lesson) => lesson.id)
              )}
            </div>
          )}
        </div>
      )}

      {lessons.length === 0 && editingLesson !== "new" && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No lessons yet. Add the first one.
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  readOnly,
  reordering,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDeleted,
  variant,
  partnerProductId,
  nested = false,
}: {
  lesson: AdminLesson;
  index: number;
  readOnly: boolean;
  reordering: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  variant: "admin" | "partner";
  partnerProductId?: string;
  nested?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 ${
        nested ? "border-dashed" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {!readOnly && (
          <>
            <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp || reordering}
                className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move lesson up"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown || reordering}
                className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move lesson down"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </>
        )}
        <span className="w-6 shrink-0 text-sm text-muted-foreground">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {lesson.title}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
        <StatusBadge variant={lesson.status === "published" ? "success" : "secondary"}>
          {variant === "partner"
            ? lesson.status === "published"
              ? "Live"
              : "Draft"
            : formatLearnerVisibility(lesson.status)}
        </StatusBadge>
        {!lesson.required && <Badge variant="muted">Optional</Badge>}
        {!readOnly && (
          <>
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit lesson">
              <Pencil />
            </Button>
            <DeleteLessonButton
              lessonId={lesson.id}
              variant={variant}
              partnerProductId={partnerProductId}
              onDeleted={onDeleted}
            />
          </>
        )}
      </div>
    </div>
  );
}

function LessonForm({
  courseId,
  lesson,
  lessonQuiz = null,
  modules = [],
  variant = "admin",
  partnerProductId,
  onDone,
  onCancel,
}: {
  courseId: string;
  lesson?: AdminLesson;
  lessonQuiz?: AdminLessonQuiz;
  modules?: AdminModule[];
  variant?: "admin" | "partner";
  partnerProductId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(lesson?.title ?? "");
  const [content, setContent] = React.useState(lesson?.content ?? "");
  const [mediaUrl, setMediaUrl] = React.useState(lesson?.mediaUrl ?? "");
  const [visibleToLearners, setVisibleToLearners] = React.useState(
    isVisibleToLearners(lesson?.status ?? "draft")
  );
  const [required, setRequired] = React.useState(lesson?.required ?? true);
  const [estimatedDuration, setEstimatedDuration] = React.useState(
    lesson?.estimatedDuration ? String(lesson.estimatedDuration) : ""
  );
  const [moduleId, setModuleId] = React.useState(lesson?.moduleId ?? "");
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
      status: variant === "partner" ? "draft" : visibilityToStatus(visibleToLearners),
      required,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
      moduleId: moduleId || null,
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
          maxLength={L.lessonTitle}
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
          maxLength={L.lessonContent}
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
        {variant === "admin" && (
          <LearnerVisibilityField
            id="lesson-visibility"
            visible={visibleToLearners}
            onChange={setVisibleToLearners}
            description="Optional lessons can stay hidden until you choose to show them."
          />
        )}
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
      {modules.length > 0 && variant === "admin" && (
        <div className="grid gap-2">
          <Label htmlFor="lesson-module">Module (optional)</Label>
          <Select
            id="lesson-module"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          >
            <option value="">No module</option>
            {modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title}
              </option>
            ))}
          </Select>
        </div>
      )}
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

      {lesson && variant === "admin" && (
        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-semibold">Optional knowledge check</h4>
          <QuizManager
            courseId={courseId}
            lessonId={lesson.id}
            quiz={lessonQuiz}
            scope="lesson"
          />
        </div>
      )}
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
