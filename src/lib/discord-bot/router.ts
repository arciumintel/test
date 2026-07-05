import "server-only";
import { handleStaff } from "@/lib/discord-bot/commands/staff";
import {
  handleBadges,
  handleLinkStatus,
  handleProgress,
  handleQuizScores,
  handleVerify,
} from "@/lib/discord-bot/commands/learner";
import type {
  DiscordInteraction,
  InteractionReplyPayload,
} from "@/lib/discord-bot/types";

export async function routeCommand(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const name = interaction.data?.name;
  if (!name) {
    return { content: "Unknown command." };
  }

  switch (name) {
    case "badges":
      return handleBadges(interaction);
    case "progress":
      return handleProgress(interaction);
    case "quiz-scores":
      return handleQuizScores(interaction);
    case "link-status":
      return handleLinkStatus(interaction);
    case "verify":
      return handleVerify(interaction);
    case "staff":
      return handleStaff(interaction);
    default:
      return { content: "Unknown command." };
  }
}

export function commandUsesEphemeralDefer(commandName: string | undefined): boolean {
  return commandName !== "verify";
}
