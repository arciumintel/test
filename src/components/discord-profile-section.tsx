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

function discordOAuthFeedback(status: string | null): {
  message: string | null;
  error: string | null;
} {
  switch (status) {
    case "connected":
      return {
        message:
          "Discord connected. Eligible server roles will sync automatically.",
        error: null,
      };
    case "denied":
      return { message: null, error: "Discord connection was cancelled." };
    case "already_linked":
      return {
        message: null,
        error: "That Discord account is already linked to another Arcademy user.",
      };
    case "invalid_state":
      return {
        message: null,
        error: "Connection link expired. Try connecting Discord again.",
      };
    case "invalid_callback":
    case "failed":
      return {
        message: null,
        error: "Could not connect Discord. Try again in a moment.",
      };
    case "not_configured":
      return {
        message: null,
        error: "Discord linking is not available on this deployment.",
      };
    default:
      return { message: null, error: null };
  }
}

type Props = {
  discordStatus: string | null;
  linked: {
    username: string;
    globalName?: string | null;
    linkedAt: string;
  } | null;
  recentFailures: GrantRow[];
  className?: string;
  headingId?: string;
};

function displayName(linked: NonNullable<Props["linked"]>): string {
  return linked.globalName?.trim() || linked.username;
}

export function DiscordProfileSection({
  discordStatus,
  linked,
  recentFailures,
  className,
  headingId = "discord-heading",
}: Props) {
  const router = useRouter();
  const oauthFeedback = discordOAuthFeedback(discordStatus);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const error = formError ?? oauthFeedback.error;
  const message = formMessage ?? oauthFeedback.message;

  React.useEffect(() => {
    if (discordStatus !== "connected") return;
    router.replace("/profile", { scroll: false });
  }, [discordStatus, router]);

  async function handleDisconnect() {
    setBusy("disconnect");
    setFormError(null);
    setFormMessage(null);
    const res = await disconnectDiscord();
    if ("error" in res) setFormError(res.error);
    else router.refresh();
    setBusy(null);
  }

  async function handleRetry(grantId: string) {
    setBusy(grantId);
    setFormError(null);
    setFormMessage(null);
    const res = await retryMyDiscordGrant(grantId);
    if ("error" in res) setFormError(res.error);
    else {
      setFormMessage("Role sync in progress — check back in a moment.");
      router.refresh();
    }
    setBusy(null);
  }

  if (!linked) {
    return (
      <section className={className} aria-labelledby={headingId}>
        <h2 id={headingId} className="text-lg font-semibold tracking-tight">
          Discord
        </h2>
        <div className="mt-4 rounded-xl border bg-muted/20 p-6">
          <p className="text-sm text-muted-foreground">
            Link Discord to receive project server roles when you earn badges.
            This is optional — your Arcademy progress and badges work without it.
          </p>
          <Button asChild className="mt-4">
            <a href="/api/discord/connect">Connect Discord</a>
          </Button>
          {message && <p className="mt-4 text-sm text-success">{message}</p>}
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-semibold tracking-tight">
        Discord
      </h2>
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

        {message && <p className="mt-4 text-sm text-success">{message}</p>}

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
                    {grant.lastErrorMessage ? `: ${grant.lastErrorMessage}` : ""}
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
