import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProjectDiscordConsole } from "@/components/project-console/project-discord-console";
import { getProjectAdminAccess } from "@/lib/project-admin";
import { getDiscordBotInviteUrl, isDiscordConfigured } from "@/lib/discord";
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
  return { title: product ? `Discord — ${product.name}` : "Discord setup" };
}

export default async function ProjectDiscordPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const access = await getProjectAdminAccess(productId);
  if (!access.user) redirect("/courses");
  if (!access.canManage) redirect("/project-console");

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
          discordRoleRule: { select: { discordRoleName: true, unlockLabel: true } },
          user: { select: { walletAddress: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/project-console"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Project console
      </Link>

      <ProjectDiscordConsole
        productId={product.id}
        productName={product.name}
        botInviteUrl={isDiscordConfigured() ? getDiscordBotInviteUrl() : null}
        integration={
          integration
            ? {
                guildId: integration.guildId,
                guildName: integration.guildName,
                status: integration.status,
                botInstalled: integration.botInstalled,
                lastPermissionCheckStatus: integration.lastPermissionCheckStatus,
                lastPermissionCheckAt: integration.lastPermissionCheckAt?.toISOString() ?? null,
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
        recentGrants={recentGrants.map((g) => ({
          id: g.id,
          status: g.status,
          lastErrorMessage: g.lastErrorMessage,
          attemptCount: g.attemptCount,
          updatedAt: g.updatedAt.toISOString(),
          userWallet: shortWallet(g.user.walletAddress, 4),
          ruleName: g.discordRoleRule.unlockLabel || g.discordRoleRule.discordRoleName,
        }))}
      />
    </div>
  );
}
