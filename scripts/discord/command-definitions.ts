import { SlashCommandBuilder } from "@discordjs/builders";

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("badges")
    .setDescription("View your earned Arcademy badges"),

  new SlashCommandBuilder()
    .setName("progress")
    .setDescription("View your course progress on Arcademy"),

  new SlashCommandBuilder()
    .setName("quiz-scores")
    .setDescription("View your recent quiz scores on Arcademy"),

  new SlashCommandBuilder()
    .setName("link-status")
    .setDescription("Check whether your Discord is linked to Arcademy"),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify an Arcademy badge by its verification slug")
    .addStringOption((option) =>
      option
        .setName("slug")
        .setDescription("Badge verification slug from Arcademy")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Arcademy staff tools for this Discord server")
    .addSubcommand((sub) =>
      sub
        .setName("lookup")
        .setDescription("Look up a member's badges, progress, and role grants")
        .addUserOption((option) =>
          option.setName("user").setDescription("Member to look up").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("grants")
        .setDescription("Show recent role grant activity for this server")
    )
    .addSubcommand((sub) =>
      sub
        .setName("retry")
        .setDescription("Retry a failed role grant in this server")
        .addStringOption((option) =>
          option
            .setName("grant_id")
            .setDescription("Grant ID (from /staff grants)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("bot-status")
        .setDescription("Show Arcademy bot integration status for this server")
    )
    .addSubcommand((sub) =>
      sub
        .setName("sync-user")
        .setDescription("Backfill missing role grants for a linked member")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Member to sync")
            .setRequired(true)
        )
    ),
];

export function getCommandJsonPayload() {
  return commandDefinitions.map((command) => command.toJSON());
}
