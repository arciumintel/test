"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, EyeOff, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishApprovedCourse, setCourseStatus } from "@/app/actions/admin";
import { setProductStatus } from "@/app/actions/admin-products";
import { PARTNER_WORKFLOW_STATUSES } from "@/lib/course-schemas";
import type { CourseStatus, ProductStatus } from "@prisma/client";

const LEGACY_COURSE_STATUSES: CourseStatus[] = ["draft", "published", "archived"];

type EntityStatusControlsProps =
  | {
      entityType: "course";
      entityId: string;
      status: CourseStatus;
      publishDisabled?: boolean;
    }
  | {
      entityType: "product";
      entityId: string;
      status: ProductStatus;
      publishDisabled?: boolean;
    };

export function EntityStatusControls(props: EntityStatusControlsProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function updateCourse(
    next: "draft" | "published" | "archived",
    key: string
  ) {
    if (props.entityType !== "course") return;
    setBusy(key);
    setError(null);
    const res =
      next === "published" && props.status === "approved"
        ? await publishApprovedCourse(props.entityId)
        : await setCourseStatus(props.entityId, next);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function updateProduct(next: ProductStatus, key: string) {
    if (props.entityType !== "product") return;
    setBusy(key);
    setError(null);
    const res = await setProductStatus(props.entityId, next);
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (props.entityType === "course") {
    const { status, publishDisabled = false } = props;
    const isPartnerWorkflow = PARTNER_WORKFLOW_STATUSES.includes(
      status as (typeof PARTNER_WORKFLOW_STATUSES)[number]
    );

    if (isPartnerWorkflow && status !== "approved" && status !== "published") {
      return null;
    }

    if (!LEGACY_COURSE_STATUSES.includes(status) && status !== "approved") {
      return null;
    }

    const publishLabel =
      status === "approved" ? "Publish approved course" : "Publish course";

    return (
      <ActionGroup error={error}>
        {status !== "published" && (
          <Button
            size="sm"
            onClick={() => updateCourse("published", "publish")}
            disabled={busy !== null || publishDisabled}
          >
            {busy === "publish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Globe />
            )}
            {publishLabel}
          </Button>
        )}
        {status === "published" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateCourse("draft", "unpublish")}
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
        {status !== "archived" &&
          status !== "partner_draft" &&
          status !== "submitted_for_review" &&
          status !== "staff_changes_requested" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateCourse("archived", "archive")}
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
            onClick={() => updateCourse("draft", "restore")}
            disabled={busy !== null}
          >
            {busy === "restore" ? <Loader2 className="animate-spin" /> : null}
            Restore to draft
          </Button>
        )}
      </ActionGroup>
    );
  }

  const { status, publishDisabled = false } = props;

  return (
    <ActionGroup error={error}>
      {status !== "published" && (
        <Button
          size="sm"
          onClick={() => updateProduct("published", "publish")}
          disabled={busy !== null || publishDisabled}
        >
          {busy === "publish" ? <Loader2 className="animate-spin" /> : <Globe />}
          Publish project
        </Button>
      )}
      {status === "published" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateProduct("draft", "unpublish")}
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
          onClick={() => updateProduct("archived", "archive")}
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
          onClick={() => updateProduct("draft", "restore")}
          disabled={busy !== null}
        >
          {busy === "restore" ? <Loader2 className="animate-spin" /> : null}
          Restore to draft
        </Button>
      )}
    </ActionGroup>
  );
}

function ActionGroup({
  children,
  error,
}: {
  children: React.ReactNode;
  error: string | null;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
