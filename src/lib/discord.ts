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

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
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

async function discordFetch(
  path: string,
  init: RequestInit & { token: string }
): Promise<Response> {
  const { token, ...rest } = init;
  return fetch(`${DISCORD_API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
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
  const { botToken } = getDiscordConfig();
  const res = await discordFetch("/users/@me", { token: botToken });
  if (!res.ok) throw new Error("Could not fetch bot user");
  const data = (await res.json()) as { id: string };
  cachedBotUserId = data.id;
  return data.id;
}

export async function getGuild(guildId: string): Promise<{ id: string; name: string } | null> {
  const { botToken } = getDiscordConfig();
  const res = await discordFetch(`/guilds/${guildId}`, { token: botToken });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord guild lookup failed (${res.status})`);
  return (await res.json()) as { id: string; name: string };
}

export async function getGuildRoles(guildId: string): Promise<DiscordGuildRole[]> {
  const { botToken } = getDiscordConfig();
  const res = await discordFetch(`/guilds/${guildId}/roles`, { token: botToken });
  if (!res.ok) throw new Error(`Discord roles lookup failed (${res.status})`);
  return (await res.json()) as DiscordGuildRole[];
}

export async function getGuildMember(
  guildId: string,
  userId: string
): Promise<DiscordGuildMember | null> {
  const { botToken } = getDiscordConfig();
  const res = await discordFetch(`/guilds/${guildId}/members/${userId}`, {
    token: botToken,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord member lookup failed (${res.status})`);
  return (await res.json()) as DiscordGuildMember;
}

export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<{ ok: true } | DiscordGrantError> {
  const { botToken } = getDiscordConfig();
  const res = await discordFetch(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: "PUT", token: botToken }
  );

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
  const botUserId = await getBotUserId();
  const botMember = await getGuildMember(guildId, botUserId);
  return Boolean(botMember);
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
