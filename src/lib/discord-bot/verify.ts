import "server-only";
import { verifyKey } from "discord-interactions";

export async function verifyDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): Promise<boolean> {
  const publicKey = process.env.DISCORD_PUBLIC_KEY?.trim();
  if (!publicKey || !signature || !timestamp) return false;

  return verifyKey(rawBody, signature, timestamp, publicKey);
}
