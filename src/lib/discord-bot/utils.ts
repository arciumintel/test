import "server-only";
import { absoluteUrl } from "@/lib/site";
import type { DiscordInteraction, DiscordInteractionOption } from "@/lib/discord-bot/types";

export function truncateWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function profileConnectUrl(): string {
  return absoluteUrl("/profile");
}

export function getDiscordUserId(interaction: {
  member?: { user: { id: string } };
  user?: { id: string };
}): string {
  return interaction.member?.user.id ?? interaction.user!.id;
}

export function getOptionString(
  options: DiscordInteractionOption[] | undefined,
  name: string
): string | undefined {
  const value = options?.find((o) => o.name === name)?.value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function getSubcommand(options: DiscordInteractionOption[] | undefined): {
  name: string;
  options: DiscordInteractionOption[];
} | null {
  const sub = options?.find((o) => o.type === 1);
  if (!sub) return null;
  return { name: sub.name, options: sub.options ?? [] };
}

export function getResolvedUsername(
  interaction: DiscordInteraction,
  userId: string
): string {
  const resolved = interaction.data?.resolved?.users?.[userId];
  return resolved?.global_name ?? resolved?.username ?? "Member";
}

export function formatGrantStatus(status: string): string {
  return status.replaceAll("_", " ");
}
