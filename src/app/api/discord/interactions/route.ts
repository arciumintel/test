import { after } from "next/server";
import {
  InteractionType,
} from "discord-interactions";
import {
  commandUsesEphemeralDefer,
  routeCommand,
} from "@/lib/discord-bot/router";
import {
  deferResponse,
  editDeferredReply,
  pongResponse,
} from "@/lib/discord-bot/respond";
import { verifyDiscordRequest } from "@/lib/discord-bot/verify";
import type { DiscordInteraction } from "@/lib/discord-bot/types";

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const rawBody = await request.text();

  const valid = await verifyDiscordRequest(rawBody, signature, timestamp);
  if (!valid) {
    return new Response("Invalid request signature", { status: 401 });
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (interaction.type === InteractionType.PING) {
    return pongResponse();
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data?.name;
    const ephemeral = commandUsesEphemeralDefer(commandName);

    after(async () => {
      try {
        const payload = await routeCommand(interaction);
        await editDeferredReply(interaction, payload);
      } catch (error) {
        console.error("[discord-bot] command failed:", error);
        await editDeferredReply(interaction, {
          content: "Something went wrong while running that command. Try again in a moment.",
        });
      }
    });

    return deferResponse(ephemeral);
  }

  return new Response("Unhandled interaction type", { status: 400 });
}
