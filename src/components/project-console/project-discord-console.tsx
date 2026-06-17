"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  runDiscordPermissionCheck,
  saveDiscordRoleRule,
  saveProjectDiscordIntegration,
} from "@/app/actions/project-discord";

type BadgeOption = { id: string; name: string; courseTitle: string };
type RuleRow = {
  id: string;
  badgeId: string;
  discordRoleId: string;
  discordRoleName: string;
  unlockLabel: string | null;
  status: "draft" | "active" | "paused";
};

type GrantRow = {
  id: string;
  status: string;
  lastErrorMessage: string | null;
  attemptCount: number;
  updatedAt: string;
  userWallet: string;
  ruleName: string;
};

type Props = {
  productId: string;
  productName: string;
  botInviteUrl: string | null;
  integration: {
    guildId: string;
    guildName: string;
    status: "draft" | "active" | "paused";
    botInstalled: boolean;
    lastPermissionCheckStatus: string | null;
    lastPermissionCheckAt: string | null;
  } | null;
  badges: BadgeOption[];
  rules: RuleRow[];
  recentGrants: GrantRow[];
};

export function ProjectDiscordConsole({
  productId,
  productName,
  botInviteUrl,
  integration,
  badges,
  rules,
  recentGrants,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const [guildId, setGuildId] = React.useState(integration?.guildId ?? "");
  const [guildName, setGuildName] = React.useState(integration?.guildName ?? "");
  const [integrationStatus, setIntegrationStatus] = React.useState<
    "draft" | "active" | "paused"
  >(integration?.status ?? "draft");

  const [badgeId, setBadgeId] = React.useState(badges[0]?.id ?? "");
  const [discordRoleId, setDiscordRoleId] = React.useState("");
  const [discordRoleName, setDiscordRoleName] = React.useState("");
  const [unlockLabel, setUnlockLabel] = React.useState("");
  const [ruleStatus, setRuleStatus] = React.useState<"draft" | "active" | "paused">(
    "draft"
  );

  async function saveIntegration(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await saveProjectDiscordIntegration(productId, {
      guildId,
      guildName,
      status: integrationStatus,
    });
    if ("error" in res) setError(res.error);
    else {
      setMessage("Discord server settings saved.");
      router.refresh();
    }
    setBusy(false);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await saveDiscordRoleRule(productId, {
      badgeId,
      discordRoleId,
      discordRoleName,
      unlockLabel: unlockLabel || null,
      status: ruleStatus,
    });
    if ("error" in res) setError(res.error);
    else {
      setMessage("Role rule saved.");
      setDiscordRoleId("");
      setDiscordRoleName("");
      setUnlockLabel("");
      router.refresh();
    }
    setBusy(false);
  }

  async function checkPermissions() {
    if (!discordRoleId.trim()) {
      setError("Enter a role ID to check permissions.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await runDiscordPermissionCheck(productId, discordRoleId);
    if ("error" in res) setError(res.error);
    else {
      setMessage(res.message);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discord — {productName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Discord server and map published badges to server roles.
        </p>
      </div>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">1. Add the Arcademy bot</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite the bot with Manage Roles permission, then enter your server details below.
        </p>
        {botInviteUrl && (
          <Button asChild variant="outline" className="mt-4">
            <a href={botInviteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Invite Arcademy bot
            </a>
          </Button>
        )}
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">2. Server configuration</h2>
        <form onSubmit={saveIntegration} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guild-id">Server ID</Label>
              <Input
                id="guild-id"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                placeholder="Discord guild ID"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guild-name">Server name</Label>
              <Input
                id="guild-name"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                placeholder="Community server"
              />
            </div>
          </div>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="integration-status">Integration status</Label>
            <Select
              id="integration-status"
              value={integrationStatus}
              onChange={(e) =>
                setIntegrationStatus(e.target.value as "draft" | "active" | "paused")
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
          {integration && (
            <Alert variant={integration.botInstalled ? "success" : "warning"}>
              <ShieldCheck />
              <AlertDescription>
                {integration.botInstalled
                  ? "Bot appears to be in this server."
                  : "Bot not detected in this server yet."}
                {integration.lastPermissionCheckStatus && (
                  <span className="block mt-1">
                    Last check: {integration.lastPermissionCheckStatus}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Save server"}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">3. Badge → role rules</h2>
        <form onSubmit={saveRule} className="mt-4 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="badge-select">Badge</Label>
            <Select
              id="badge-select"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
            >
              {badges.length === 0 ? (
                <option value="">No published badges</option>
              ) : (
                badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.courseTitle}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-id">Role ID</Label>
              <Input
                id="role-id"
                value={discordRoleId}
                onChange={(e) => setDiscordRoleId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={discordRoleName}
                onChange={(e) => setDiscordRoleName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unlock-label">Unlock label (optional)</Label>
            <Input
              id="unlock-label"
              value={unlockLabel}
              onChange={(e) => setUnlockLabel(e.target.value)}
              placeholder="The Basics"
            />
          </div>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="rule-status">Rule status</Label>
            <Select
              id="rule-status"
              value={ruleStatus}
              onChange={(e) => setRuleStatus(e.target.value as "draft" | "active" | "paused")}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || badges.length === 0}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Save rule"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={checkPermissions}>
              Test bot permissions
            </Button>
          </div>
        </form>

        {rules.length > 0 && (
          <ul className="mt-6 divide-y rounded-lg border">
            {rules.map((rule) => (
              <li key={rule.id} className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {rule.unlockLabel || rule.discordRoleName}
                  <span className="ml-2 capitalize text-muted-foreground">
                    ({rule.status})
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Role {rule.discordRoleName} · ID {rule.discordRoleId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Recent grant attempts</h2>
        {recentGrants.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No grant attempts yet.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {recentGrants.map((grant) => (
              <li key={grant.id} className="px-4 py-3 text-sm">
                <p className="font-medium capitalize">{grant.status.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground">
                  {grant.ruleName} · {grant.userWallet}
                </p>
                {grant.lastErrorMessage && (
                  <p className="text-destructive">{grant.lastErrorMessage}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
