import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  exchangeDiscordCode,
  isDiscordConfigured,
} from "@/lib/discord";
import { verifyDiscordOAuthState } from "@/lib/discord-oauth-state";
import { backfillDiscordRoleGrantsForUser } from "@/lib/discord-role-grants";
import { trackEventFireAndForget } from "@/lib/analytics-events";

export async function GET(request: Request) {
  const appUrl = getAppUrl();
  const profileUrl = new URL("/profile", appUrl);

  if (!isDiscordConfigured()) {
    profileUrl.searchParams.set("discord", "not_configured");
    return NextResponse.redirect(profileUrl);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    profileUrl.searchParams.set("discord", "denied");
    const user = await getCurrentUser();
    if (user) {
      trackEventFireAndForget({
        eventName: "discord_connect_failed",
        source: "route_handler",
        path: "/api/discord/callback",
        userId: user.id,
        metadata: { reason: oauthError },
      });
    }
    return NextResponse.redirect(profileUrl);
  }

  if (!code || !state) {
    profileUrl.searchParams.set("discord", "invalid_callback");
    return NextResponse.redirect(profileUrl);
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/courses?discord=sign_in_required", appUrl));
  }

  const parsedState = await verifyDiscordOAuthState(state);
  if (!parsedState || parsedState.userId !== user.id) {
    profileUrl.searchParams.set("discord", "invalid_state");
    trackEventFireAndForget({
      eventName: "discord_connect_failed",
      source: "route_handler",
      path: "/api/discord/callback",
      userId: user.id,
      metadata: { reason: "invalid_state" },
    });
    return NextResponse.redirect(profileUrl);
  }

  try {
    const profile = await exchangeDiscordCode(code);

    const existingForDiscord = await prisma.discordAccount.findUnique({
      where: { discordUserId: profile.id },
      select: { userId: true },
    });
    if (existingForDiscord && existingForDiscord.userId !== user.id) {
      profileUrl.searchParams.set("discord", "already_linked");
      trackEventFireAndForget({
        eventName: "discord_connect_failed",
        source: "route_handler",
        path: "/api/discord/callback",
        userId: user.id,
        metadata: { reason: "discord_account_in_use" },
      });
      return NextResponse.redirect(profileUrl);
    }

    await prisma.discordAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        discordUserId: profile.id,
        username: profile.username,
        globalName: profile.global_name,
        avatar: profile.avatar,
      },
      update: {
        discordUserId: profile.id,
        username: profile.username,
        globalName: profile.global_name,
        avatar: profile.avatar,
      },
    });

    await backfillDiscordRoleGrantsForUser(user.id);

    trackEventFireAndForget({
      eventName: "discord_connected",
      source: "route_handler",
      path: "/api/discord/callback",
      userId: user.id,
      walletAddress: user.walletAddress,
      metadata: { discordUserId: profile.id },
    });

    profileUrl.searchParams.set("discord", "connected");
    return NextResponse.redirect(profileUrl);
  } catch {
    profileUrl.searchParams.set("discord", "failed");
    trackEventFireAndForget({
      eventName: "discord_connect_failed",
      source: "route_handler",
      path: "/api/discord/callback",
      userId: user.id,
      metadata: { reason: "exchange_failed" },
    });
    return NextResponse.redirect(profileUrl);
  }
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
