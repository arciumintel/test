"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/app/actions/auth";

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
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {initialName || "Learner"}
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Edit display name"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your display name"
        maxLength={60}
        className="h-9 w-56"
        autoFocus
      />
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Check />}
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}
