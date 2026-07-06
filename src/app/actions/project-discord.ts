"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidSolanaAddress } from "@/lib/solana";
import {
  authorizeProjectAdmin,
  authorizeStaff,
  toActionError,
} from "@/lib/access-control";
import {
  checkBotCanGrantRole,
  getDiscordBotInviteUrlForProduct,
  getGuild,
  isDiscordConfigured,
  listAssignableGuildRoles,
  verifyBotManageRoles,
} from "@/lib/discord";
import { backfillDiscordRoleGrantsForProduct } from "@/lib/discord-role-grants";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import type {
  DiscordRoleRuleStatus,
  ProjectAdminRole,
  ProjectDiscordIntegrationStatus,
} from "@prisma/client";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const integrationSchema = z.object({
  guildId: z.string().regex(/^\d{17,20}$/, "Enter a valid Discord server ID"),
  guildName: z.string().min(2).max(120),
  status: z.enum(["draft", "active", "paused"]),
});

const roleRuleSchema = z.object({
  badgeId: z.string().min(1),
  discordRoleId: z.string().regex(/^\d{17,20}$/, "Enter a valid Discord role ID"),
  discordRoleName: z.string().min(1).max(120),
  unlockLabel: z.string().max(120).optional().nullable(),
  status: z.enum(["draft", "active", "paused"]),
});

export async function getDiscordBotInviteLink(
  productId: string
): Promise<Result<{ url: string }>> {
  if (!isDiscordConfigured()) {
    return { error: "Discord is not configured on this deployment." };
  }

  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const url = await getDiscordBotInviteUrlForProduct(productId, auth.user.id);
  return { ok: true, url };
}

export async function getProjectDiscordRoles(
  productId: string
): Promise<Result<{ roles: { id: string; name: string; position: number }[] }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  if (!isDiscordConfigured()) {
    return { error: "Discord is not configured on this deployment." };
  }

  const integration = await prisma.projectDiscordIntegration.findUnique({
    where: { productId },
  });
  if (!integration?.guildId) {
    return { error: "Save your Discord server settings first." };
  }
  if (!integration.botInstalled) {
    return {
      error:
        "Arcademy bot is not in this server yet. Invite the bot and save server settings.",
    };
  }

  try {
    const roles = await listAssignableGuildRoles(integration.guildId);
    return { ok: true, roles };
  } catch {
    return {
      error: "Could not load Discord roles. Check bot permissions and try again.",
    };
  }
}

export async function setDiscordRoleRuleStatus(
  productId: string,
  ruleId: string,
  status: "draft" | "active" | "paused"
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const integration = await prisma.projectDiscordIntegration.findUnique({
    where: { productId },
  });
  if (!integration) {
    return { error: "Configure the Discord server integration first." };
  }

  const updated = await prisma.discordRoleRule.update({
    where: { id: ruleId, productDiscordIntegrationId: integration.id },
    data: { status: status as DiscordRoleRuleStatus },
  });

  if (status === "active") {
    trackEventFireAndForget({
      eventName: "discord_role_rule_activated",
      source: "admin",
      ecosystemProjectId: productId,
      badgeId: updated.badgeId,
      metadata: { discordRoleRuleId: updated.id },
    });
    void backfillDiscordRoleGrantsForProduct(productId).catch(() => {});
  }

  revalidatePath(`/partner-console/${productId}/discord`);
  return { ok: true };
}

export async function saveProjectDiscordIntegration(
  productId: string,
  raw: z.input<typeof integrationSchema>
): Promise<Result> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);
  const user = auth.user;

  if (!isDiscordConfigured()) return { error: "Discord is not configured." };

  const parsed = integrationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const guild = await getGuild(parsed.data.guildId);
  const botInstalled = await verifyBotManageRoles(parsed.data.guildId);

  await prisma.projectDiscordIntegration.upsert({
    where: { productId },
    create: {
      productId,
      guildId: parsed.data.guildId,
      guildName: guild?.name ?? parsed.data.guildName,
      status: parsed.data.status as ProjectDiscordIntegrationStatus,
      botInstalled,
      createdByUserId: user.id,
    },
    update: {
      guildId: parsed.data.guildId,
      guildName: guild?.name ?? parsed.data.guildName,
      status: parsed.data.status as ProjectDiscordIntegrationStatus,
      botInstalled,
    },
  });

  if (parsed.data.status === "active") {
    void backfillDiscordRoleGrantsForProduct(productId).catch(() => {});
  }

  revalidatePath(`/partner-console/${productId}/discord`);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function saveDiscordRoleRule(
  productId: string,
  raw: z.input<typeof roleRuleSchema>,
  ruleId?: string
): Promise<Result<{ id: string }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const parsed = roleRuleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const integration = await prisma.projectDiscordIntegration.findUnique({
    where: { productId },
  });
  if (!integration) {
    return { error: "Configure the Discord server integration first." };
  }

  const badge = await prisma.badge.findFirst({
    where: {
      id: parsed.data.badgeId,
      status: "published",
      course: { productId },
    },
  });
  if (!badge) return { error: "Select a published badge for this project." };

  if (ruleId) {
    const updated = await prisma.discordRoleRule.update({
      where: { id: ruleId, productDiscordIntegrationId: integration.id },
      data: {
        badgeId: parsed.data.badgeId,
        discordRoleId: parsed.data.discordRoleId,
        discordRoleName: parsed.data.discordRoleName,
        unlockLabel: parsed.data.unlockLabel?.trim() || null,
        status: parsed.data.status as DiscordRoleRuleStatus,
      },
    });
    if (parsed.data.status === "active") {
      trackEventFireAndForget({
        eventName: "discord_role_rule_activated",
        source: "admin",
        ecosystemProjectId: productId,
        badgeId: parsed.data.badgeId,
        metadata: { discordRoleRuleId: updated.id },
      });
      void backfillDiscordRoleGrantsForProduct(productId).catch(() => {});
    }
    revalidatePath(`/partner-console/${productId}/discord`);
    return { ok: true, id: updated.id };
  }

  const created = await prisma.discordRoleRule.create({
    data: {
      productDiscordIntegrationId: integration.id,
      badgeId: parsed.data.badgeId,
      discordRoleId: parsed.data.discordRoleId,
      discordRoleName: parsed.data.discordRoleName,
      unlockLabel: parsed.data.unlockLabel?.trim() || null,
      status: parsed.data.status as DiscordRoleRuleStatus,
    },
  });

  trackEventFireAndForget({
    eventName: "discord_role_rule_created",
    source: "admin",
    ecosystemProjectId: productId,
    badgeId: parsed.data.badgeId,
    metadata: { discordRoleRuleId: created.id },
  });
  if (parsed.data.status === "active") {
    trackEventFireAndForget({
      eventName: "discord_role_rule_activated",
      source: "admin",
      ecosystemProjectId: productId,
      badgeId: parsed.data.badgeId,
      metadata: { discordRoleRuleId: created.id },
    });
    void backfillDiscordRoleGrantsForProduct(productId).catch(() => {});
  }

  revalidatePath(`/partner-console/${productId}/discord`);
  return { ok: true, id: created.id };
}

export async function runDiscordPermissionCheck(
  productId: string,
  roleId: string
): Promise<Result<{ message: string; passed: boolean }>> {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) return toActionError(auth);

  const integration = await prisma.projectDiscordIntegration.findUnique({
    where: { productId },
  });
  if (!integration) return { error: "Discord integration not configured." };

  const check = await checkBotCanGrantRole(integration.guildId, roleId);
  await prisma.projectDiscordIntegration.update({
    where: { id: integration.id },
    data: {
      lastPermissionCheckStatus: check.message,
      lastPermissionCheckAt: new Date(),
      botInstalled: check.botInGuild,
    },
  });

  revalidatePath(`/partner-console/${productId}/discord`);
  return { ok: true, message: check.message, passed: check.ok };
}

const assignAdminSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  role: z.enum(["owner", "manager"]),
});

export async function assignProjectAdmin(
  productId: string,
  raw: z.input<typeof assignAdminSchema>
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const staff = auth.user;

  const parsed = assignAdminSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!isValidSolanaAddress(parsed.data.walletAddress)) {
    return { error: "Enter a valid Solana wallet address." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { walletAddress: parsed.data.walletAddress },
  });
  if (!targetUser) {
    return {
      error:
        "No Arcademy user found for this wallet. They must connect their wallet once before assignment.",
    };
  }

  await prisma.projectAdmin.upsert({
    where: {
      productId_userId: { productId, userId: targetUser.id },
    },
    create: {
      productId,
      userId: targetUser.id,
      role: parsed.data.role as ProjectAdminRole,
      invitedByUserId: staff.id,
    },
    update: {
      role: parsed.data.role as ProjectAdminRole,
      invitedByUserId: staff.id,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/partner-console");
  return { ok: true };
}

export async function removeProjectAdmin(
  productId: string,
  adminId: string
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  await prisma.projectAdmin.deleteMany({
    where: { id: adminId, productId },
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/partner-console");
  return { ok: true };
}
