"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/app/actions/auth";
import { FIELD_LIMITS as L } from "@/lib/field-limits";

export function DisplayNameForm({
  initialName,
}: {
  initialName: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialName ?? "");
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    await updateDisplayName(value);
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {initialName || "Learner"}
        </h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label="Edit display name"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your display name"
        maxLength={L.displayName}
        className="h-9 w-full sm:w-56"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={busy} className="flex-1 sm:flex-none">
          {busy ? <Loader2 className="animate-spin" /> : <Check />}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </div>
  );
}
