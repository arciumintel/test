import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGuild, isDiscordConfigured, resolveGuildFromBotInstallCallback, verifyBotManageRoles } from "@/lib/discord";
import { verifyDiscordBotInstallState } from "@/lib/discord-oauth-state";
import { isProjectAdmin } from "@/lib/project-admin";
import { getCurrentUser } from "@/lib/session";
import { trackEventFireAndForget } from "@/lib/analytics-events";

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function GET(request: Request) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guild_id");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const parsedState = state ? await verifyDiscordBotInstallState(state) : null;
  const fallbackConsole = new URL("/project-console", appUrl);

  if (!parsedState) {
    fallbackConsole.searchParams.set("discord", "invalid_state");
    return NextResponse.redirect(fallbackConsole);
  }

  const consoleUrl = new URL(
    `/project-console/${parsedState.productId}/discord`,
    appUrl
  );

  if (oauthError) {
    consoleUrl.searchParams.set("discord", "bot_install_denied");
    return NextResponse.redirect(consoleUrl);
  }

  if (!guildId && !code) {
    consoleUrl.searchParams.set("discord", "missing_guild");
    return NextResponse.redirect(consoleUrl);
  }

  if (!isDiscordConfigured()) {
    consoleUrl.searchParams.set("discord", "not_configured");
    return NextResponse.redirect(consoleUrl);
  }

  const user = await getCurrentUser();
  if (!user || user.id !== parsedState.userId) {
    return NextResponse.redirect(
      new URL("/courses?discord=sign_in_required", appUrl)
    );
  }

  const canManage =
    user.role === "staff_admin" ||
    (await isProjectAdmin(user.id, parsedState.productId));
  if (!canManage) {
    consoleUrl.searchParams.set("discord", "forbidden");
    return NextResponse.redirect(consoleUrl);
  }

  try {
    const guild = await resolveGuildFromBotInstallCallback(guildId, code);
    if (!guild) {
      consoleUrl.searchParams.set("discord", "guild_not_found");
      return NextResponse.redirect(consoleUrl);
    }

    const botInstalled = await verifyBotManageRoles(guild.id);

    await prisma.projectDiscordIntegration.upsert({
      where: { productId: parsedState.productId },
      create: {
        productId: parsedState.productId,
        guildId: guild.id,
        guildName: guild.name,
        status: "draft",
        botInstalled,
        createdByUserId: user.id,
      },
      update: {
        guildId: guild.id,
        guildName: guild.name,
        botInstalled,
      },
    });

    trackEventFireAndForget({
      eventName: "discord_bot_installed",
      source: "route_handler",
      path: "/api/discord/bot-install/callback",
      userId: user.id,
      ecosystemProjectId: parsedState.productId,
      metadata: { guildId: guild.id, guildName: guild.name },
    });

    consoleUrl.searchParams.set("discord", "bot_installed");
    return NextResponse.redirect(consoleUrl);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[discord:bot-install]", error);
    }
    consoleUrl.searchParams.set("discord", "bot_install_failed");
    return NextResponse.redirect(consoleUrl);
  }
}
