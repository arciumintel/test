import "server-only";
import type { DiscordRoleGrantStatus } from "@prisma/client";

const DISCORD_API = "https://discord.com/api/v10";

export type DiscordUserProfile = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export type DiscordGuildRole = {
  id: string;
  name: string;
  position: number;
  managed: boolean;
  permissions: string;
};

export type DiscordGuildMember = {
  user?: { id: string };
  roles: string[];
};

export type DiscordPermissionCheck = {
  ok: boolean;
  botInGuild: boolean;
  hasManageRoles: boolean;
  roleHierarchyOk: boolean;
  message: string;
};

export type DiscordGrantError = {
  status: DiscordRoleGrantStatus;
  code: string;
  message: string;
  retryable: boolean;
};

import { createDiscordBotInstallState } from "@/lib/discord-oauth-state";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

function getBotInstallRedirectUri(): string {
  const configured = process.env.DISCORD_BOT_INSTALL_REDIRECT_URI?.trim();
  if (configured) return configured;
  return `${getAppBaseUrl()}/api/discord/bot-install/callback`;
}

/** Resolve guild from Discord bot-install redirect (guild_id param and/or OAuth code). */
export async function resolveGuildFromBotInstallCallback(
  guildId: string | null,
  code: string | null
): Promise<{ id: string; name: string } | null> {
  if (guildId) {
    const guild = await getGuild(guildId);
    return guild;
  }

  if (!code) return null;

  const { clientId, clientSecret } = getDiscordConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getBotInstallRedirectUri(),
  });

  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) return null;

  const tokenJson = (await tokenRes.json()) as {
    guild?: { id: string; name: string };
  };
  if (tokenJson.guild?.id && tokenJson.guild?.name) {
    return { id: tokenJson.guild.id, name: tokenJson.guild.name };
  }

  return null;
}

export function getDiscordConfig() {
  return {
    clientId: requireEnv("DISCORD_CLIENT_ID"),
    clientSecret: requireEnv("DISCORD_CLIENT_SECRET"),
    botToken: requireEnv("DISCORD_BOT_TOKEN"),
    redirectUri: requireEnv("DISCORD_REDIRECT_URI"),
  };
}

export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_CLIENT_ID?.trim() &&
      process.env.DISCORD_CLIENT_SECRET?.trim() &&
      process.env.DISCORD_BOT_TOKEN?.trim() &&
      process.env.DISCORD_REDIRECT_URI?.trim()
  );
}

export function getDiscordOAuthUrl(state: string): string {
  const { clientId, redirectUri } = getDiscordConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

export function getDiscordBotInviteUrl(): string {
  const { clientId } = getDiscordConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: "268435456", // MANAGE_ROLES
    scope: "bot",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

/** Bot invite that redirects back to Arcademy with guild_id after install. */
export async function getDiscordBotInviteUrlForProduct(
  productId: string,
  userId: string
): Promise<string> {
  const { clientId } = getDiscordConfig();
  const state = await createDiscordBotInstallState(productId, userId);
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: "268435456", // MANAGE_ROLES
    scope: "bot",
    redirect_uri: getBotInstallRedirectUri(),
    response_type: "code",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

type DiscordAuthScheme = "Bearer" | "Bot";

async function discordFetch(
  path: string,
  init: RequestInit & { token: string; authScheme?: DiscordAuthScheme }
): Promise<Response> {
  const { token, authScheme = "Bearer", ...rest } = init;
  return fetch(`${DISCORD_API}${path}`, {
    ...rest,
    headers: {
      Authorization: `${authScheme} ${token}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
}

function botFetch(path: string, init: Omit<RequestInit, "headers"> = {}): Promise<Response> {
  const { botToken } = getDiscordConfig();
  return discordFetch(path, { ...init, token: botToken, authScheme: "Bot" });
}

export async function exchangeDiscordCode(code: string): Promise<DiscordUserProfile> {
  const { clientId, clientSecret, redirectUri, botToken } = getDiscordConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    throw new Error("Discord token exchange failed");
  }

  const tokenJson = (await tokenRes.json()) as { access_token: string };
  const profileRes = await discordFetch("/users/@me", {
    token: tokenJson.access_token,
  });

  if (!profileRes.ok) {
    throw new Error("Discord profile fetch failed");
  }

  const profile = (await profileRes.json()) as DiscordUserProfile;
  void botToken;
  return profile;
}

let cachedBotUserId: string | null = null;

export async function getBotUserId(): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId;
  const res = await botFetch("/users/@me");
  if (!res.ok) throw new Error("Could not fetch bot user");
  const data = (await res.json()) as { id: string };
  cachedBotUserId = data.id;
  return data.id;
}

export async function getGuild(guildId: string): Promise<{ id: string; name: string } | null> {
  const res = await botFetch(`/guilds/${guildId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord guild lookup failed (${res.status})`);
  return (await res.json()) as { id: string; name: string };
}

export async function getGuildRoles(guildId: string): Promise<DiscordGuildRole[]> {
  const res = await botFetch(`/guilds/${guildId}/roles`);
  if (!res.ok) throw new Error(`Discord roles lookup failed (${res.status})`);
  return (await res.json()) as DiscordGuildRole[];
}

export type AssignableGuildRole = {
  id: string;
  name: string;
  position: number;
};

/** Roles the bot can assign (excludes @everyone and managed/integration roles). */
export async function listAssignableGuildRoles(
  guildId: string
): Promise<AssignableGuildRole[]> {
  const roles = await getGuildRoles(guildId);
  return roles
    .filter((role) => role.id !== guildId && !role.managed)
    .sort((a, b) => b.position - a.position)
    .map((role) => ({
      id: role.id,
      name: role.name,
      position: role.position,
    }));
}

export async function getGuildMember(
  guildId: string,
  userId: string
): Promise<DiscordGuildMember | null> {
  const res = await botFetch(`/guilds/${guildId}/members/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord member lookup failed (${res.status})`);
  return (await res.json()) as DiscordGuildMember;
}

export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<{ ok: true } | DiscordGrantError> {
  const res = await botFetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
  });

  if (res.ok || res.status === 204) return { ok: true };
  return mapDiscordError(res);
}

const MANAGE_ROLES_BIT = BigInt(1) << BigInt(28);

export async function checkBotCanGrantRole(
  guildId: string,
  roleId: string
): Promise<DiscordPermissionCheck> {
  const botUserId = await getBotUserId();
  const [botMember, roles] = await Promise.all([
    getGuildMember(guildId, botUserId),
    getGuildRoles(guildId),
  ]);

  if (!botMember) {
    return {
      ok: false,
      botInGuild: false,
      hasManageRoles: false,
      roleHierarchyOk: false,
      message: "Arcademy bot is not in this Discord server. Use the invite link and try again.",
    };
  }

  const targetRole = roles.find((r) => r.id === roleId);
  if (!targetRole) {
    return {
      ok: false,
      botInGuild: true,
      hasManageRoles: false,
      roleHierarchyOk: false,
      message: "Target role was not found in this server.",
    };
  }

  const botRoles = roles.filter((r) => botMember.roles.includes(r.id));
  const botTopPosition = botRoles.reduce((max, r) => Math.max(max, r.position), 0);
  const hierarchyOk = botTopPosition > targetRole.position;

  const combinedPermissions = botRoles.reduce(
    (acc, r) => acc | BigInt(r.permissions || "0"),
    BigInt(0)
  );
  const hasManageRoles = (combinedPermissions & MANAGE_ROLES_BIT) === MANAGE_ROLES_BIT;

  if (!hasManageRoles) {
    return {
      ok: false,
      botInGuild: true,
      hasManageRoles: false,
      roleHierarchyOk: hierarchyOk,
      message: "Bot is missing the Manage Roles permission.",
    };
  }

  if (!hierarchyOk) {
    return {
      ok: false,
      botInGuild: true,
      hasManageRoles: true,
      roleHierarchyOk: false,
      message:
        "Bot role must be ranked above the target role in Discord server settings.",
    };
  }

  return {
    ok: true,
    botInGuild: true,
    hasManageRoles: true,
    roleHierarchyOk: true,
    message: "Bot can grant this role.",
  };
}

export async function verifyBotManageRoles(guildId: string): Promise<boolean> {
  try {
    const botUserId = await getBotUserId();
    const botMember = await getGuildMember(guildId, botUserId);
    return Boolean(botMember);
  } catch {
    return false;
  }
}

async function mapDiscordError(res: Response): Promise<DiscordGrantError> {
  let body: { message?: string; code?: number; retry_after?: number } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // ignore parse errors
  }

  const message = body.message ?? `Discord API error (${res.status})`;

  if (res.status === 429) {
    return {
      status: "failed_rate_limited",
      code: "rate_limited",
      message: body.retry_after
        ? `Rate limited. Retry after ${body.retry_after}s.`
        : "Discord rate limit reached.",
      retryable: true,
    };
  }

  if (res.status === 404) {
    return {
      status: "failed_user_not_in_server",
      code: "user_not_in_server",
      message: "Join the Discord server first, then retry the grant.",
      retryable: false,
    };
  }

  if (res.status === 403) {
    if (message.toLowerCase().includes("hierarchy")) {
      return {
        status: "failed_role_hierarchy",
        code: "role_hierarchy",
        message:
          "Bot role must be ranked above the target role in Discord server settings.",
        retryable: false,
      };
    }
    return {
      status: "failed_missing_bot_permission",
      code: "missing_permission",
      message: "Bot is missing permission to assign this role.",
      retryable: false,
    };
  }

  return {
    status: "failed_unknown",
    code: String(body.code ?? res.status),
    message,
    retryable: true,
  };
}

export function discordDisplayName(profile: {
  username: string;
  globalName?: string | null;
}): string {
  return profile.globalName?.trim() || profile.username;
}

export function discordAvatarUrl(
  discordUserId: string,
  avatar: string | null | undefined
): string | null {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png`;
}
