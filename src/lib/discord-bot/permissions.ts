import "server-only";
import {
  getGuildIntegration,
  isProjectAdminForProduct,
  resolveArcademyUser,
} from "@/lib/discord-bot/queries";
import type { DiscordInteraction } from "@/lib/discord-bot/types";
import { getDiscordUserId } from "@/lib/discord-bot/utils";

const MANAGE_GUILD = BigInt(0x20);

function staffRoleIds(): Set<string> {
  return new Set(
    (process.env.DISCORD_STAFF_ROLE_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function hasManageGuild(interaction: DiscordInteraction): boolean {
  const permissions = interaction.member?.permissions;
  if (!permissions) return false;
  try {
    return (BigInt(permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

function hasStaffRole(interaction: DiscordInteraction): boolean {
  const allowed = staffRoleIds();
  if (allowed.size === 0) return false;
  const roles = interaction.member?.roles ?? [];
  return roles.some((roleId) => allowed.has(roleId));
}

export async function requireLinkedUser(discordUserId: string) {
  const user = await resolveArcademyUser(discordUserId);
  if (!user) {
    return {
      ok: false as const,
      message:
        "Your Discord is not linked to Arcademy yet. Connect Discord on your profile to use this command.",
    };
  }
  return { ok: true as const, user };
}

export async function canRunStaffCommands(
  interaction: DiscordInteraction
): Promise<boolean> {
  if (!interaction.guild_id) return false;

  if (hasManageGuild(interaction) || hasStaffRole(interaction)) {
    return true;
  }

  const discordUserId = getDiscordUserId(interaction);
  const user = await resolveArcademyUser(discordUserId);
  if (!user) return false;

  if (user.role === "staff_admin") return true;

  const integration = await getGuildIntegration(interaction.guild_id);
  if (!integration) return false;

  return isProjectAdminForProduct(user.id, integration.productId);
}

export async function requireStaffCommand(
  interaction: DiscordInteraction
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!interaction.guild_id) {
    return {
      ok: false,
      message: "Staff commands can only be used inside a Discord server.",
    };
  }

  const allowed = await canRunStaffCommands(interaction);
  if (!allowed) {
    return {
      ok: false,
      message: "You do not have permission to run staff commands in this server.",
    };
  }

  return { ok: true };
}
