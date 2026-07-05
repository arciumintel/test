import "server-only";
import type { DiscordRoleGrantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function resolveArcademyUser(discordUserId: string) {
  const account = await prisma.discordAccount.findUnique({
    where: { discordUserId },
    include: { user: true },
  });
  return account?.user ?? null;
}

export async function resolveArcademyUserWithDiscord(discordUserId: string) {
  return prisma.discordAccount.findUnique({
    where: { discordUserId },
    include: { user: true },
  });
}

export async function getBadgesForUser(userId: string) {
  return prisma.badgeAward.findMany({
    where: { userId },
    orderBy: { awardedAt: "desc" },
    select: {
      verificationSlug: true,
      awardedAt: true,
      badge: { select: { name: true } },
      course: {
        select: {
          title: true,
          product: { select: { name: true } },
        },
      },
    },
  });
}

export async function getQuizAttemptsForUser(userId: string, limit = 5) {
  return prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    take: limit,
    include: {
      quiz: {
        select: {
          course: {
            select: {
              title: true,
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getGuildIntegration(guildId: string) {
  return prisma.projectDiscordIntegration.findFirst({
    where: { guildId },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      roleRules: {
        where: { status: "active" },
        select: { id: true },
      },
    },
  });
}

export async function getGrantsForGuild(
  guildId: string,
  limit = 10,
  statuses?: DiscordRoleGrantStatus[]
) {
  return prisma.discordRoleGrant.findMany({
    where: {
      guildId,
      ...(statuses?.length ? { status: { in: statuses } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      discordRoleRule: { select: { unlockLabel: true, discordRoleName: true } },
      discordAccount: { select: { username: true } },
    },
  });
}

export async function getGrantsForUserInGuild(userId: string, guildId: string) {
  return prisma.discordRoleGrant.findMany({
    where: { userId, guildId },
    orderBy: { updatedAt: "desc" },
    include: {
      discordRoleRule: { select: { unlockLabel: true, discordRoleName: true } },
    },
  });
}

export async function isProjectAdminForProduct(userId: string, productId: string) {
  const admin = await prisma.projectAdmin.findFirst({
    where: { userId, productId },
  });
  return !!admin;
}
