import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  getDiscordOAuthUrl,
  isDiscordConfigured,
} from "@/lib/discord";
import { createDiscordOAuthState } from "@/lib/discord-oauth-state";
import { trackEventFireAndForget } from "@/lib/analytics-events";

export async function GET() {
  if (!isDiscordConfigured()) {
    return NextResponse.json(
      { error: "Discord integration is not configured." },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/courses?discord=sign_in_required", getAppUrl()));
  }

  const state = await createDiscordOAuthState(user.id);
  trackEventFireAndForget({
    eventName: "discord_connect_started",
    source: "route_handler",
    path: "/api/discord/connect",
    userId: user.id,
    walletAddress: user.walletAddress,
  });

  return NextResponse.redirect(getDiscordOAuthUrl(state));
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
