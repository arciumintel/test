import { notFound } from "next/navigation";
import { ProjectDiscordConsole } from "@/components/partner-console/project-discord-console";
import { getProjectAdminAccess } from "@/lib/project-admin";
import {
  getDiscordBotInviteUrlForProduct,
  isDiscordConfigured,
  listAssignableGuildRoles,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { shortWallet } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  return { title: product ? `Discord: ${product.name}` : "Discord setup" };
}

export default async function ProjectDiscordPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ discord?: string }>;
}) {
  const { productId } = await params;
  const { discord: discordStatus } = await searchParams;
  const access = await getProjectAdminAccess(productId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      projectDiscordIntegration: true,
      courses: {
        where: { status: "published", badge: { status: "published" } },
        select: {
          title: true,
          badge: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!product) notFound();

  const integration = product.projectDiscordIntegration;
  const rules = integration
    ? await prisma.discordRoleRule.findMany({
        where: { productDiscordIntegrationId: integration.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const recentGrants = integration
    ? await prisma.discordRoleGrant.findMany({
        where: {
          discordRoleRule: { productDiscordIntegrationId: integration.id },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: {
          discordRoleRule: {
            select: { discordRoleName: true, unlockLabel: true },
          },
          user: { select: { walletAddress: true } },
        },
      })
    : [];

  let botInviteUrl: string | null = null;
  let botInviteConfigError: string | null = null;
  if (isDiscordConfigured() && access.user) {
    try {
      botInviteUrl = await getDiscordBotInviteUrlForProduct(
        productId,
        access.user.id
      );
    } catch (err) {
      console.error("[partner-console/discord] bot invite URL failed:", err);
      botInviteConfigError =
        "Discord bot setup is temporarily unavailable on this site. Contact Arcademy staff for help.";
    }
  }

  let initialGuildRoles: { id: string; name: string; position: number }[] = [];
  let initialGuildRolesError: string | null = null;
  if (
    integration?.guildId &&
    integration.botInstalled &&
    isDiscordConfigured()
  ) {
    try {
      initialGuildRoles = await listAssignableGuildRoles(integration.guildId);
      if (initialGuildRoles.length === 0) {
        initialGuildRolesError =
          "No assignable roles found. Check bot permissions.";
      }
    } catch {
      initialGuildRolesError =
        "Could not load Discord roles. Check bot permissions and try again.";
    }
  }

  return (
    <ProjectDiscordConsole
      key={`${integration?.guildId ?? "none"}:${integration?.status ?? "draft"}:${initialGuildRoles.length}`}
      productId={product.id}
      botInviteUrl={botInviteUrl}
      botInviteConfigError={botInviteConfigError}
      discordStatus={discordStatus ?? null}
      integration={
        integration
          ? {
              guildId: integration.guildId,
              guildName: integration.guildName,
              status: integration.status,
              botInstalled: integration.botInstalled,
              lastPermissionCheckStatus: integration.lastPermissionCheckStatus,
              lastPermissionCheckAt:
                integration.lastPermissionCheckAt?.toISOString() ?? null,
            }
          : null
      }
      badges={product.courses
        .filter((c) => c.badge)
        .map((c) => ({
          id: c.badge!.id,
          name: c.badge!.name,
          courseTitle: c.title,
        }))}
      rules={rules.map((r) => ({
        id: r.id,
        badgeId: r.badgeId,
        discordRoleId: r.discordRoleId,
        discordRoleName: r.discordRoleName,
        unlockLabel: r.unlockLabel,
        status: r.status,
      }))}
      initialGuildRoles={initialGuildRoles}
      initialGuildRolesError={initialGuildRolesError}
      recentGrants={recentGrants.map((g) => ({
        id: g.id,
        status: g.status,
        lastErrorMessage: g.lastErrorMessage,
        attemptCount: g.attemptCount,
        updatedAt: g.updatedAt.toISOString(),
        userWallet: shortWallet(g.user.walletAddress, 4),
        ruleName:
          g.discordRoleRule.unlockLabel || g.discordRoleRule.discordRoleName,
      }))}
    />
  );
}
