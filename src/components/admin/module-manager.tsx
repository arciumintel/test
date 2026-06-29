"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Save, Trash2, ChevronUp, ChevronDown, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from "@/app/actions/admin";
import { FIELD_LIMITS as L } from "@/lib/field-limits";

export type AdminModule = {
  id: string;
  title: string;
  description: string | null;
  order: number;
};

export function ModulesPanelHeader({
  readOnly = false,
  showAddButton,
  onAdd,
}: {
  readOnly?: boolean;
  showAddButton: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold">Modules</h3>
        <p className="text-sm text-muted-foreground">
          Optional groupings for long courses. Lessons can be assigned to a
          module when editing.
        </p>
      </div>
      {!readOnly && showAddButton && (
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus />
          Add module
        </Button>
      )}
    </div>
  );
}

export function ModuleManager({
  courseId,
  modules,
  readOnly = false,
}: {
  courseId: string;
  modules: AdminModule[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [reordering, setReordering] = React.useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= modules.length) return;
    const ids = modules.map((m) => m.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    await reorderModules(courseId, ids);
    setReordering(false);
    router.refresh();
  }

  return (
    <div className="mb-8 space-y-4 rounded-lg border bg-muted/20 p-4">
      <ModulesPanelHeader
        readOnly={readOnly}
        showAddButton={editing !== "new"}
        onAdd={() => setEditing("new")}
      />

      {!readOnly && editing === "new" && (
        <ModuleForm
          courseId={courseId}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-2">
        {modules.map((mod, i) =>
          editing === mod.id ? (
            <ModuleForm
              key={mod.id}
              courseId={courseId}
              module={mod}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <ModuleListRow
              key={mod.id}
              module={mod}
              readOnly={readOnly}
              moveUpDisabled={i === 0 || reordering}
              moveDownDisabled={i === modules.length - 1 || reordering}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onEdit={() => setEditing(mod.id)}
              onDeleted={() => router.refresh()}
            />
          )
        )}
        {modules.length === 0 && editing !== "new" && (
          <p className="text-sm text-muted-foreground">
            No modules yet. Lessons will display as a flat list.
          </p>
        )}
      </div>
    </div>
  );
}

export function ModuleListRow({
  module,
  readOnly = false,
  expanded,
  onToggle,
  lessonCount,
  moveUpDisabled,
  moveDownDisabled,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDeleted,
}: {
  module: AdminModule;
  readOnly?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  lessonCount?: number;
  moveUpDisabled: boolean;
  moveDownDisabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const collapsible = onToggle !== undefined;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {!readOnly && (
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={moveUpDisabled}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move module up"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={moveDownDisabled}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move module down"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        )}
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                expanded ? "rotate-0" : "-rotate-90"
              }`}
            />
            <span className="truncate text-sm font-medium">{module.title}</span>
            {lessonCount !== undefined && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
              </span>
            )}
          </button>
        ) : (
          <span className="truncate text-sm font-medium">{module.title}</span>
        )}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit module">
            <Pencil />
          </Button>
          <DeleteModuleButton moduleId={module.id} onDeleted={onDeleted} />
        </div>
      )}
    </div>
  );
}

export function ModuleForm({
  courseId,
  module,
  onDone,
  onCancel,
}: {
  courseId: string;
  module?: AdminModule;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(module?.title ?? "");
  const [description, setDescription] = React.useState(module?.description ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title,
      description: description || null,
    };
    const res = module
      ? await updateModule(module.id, payload)
      : await createModule(courseId, payload);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-4">
      <div className="grid gap-2">
        <Label htmlFor="module-title">Module title</Label>
        <Input
          id="module-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={L.lessonTitle}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="module-description">Description (optional)</Label>
        <Textarea
          id="module-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {module ? "Save module" : "Add module"}
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

export function DeleteModuleButton({
  moduleId,
  onDeleted,
}: {
  moduleId: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await deleteModule(moduleId);
        setBusy(false);
        onDeleted();
      }}
      aria-label="Delete module"
    >
      {busy ? <Loader2 className="animate-spin" /> : <Trash2 className="text-muted-foreground" />}
    </Button>
  );
}
