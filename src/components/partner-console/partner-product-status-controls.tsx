"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPartnerProductStatus } from "@/app/actions/partner-products";
import type { ReadinessReport } from "@/lib/publish-readiness";

export function PartnerProductStatusControls({
  productId,
  status,
  readiness,
}: {
  productId: string;
  status: string;
  readiness?: ReadinessReport;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePublish() {
    setBusy("publish");
    setError(null);
    const res = await setPartnerProductStatus(productId, "published");
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleUnpublish() {
    setBusy("unpublish");
    setError(null);
    const res = await setPartnerProductStatus(productId, "draft");
    setBusy(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (status === "archived") {
    return (
      <p className="text-sm text-muted-foreground">
        This project is archived. Contact Arcademy staff to restore it.
      </p>
    );
  }

  const publishBlocked = readiness ? !readiness.ready : false;

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {status !== "published" ? (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={busy !== null || publishBlocked}
          >
            {busy === "publish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Globe />
            )}
            Publish project
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnpublish}
            disabled={busy !== null}
          >
            {busy === "unpublish" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <EyeOff />
            )}
            Unpublish project
          </Button>
        )}
      </div>
      {status === "published" ? (
        <p className="text-xs text-muted-foreground">
          Your project page is live on Arcademy.
        </p>
      ) : publishBlocked && readiness?.blockers[0] ? (
        <p className="max-w-sm text-right text-xs text-muted-foreground">
          {readiness.blockers[0]}
        </p>
      ) : (
        <p className="max-w-sm text-right text-xs text-muted-foreground">
          Publish your project before courses can go live.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
