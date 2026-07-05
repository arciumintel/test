import "server-only";
import type { DiscordRoleGrantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { addGuildMemberRole, type DiscordGrantError } from "@/lib/discord";

export const GRANT_BATCH_SIZE = 25;

const RETRYABLE_STATUSES: DiscordRoleGrantStatus[] = [
  "pending",
  "failed_rate_limited",
  "failed_unknown",
];

type QueueContext = {
  badgeAwardId: string;
  userId: string;
  badgeId: string;
  courseId: string;
  productId: string;
  productSlug: string;
};

async function loadQueueContext(badgeAwardId: string): Promise<QueueContext | null> {
  const award = await prisma.badgeAward.findUnique({
    where: { id: badgeAwardId },
    include: {
      course: {
        select: {
          id: true,
          product: { select: { id: true, slug: true } },
        },
      },
    },
  });
  if (!award) return null;
  return {
    badgeAwardId: award.id,
    userId: award.userId,
    badgeId: award.badgeId,
    courseId: award.courseId,
    productId: award.course.product.id,
    productSlug: award.course.product.slug,
  };
}

async function findActiveRulesForBadge(badgeId: string, productId: string) {
  const integration = await prisma.projectDiscordIntegration.findFirst({
    where: { productId, status: "active" },
    include: {
      roleRules: {
        where: { badgeId, status: "active" },
      },
    },
  });
  if (!integration) return [];
  return integration.roleRules.map((rule) => ({
    rule,
    guildId: integration.guildId,
  }));
}

/** Whether an active integration has an active rule for this badge. */
export async function hasActiveDiscordRoleUnlockForBadge(
  badgeId: string,
  productId: string
): Promise<boolean> {
  const rules = await findActiveRulesForBadge(badgeId, productId);
  return rules.length > 0;
}

function triggerGrantProcessor(): void {
  void processPendingDiscordRoleGrants().catch(() => {});
}

/**
 * Queues Discord role grants for a badge award. Idempotent per badge award + rule.
 */
export async function queueDiscordRoleGrantsForBadgeAward(
  badgeAwardId: string
): Promise<number> {
  const ctx = await loadQueueContext(badgeAwardId);
  if (!ctx) return 0;

  const rules = await findActiveRulesForBadge(ctx.badgeId, ctx.productId);
  if (rules.length === 0) return 0;

  const discordAccount = await prisma.discordAccount.findUnique({
    where: { userId: ctx.userId },
  });

  let queued = 0;
  for (const { rule, guildId } of rules) {
    const status: DiscordRoleGrantStatus = discordAccount
      ? "pending"
      : "skipped_discord_not_linked";

    const result = await prisma.discordRoleGrant.createMany({
      data: [
        {
          userId: ctx.userId,
          discordAccountId: discordAccount?.id ?? null,
          badgeAwardId: ctx.badgeAwardId,
          discordRoleRuleId: rule.id,
          guildId,
          roleId: rule.discordRoleId,
          status,
        },
      ],
      skipDuplicates: true,
    });

    if (result.count > 0) {
      queued += 1;
      trackEventFireAndForget({
        eventName: "discord_role_grant_queued",
        source: "server_action",
        userId: ctx.userId,
        badgeId: ctx.badgeId,
        badgeAwardId: ctx.badgeAwardId,
        courseId: ctx.courseId,
        ecosystemProjectId: ctx.productId,
        ecosystemProjectSlug: ctx.productSlug,
        metadata: {
          discordRoleRuleId: rule.id,
          guildId,
          roleId: rule.discordRoleId,
          status,
        },
      });
    }
  }

  if (queued > 0) {
    triggerGrantProcessor();
  }

  return queued;
}

/**
 * Queues missing grants for all badge awards that match active rules on an active integration.
 * Use after activating an integration or rule so learners who earned badges earlier still sync.
 */
export async function backfillDiscordRoleGrantsForProduct(
  productId: string
): Promise<number> {
  const integration = await prisma.projectDiscordIntegration.findFirst({
    where: { productId, status: "active" },
    include: {
      roleRules: { where: { status: "active" }, select: { badgeId: true } },
    },
  });
  if (!integration || integration.roleRules.length === 0) return 0;

  const activeBadgeIds = [
    ...new Set(integration.roleRules.map((rule) => rule.badgeId)),
  ];
  const awards = await prisma.badgeAward.findMany({
    where: {
      badgeId: { in: activeBadgeIds },
      course: { productId },
    },
    select: { id: true },
  });

  let queued = 0;
  for (const award of awards) {
    queued += await queueDiscordRoleGrantsForBadgeAward(award.id);
  }
  return queued;
}

/**
 * Reopens skipped grants and queues missing grants after Discord is linked.
 */
export async function backfillDiscordRoleGrantsForUser(userId: string): Promise<number> {
  const discordAccount = await prisma.discordAccount.findUnique({
    where: { userId },
  });
  if (!discordAccount) return 0;

  const reopened = await prisma.discordRoleGrant.updateMany({
    where: {
      userId,
      status: "skipped_discord_not_linked",
    },
    data: {
      status: "pending",
      discordAccountId: discordAccount.id,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  const awards = await prisma.badgeAward.findMany({
    where: { userId },
    select: { id: true },
  });

  let newlyQueued = 0;
  for (const award of awards) {
    newlyQueued += await queueDiscordRoleGrantsForBadgeAward(award.id);
  }

  if (reopened.count > 0 || newlyQueued > 0) {
    triggerGrantProcessor();
  }

  return reopened.count + newlyQueued;
}

async function applyGrantFailure(
  grantId: string,
  error: DiscordGrantError,
  ctx: {
    userId: string;
    badgeAwardId: string;
    discordRoleRuleId: string;
    guildId: string;
    roleId: string;
  }
): Promise<void> {
  await prisma.discordRoleGrant.update({
    where: { id: grantId },
    data: {
      status: error.status,
      lastErrorCode: error.code,
      lastErrorMessage: error.message,
    },
  });

  trackEventFireAndForget({
    eventName: "discord_role_grant_failed",
    source: "route_handler",
    userId: ctx.userId,
    badgeAwardId: ctx.badgeAwardId,
    metadata: {
      discordRoleRuleId: ctx.discordRoleRuleId,
      guildId: ctx.guildId,
      roleId: ctx.roleId,
      errorCode: error.code,
      errorMessage: error.message,
      retryable: error.retryable,
    },
  });
}

async function applyGrantSuccess(
  grantId: string,
  ctx: {
    userId: string;
    badgeAwardId: string;
    discordRoleRuleId: string;
    guildId: string;
    roleId: string;
    badgeId?: string;
    productId?: string;
    productSlug?: string;
  }
): Promise<void> {
  await prisma.discordRoleGrant.update({
    where: { id: grantId },
    data: {
      status: "granted",
      grantedAt: new Date(),
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  trackEventFireAndForget({
    eventName: "discord_role_granted",
    source: "route_handler",
    userId: ctx.userId,
    badgeAwardId: ctx.badgeAwardId,
    badgeId: ctx.badgeId,
    ecosystemProjectId: ctx.productId,
    ecosystemProjectSlug: ctx.productSlug,
    metadata: {
      discordRoleRuleId: ctx.discordRoleRuleId,
      guildId: ctx.guildId,
      roleId: ctx.roleId,
    },
  });
}

async function processOneGrant(grant: {
  id: string;
  userId: string;
  badgeAwardId: string;
  discordRoleRuleId: string;
  guildId: string;
  roleId: string;
  discordAccount: { discordUserId: string } | null;
  badgeAward: {
    badgeId: string;
    course: { product: { id: string; slug: string } };
  };
}): Promise<void> {
  const meta = {
    userId: grant.userId,
    badgeAwardId: grant.badgeAwardId,
    discordRoleRuleId: grant.discordRoleRuleId,
    guildId: grant.guildId,
    roleId: grant.roleId,
    badgeId: grant.badgeAward.badgeId,
    productId: grant.badgeAward.course.product.id,
    productSlug: grant.badgeAward.course.product.slug,
  };

  await prisma.discordRoleGrant.update({
    where: { id: grant.id },
    data: {
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  if (!grant.discordAccount) {
    await applyGrantFailure(grant.id, {
      status: "skipped_discord_not_linked",
      code: "discord_not_linked",
      message: "Connect Discord on Arcademy to receive this role.",
      retryable: false,
    }, meta);
    return;
  }

  const result = await addGuildMemberRole(
    grant.guildId,
    grant.discordAccount.discordUserId,
    grant.roleId
  );

  if ("ok" in result && result.ok) {
    await applyGrantSuccess(grant.id, meta);
    return;
  }

  await applyGrantFailure(grant.id, result as DiscordGrantError, meta);
}

/**
 * Processes a bounded batch of pending/retryable Discord role grants.
 */
export async function processPendingDiscordRoleGrants(
  limit = GRANT_BATCH_SIZE
): Promise<{ processed: number; granted: number; failed: number }> {
  const grants = await prisma.discordRoleGrant.findMany({
    where: { status: { in: RETRYABLE_STATUSES } },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      discordAccount: { select: { discordUserId: true } },
      badgeAward: {
        select: {
          badgeId: true,
          course: { select: { product: { select: { id: true, slug: true } } } },
        },
      },
    },
  });

  let granted = 0;
  let failed = 0;

  for (const grant of grants) {
    const before = grant.status;
    await processOneGrant(grant);
    const after = await prisma.discordRoleGrant.findUnique({
      where: { id: grant.id },
      select: { status: true },
    });
    if (after?.status === "granted") granted += 1;
    else if (after?.status !== before || after?.status !== "pending") failed += 1;
  }

  return { processed: grants.length, granted, failed };
}

const RETRIABLE_GRANT_STATUSES: DiscordRoleGrantStatus[] = [
  "failed_user_not_in_server",
  "failed_missing_bot_permission",
  "failed_role_hierarchy",
  "failed_rate_limited",
  "failed_unknown",
];

export async function retryDiscordRoleGrant(grantId: string, userId: string): Promise<boolean> {
  const grant = await prisma.discordRoleGrant.findFirst({
    where: { id: grantId, userId },
  });
  if (!grant) return false;

  if (!RETRIABLE_GRANT_STATUSES.includes(grant.status)) return false;

  await prisma.discordRoleGrant.update({
    where: { id: grantId },
    data: {
      status: "pending",
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  trackEventFireAndForget({
    eventName: "discord_role_grant_retried",
    source: "server_action",
    userId,
    badgeAwardId: grant.badgeAwardId,
    metadata: {
      discordRoleRuleId: grant.discordRoleRuleId,
      guildId: grant.guildId,
      roleId: grant.roleId,
    },
  });

  triggerGrantProcessor();

  return true;
}

/** Staff-only retry scoped to a guild (Discord slash command). */
export async function retryDiscordRoleGrantForGuild(
  grantId: string,
  guildId: string
): Promise<boolean> {
  const grant = await prisma.discordRoleGrant.findFirst({
    where: { id: grantId, guildId },
  });
  if (!grant) return false;
  if (!RETRIABLE_GRANT_STATUSES.includes(grant.status)) return false;

  await prisma.discordRoleGrant.update({
    where: { id: grantId },
    data: {
      status: "pending",
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  trackEventFireAndForget({
    eventName: "discord_role_grant_retried",
    source: "route_handler",
    userId: grant.userId,
    badgeAwardId: grant.badgeAwardId,
    metadata: {
      discordRoleRuleId: grant.discordRoleRuleId,
      guildId: grant.guildId,
      roleId: grant.roleId,
    },
  });

  triggerGrantProcessor();
  return true;
}
