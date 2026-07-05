import "server-only";
import {
  backfillDiscordRoleGrantsForUser,
  processPendingDiscordRoleGrants,
  retryDiscordRoleGrantForGuild,
} from "@/lib/discord-role-grants";
import { verifyBotManageRoles } from "@/lib/discord";
import {
  staffBotStatusEmbed,
  staffGrantsEmbed,
  staffLookupEmbed,
} from "@/lib/discord-bot/embeds";
import { requireStaffCommand } from "@/lib/discord-bot/permissions";
import {
  getBadgesForUser,
  getGrantsForGuild,
  getGrantsForUserInGuild,
  getGuildIntegration,
  resolveArcademyUserWithDiscord,
} from "@/lib/discord-bot/queries";
import type {
  DiscordInteraction,
  InteractionReplyPayload,
} from "@/lib/discord-bot/types";
import {
  getOptionString,
  getResolvedUsername,
  getSubcommand,
} from "@/lib/discord-bot/utils";
import { getLearnerCourseProgressList } from "@/lib/learner-progress";

const syncCooldown = new Map<string, number>();
const SYNC_COOLDOWN_MS = 60_000;

function checkCooldown(key: string): boolean {
  const last = syncCooldown.get(key) ?? 0;
  if (Date.now() - last < SYNC_COOLDOWN_MS) return false;
  syncCooldown.set(key, Date.now());
  return true;
}

async function handleLookup(
  interaction: DiscordInteraction,
  targetDiscordId: string,
  targetUsername: string
): Promise<InteractionReplyPayload> {
  const guildId = interaction.guild_id!;
  const account = await resolveArcademyUserWithDiscord(targetDiscordId);

  if (!account) {
    return {
      embeds: [staffLookupEmbed(targetUsername, false, 0, 0, 0, [])],
    };
  }

  const [badges, courses, grants] = await Promise.all([
    getBadgesForUser(account.userId),
    getLearnerCourseProgressList(account.userId),
    getGrantsForUserInGuild(account.userId, guildId),
  ]);

  const inProgress = courses.filter((c) => !c.completed && c.pct < 100).length;
  const completed = courses.filter((c) => c.completed).length;

  return {
    embeds: [
      staffLookupEmbed(
        targetUsername,
        true,
        badges.length,
        inProgress,
        completed,
        grants.map((grant) => ({
          status: grant.status,
          ruleName:
            grant.discordRoleRule.unlockLabel ??
            grant.discordRoleRule.discordRoleName,
        }))
      ),
    ],
  };
}

async function handleGrants(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const guildId = interaction.guild_id!;
  const integration = await getGuildIntegration(guildId);
  if (!integration) {
    return {
      content: "This server is not connected to an Arcademy project integration.",
    };
  }

  const grants = await getGrantsForGuild(guildId, 10);
  return {
    embeds: [staffGrantsEmbed(integration.guildName, grants)],
  };
}

async function handleRetry(
  interaction: DiscordInteraction,
  grantId: string
): Promise<InteractionReplyPayload> {
  const guildId = interaction.guild_id!;
  const ok = await retryDiscordRoleGrantForGuild(grantId.trim(), guildId);
  if (!ok) {
    return {
      content:
        "Could not retry that grant. Check the grant ID, server, and that the grant is in a retriable failed state.",
    };
  }

  void processPendingDiscordRoleGrants().catch(() => {});
  return { content: "Grant queued for retry. Processing will run shortly." };
}

async function handleBotStatus(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const guildId = interaction.guild_id!;
  const integration = await getGuildIntegration(guildId);
  if (!integration) {
    return {
      content: "This server is not connected to an Arcademy project integration.",
    };
  }

  const permissionOk = integration.botInstalled
    ? await verifyBotManageRoles(guildId)
    : null;

  return {
    embeds: [staffBotStatusEmbed(integration, permissionOk)],
  };
}

async function handleSyncUser(
  interaction: DiscordInteraction,
  targetDiscordId: string,
  targetUsername: string
): Promise<InteractionReplyPayload> {
  const cooldownKey = `sync:${interaction.guild_id}:${targetDiscordId}`;
  if (!checkCooldown(cooldownKey)) {
    return {
      content: "Please wait a minute before syncing this member again.",
    };
  }

  const account = await resolveArcademyUserWithDiscord(targetDiscordId);
  if (!account) {
    return {
      content: `${targetUsername} has not linked Discord on Arcademy yet.`,
    };
  }

  const queued = await backfillDiscordRoleGrantsForUser(account.userId);
  void processPendingDiscordRoleGrants().catch(() => {});

  return {
    content: `Synced ${targetUsername}. Queued or reopened ${queued} role grant(s).`,
  };
}

export async function handleStaff(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const auth = await requireStaffCommand(interaction);
  if (!auth.ok) {
    return { content: auth.message };
  }

  const sub = getSubcommand(interaction.data?.options);
  if (!sub) {
    return { content: "Unknown staff subcommand." };
  }

  switch (sub.name) {
    case "lookup": {
      const userId = getOptionString(sub.options, "user");
      if (!userId) return { content: "Please specify a member to look up." };
      return handleLookup(
        interaction,
        userId,
        getResolvedUsername(interaction, userId)
      );
    }
    case "grants":
      return handleGrants(interaction);
    case "retry": {
      const grantId = getOptionString(sub.options, "grant_id");
      if (!grantId) return { content: "Please provide a grant ID." };
      return handleRetry(interaction, grantId);
    }
    case "bot-status":
      return handleBotStatus(interaction);
    case "sync-user": {
      const userId = getOptionString(sub.options, "user");
      if (!userId) return { content: "Please specify a member to sync." };
      return handleSyncUser(
        interaction,
        userId,
        getResolvedUsername(interaction, userId)
      );
    }
    default:
      return { content: "Unknown staff subcommand." };
  }
}
