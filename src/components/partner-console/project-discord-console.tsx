"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getProjectDiscordRoles,
  runDiscordPermissionCheck,
  saveDiscordRoleRule,
  saveProjectDiscordIntegration,
  setDiscordRoleRuleStatus,
} from "@/app/actions/project-discord";

type GuildRoleOption = { id: string; name: string; position: number };

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

function discordInstallFeedback(status: string | null): {
  message: string | null;
  error: string | null;
} {
  switch (status) {
    case "bot_installed":
      return {
        message: "Bot added — server ID and name were filled automatically.",
        error: null,
      };
    case "bot_install_denied":
      return { message: null, error: "Discord bot install was cancelled." };
    case "guild_not_found":
      return {
        message: null,
        error: "Could not look up that Discord server. Try saving again.",
      };
    case "bot_install_failed":
      return {
        message: null,
        error: "Bot install succeeded but saving server details failed. Try again.",
      };
    case "missing_guild":
      return {
        message: null,
        error:
          "Discord did not return a server ID. Use the Invite Arcademy bot button on this page (not a generic invite link from the Discord portal).",
      };
    case "invalid_state":
      return {
        message: null,
        error: "Install link expired or was invalid. Click Invite Arcademy bot again.",
      };
    case "forbidden":
      return {
        message: null,
        error: "You do not have permission to configure Discord for this project.",
      };
    case "not_configured":
      return {
        message: null,
        error: "Discord is not fully configured on this deployment.",
      };
    default:
      return { message: null, error: null };
  }
}

type Props = {
  productId: string;
  productName: string;
  botInviteUrl: string | null;
  botInviteConfigError: string | null;
  discordStatus: string | null;
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
  initialGuildRoles: GuildRoleOption[];
  initialGuildRolesError: string | null;
  recentGrants: GrantRow[];
};

export function ProjectDiscordConsole({
  productId,
  productName,
  botInviteUrl,
  botInviteConfigError,
  discordStatus,
  integration,
  badges,
  rules,
  initialGuildRoles,
  initialGuildRolesError,
  recentGrants,
}: Props) {
  const router = useRouter();
  const installFeedback = discordInstallFeedback(discordStatus);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const error = formError ?? installFeedback.error;
  const message = formMessage ?? installFeedback.message;

  const [guildId, setGuildId] = React.useState(integration?.guildId ?? "");
  const [guildName, setGuildName] = React.useState(integration?.guildName ?? "");
  const [integrationStatus, setIntegrationStatus] = React.useState<
    "draft" | "active" | "paused"
  >(integration?.status ?? "draft");

  const integrationFormKey = integration
    ? `${integration.guildId}:${integration.guildName}:${integration.status}`
    : "new";

  React.useEffect(() => {
    if (discordStatus !== "bot_installed") return;
    router.refresh();
    router.replace(`/partner-console/${productId}/discord`, { scroll: false });
  }, [discordStatus, productId, router]);

  React.useEffect(() => {
    function onFocus() {
      router.refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  const [badgeId, setBadgeId] = React.useState(badges[0]?.id ?? "");
  const [discordRoleId, setDiscordRoleId] = React.useState("");
  const [discordRoleName, setDiscordRoleName] = React.useState("");
  const [unlockLabel, setUnlockLabel] = React.useState("");
  const [ruleStatus, setRuleStatus] = React.useState<"draft" | "active" | "paused">(
    "draft"
  );
  const [editingRuleId, setEditingRuleId] = React.useState<string | null>(null);

  const [guildRoles, setGuildRoles] = React.useState<GuildRoleOption[]>(initialGuildRoles);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [rolesError, setRolesError] = React.useState<string | null>(initialGuildRolesError);

  const activeRuleCount = rules.filter((r) => r.status === "active").length;
  const integrationIsActive = integration?.status === "active";

  const usedBadgeIds = React.useMemo(
    () =>
      new Set(
        rules.filter((r) => r.id !== editingRuleId).map((r) => r.badgeId)
      ),
    [rules, editingRuleId]
  );
  const usedRoleIds = React.useMemo(
    () =>
      new Set(
        rules.filter((r) => r.id !== editingRuleId).map((r) => r.discordRoleId)
      ),
    [rules, editingRuleId]
  );

  const loadGuildRoles = React.useCallback(async () => {
    if (!integration?.guildId) return;
    setRolesLoading(true);
    setRolesError(null);
    const res = await getProjectDiscordRoles(productId);
    if ("error" in res) {
      setRolesError(res.error);
      setGuildRoles([]);
    } else {
      setGuildRoles(res.roles);
      if (res.roles.length === 0) {
        setRolesError("No assignable roles found — check bot permissions.");
      }
    }
    setRolesLoading(false);
  }, [integration?.guildId, productId]);

  function resetRuleForm() {
    setEditingRuleId(null);
    setBadgeId(badges[0]?.id ?? "");
    setDiscordRoleId("");
    setDiscordRoleName("");
    setUnlockLabel("");
    setRuleStatus("draft");
  }

  function startEditRule(rule: RuleRow) {
    setEditingRuleId(rule.id);
    setBadgeId(rule.badgeId);
    setDiscordRoleId(rule.discordRoleId);
    setDiscordRoleName(rule.discordRoleName);
    setUnlockLabel(rule.unlockLabel ?? "");
    setRuleStatus(rule.status);
  }

  function handleRoleSelect(roleId: string) {
    setDiscordRoleId(roleId);
    const role = guildRoles.find((r) => r.id === roleId);
    if (role) setDiscordRoleName(role.name);
  }

  async function saveIntegration(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setFormMessage(null);
    const res = await saveProjectDiscordIntegration(productId, {
      guildId,
      guildName,
      status: integrationStatus,
    });
    if ("error" in res) setFormError(res.error);
    else {
      setFormMessage("Discord server settings saved.");
      router.refresh();
    }
    setBusy(false);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!discordRoleId || !discordRoleName) {
      setFormError("Select a Discord role from the server.");
      return;
    }
    setBusy(true);
    setFormError(null);
    setFormMessage(null);
    const res = await saveDiscordRoleRule(
      productId,
      {
        badgeId,
        discordRoleId,
        discordRoleName,
        unlockLabel: unlockLabel || null,
        status: ruleStatus,
      },
      editingRuleId ?? undefined
    );
    if ("error" in res) setFormError(res.error);
    else {
      setFormMessage(editingRuleId ? "Role rule updated." : "Role rule saved.");
      resetRuleForm();
      router.refresh();
    }
    setBusy(false);
  }

  async function toggleRuleStatus(
    rule: RuleRow,
    status: "active" | "paused"
  ) {
    setBusy(true);
    setFormError(null);
    setFormMessage(null);
    const res = await setDiscordRoleRuleStatus(productId, rule.id, status);
    if ("error" in res) setFormError(res.error);
    else {
      setFormMessage(status === "active" ? "Rule activated." : "Rule paused.");
      router.refresh();
    }
    setBusy(false);
  }

  async function checkPermissions() {
    if (!discordRoleId.trim()) {
      setFormError("Select a role to check permissions.");
      return;
    }
    setBusy(true);
    setFormError(null);
    setFormMessage(null);
    const res = await runDiscordPermissionCheck(productId, discordRoleId);
    if ("error" in res) setFormError(res.error);
    else {
      setFormMessage(res.message);
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
          Invite the bot with Manage Roles permission. After you authorize it in
          Discord, you&apos;ll return here with server ID and name filled in
          automatically.
        </p>
        {botInviteConfigError && (
          <p className="mt-4 text-sm text-destructive">{botInviteConfigError}</p>
        )}
        {botInviteUrl && (
          <Button asChild variant="outline" className="mt-4">
            <a href={botInviteUrl}>
              <ExternalLink className="size-4" />
              Invite Arcademy bot
            </a>
          </Button>
        )}
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">2. Server configuration</h2>
        <form key={integrationFormKey} onSubmit={saveIntegration} className="mt-4 grid gap-4">
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
        <Alert variant="info" className="mt-4">
          <ShieldCheck />
          <AlertDescription>
            <p className="font-medium">Activation checklist</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>
                Server integration set to <strong>Active</strong>
                {integrationIsActive ? " ✓" : " — required for grants"}
              </li>
              <li>
                At least one rule set to <strong>Active</strong>
                {activeRuleCount > 0 ? ` ✓ (${activeRuleCount})` : " — required for grants"}
              </li>
              <li>Learners must connect Discord and join your server</li>
            </ul>
          </AlertDescription>
        </Alert>
        <form onSubmit={saveRule} className="mt-4 grid gap-4">
          {editingRuleId && (
            <p className="text-sm text-muted-foreground">
              Editing rule —{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={resetRuleForm}
              >
                cancel
              </button>
            </p>
          )}
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
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={usedBadgeIds.has(b.id)}
                  >
                    {b.name} — {b.courseTitle}
                    {usedBadgeIds.has(b.id) ? " (already mapped)" : ""}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="role-select">Discord role</Label>
              {integration?.botInstalled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={rolesLoading || busy}
                  onClick={() => void loadGuildRoles()}
                >
                  {rolesLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Refresh roles
                </Button>
              )}
            </div>
            {!integration?.guildId ? (
              <p className="text-sm text-muted-foreground">
                Save server settings first to load roles.
              </p>
            ) : rolesLoading ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : guildRoles.length === 0 ? (
              <p className="text-sm text-destructive">
                {rolesError ?? "No roles available."}
              </p>
            ) : (
              <Select
                id="role-select"
                value={discordRoleId}
                onChange={(e) => handleRoleSelect(e.target.value)}
              >
                <option value="">Select a role</option>
                {guildRoles.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                    disabled={usedRoleIds.has(role.id)}
                  >
                    {role.name}
                    {usedRoleIds.has(role.id) ? " (already mapped)" : ""}
                  </option>
                ))}
              </Select>
            )}
            {discordRoleId && (
              <p className="font-mono text-xs text-muted-foreground">
                Role ID: {discordRoleId}
              </p>
            )}
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
            <Button
              type="submit"
              disabled={busy || badges.length === 0 || !discordRoleId}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingRuleId ? (
                "Update rule"
              ) : (
                "Save rule"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !discordRoleId}
              onClick={checkPermissions}
            >
              Test bot permissions
            </Button>
          </div>
        </form>

        {rules.length > 0 && (
          <ul className="mt-6 divide-y rounded-lg border">
            {rules.map((rule) => {
              const badge = badges.find((b) => b.id === rule.badgeId);
              return (
                <li
                  key={rule.id}
                  className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {rule.unlockLabel || rule.discordRoleName}
                      <span className="ml-2 capitalize text-muted-foreground">
                        ({rule.status})
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {badge ? `${badge.name} → ` : ""}
                      {rule.discordRoleName} · ID {rule.discordRoleId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => startEditRule(rule)}
                    >
                      Edit
                    </Button>
                    {rule.status === "active" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void toggleRuleStatus(rule, "paused")}
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void toggleRuleStatus(rule, "active")}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
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
