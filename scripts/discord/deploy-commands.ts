import "dotenv/config";
import { REST } from "@discordjs/rest";
import { getCommandJsonPayload } from "./command-definitions";

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const clientId = process.env.DISCORD_CLIENT_ID?.trim();
const guildDeploy = process.argv.includes("--guild");
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!token || !clientId) {
  console.error("Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in your environment.");
  process.exit(1);
}

if (guildDeploy && !guildId) {
  console.error("Set DISCORD_GUILD_ID for guild command deployment.");
  process.exit(1);
}

const rest = new REST().setToken(token);
const commands = getCommandJsonPayload();

async function deploy() {
  try {
    if (guildDeploy) {
      console.log(`Refreshing ${commands.length} guild commands for ${guildId}...`);
      const data = await rest.put(
        `/applications/${clientId}/guilds/${guildId}/commands`,
        { body: commands }
      );
      console.log(`Successfully registered ${(data as unknown[]).length} guild commands.`);
    } else {
      console.log(`Refreshing ${commands.length} global commands...`);
      const data = await rest.put(`/applications/${clientId}/commands`, {
        body: commands,
      });
      console.log(
        `Successfully registered ${(data as unknown[]).length} global commands (may take up to ~1 hour to propagate).`
      );
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void deploy();
