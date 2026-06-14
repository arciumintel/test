"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, EyeOff, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCourseStatus } from "@/app/actions/admin";
import type { CourseStatus } from "@prisma/client";

export function CourseStatusControls({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function update(next: CourseStatus, key: string) {
    setBusy(key);
    setError(null);
    const res = await setCourseStatus(courseId, next);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {status !== "published" && (
          <Button
            size="sm"
            onClick={() => update("published", "publish")}
            disabled={busy !== null}
          >
            {busy === "publish" ? <Loader2 className="animate-spin" /> : <Globe />}
            Publish
          </Button>
        )}
        {status === "published" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update("draft", "unpublish")}
            disabled={busy !== null}
          >
            {busy === "unpublish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <EyeOff />
            )}
            Unpublish
          </Button>
        )}
        {status !== "archived" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update("archived", "archive")}
            disabled={busy !== null}
          >
            {busy === "archive" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Archive />
            )}
            Archive
          </Button>
        )}
        {status === "archived" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update("draft", "restore")}
            disabled={busy !== null}
          >
            {busy === "restore" ? <Loader2 className="animate-spin" /> : null}
            Restore to draft
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
