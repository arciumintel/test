import "server-only";
import type { DiscordInteraction, InteractionReplyPayload } from "@/lib/discord-bot/types";

const DISCORD_API = "https://discord.com/api/v10";

export function deferResponse(ephemeral: boolean): Response {
  return Response.json({
    type: 5,
    data: ephemeral ? { flags: 64 } : {},
  });
}

export function pongResponse(): Response {
  return Response.json({ type: 1 });
}

export function immediateResponse(
  payload: InteractionReplyPayload,
  ephemeral = true
): Response {
  return Response.json({
    type: 4,
    data: {
      ...payload,
      flags: ephemeral ? 64 : 0,
    },
  });
}

export async function editDeferredReply(
  interaction: DiscordInteraction,
  payload: InteractionReplyPayload
): Promise<void> {
  const url = `${DISCORD_API}/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[discord-bot] editDeferredReply failed:", res.status, text);
  }
}
