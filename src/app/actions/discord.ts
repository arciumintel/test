"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeUser } from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";
import { retryDiscordRoleGrant } from "@/lib/discord-role-grants";

type Result = { ok: true } | { error: string };

export async function disconnectDiscord(): Promise<Result> {
  const auth = await authorizeUser("Sign in with your wallet first.");
  if (!auth.ok) return { error: auth.message };
  const user = auth.user;

  const account = await prisma.discordAccount.findUnique({
    where: { userId: user.id },
  });
  if (!account) return { ok: true };

  await prisma.discordAccount.delete({ where: { userId: user.id } });

  trackEventFireAndForget({
    eventName: "discord_disconnected",
    source: "server_action",
    path: "/profile",
    userId: user.id,
    metadata: { discordUserId: account.discordUserId },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function retryMyDiscordGrant(grantId: string): Promise<Result> {
  const auth = await authorizeUser("Sign in with your wallet first.");
  if (!auth.ok) return { error: auth.message };
  const user = auth.user;

  const ok = await retryDiscordRoleGrant(grantId, user.id);
  if (!ok) return { error: "This grant cannot be retried." };

  revalidatePath("/profile");
  return { ok: true };
}
