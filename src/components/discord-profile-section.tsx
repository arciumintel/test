"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { disconnectDiscord, retryMyDiscordGrant } from "@/app/actions/discord";

type GrantRow = {
  id: string;
  status: string;
  lastErrorMessage: string | null;
  ruleName: string;
  guildName: string;
};

type Props = {
  linked: {
    username: string;
    globalName?: string | null;
    linkedAt: string;
  } | null;
  recentFailures: GrantRow[];
};

function displayName(linked: NonNullable<Props["linked"]>): string {
  return linked.globalName?.trim() || linked.username;
}

export function DiscordProfileSection({ linked, recentFailures }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDisconnect() {
    setBusy("disconnect");
    setError(null);
    const res = await disconnectDiscord();
    if ("error" in res) setError(res.error);
    else router.refresh();
    setBusy(null);
  }

  async function handleRetry(grantId: string) {
    setBusy(grantId);
    setError(null);
    const res = await retryMyDiscordGrant(grantId);
    if ("error" in res) setError(res.error);
    else router.refresh();
    setBusy(null);
  }

  if (!linked) {
    return (
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Discord</h2>
        <div className="mt-4 rounded-xl border bg-muted/20 p-6">
          <p className="text-sm text-muted-foreground">
            Link Discord to receive project server roles when you earn badges.
            This is optional — your Arcademy progress and badges work without it.
          </p>
          <Button asChild className="mt-4">
            <a href="/api/discord/connect">Connect Discord</a>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Discord</h2>
      <div className="mt-4 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{displayName(linked)}</p>
            <p className="text-sm text-muted-foreground">
              Connected {new Date(linked.linkedAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={busy === "disconnect"}
          >
            {busy === "disconnect" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Unlink className="size-4" />
            )}
            Disconnect
          </Button>
        </div>

        {recentFailures.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Recent role grant issues</p>
            {recentFailures.map((grant) => (
              <Alert key={grant.id} variant="destructive">
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="font-medium">{grant.ruleName}</span>
                    {" · "}
                    {grant.guildName}
                    {grant.lastErrorMessage ? ` — ${grant.lastErrorMessage}` : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(grant.id)}
                    disabled={busy === grant.id}
                  >
                    {busy === grant.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Retry"
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>
    </section>
  );
}
