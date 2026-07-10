"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  linked?: {
    username: string;
    globalName?: string | null;
  } | null;
  walletConnected: boolean;
  discordEnabled: boolean;
};

function displayName(linked: NonNullable<Props["linked"]>): string {
  return linked.globalName?.trim() || linked.username;
}

export function DiscordAuth({ linked, walletConnected, discordEnabled }: Props) {
  if (!walletConnected || !discordEnabled) return null;

  if (linked) {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className="gap-1.5"
        aria-label={`Discord: ${displayName(linked)}`}
      >
        <Link href="/profile">
          <MessageCircle className="size-4 text-info" />
          <span className="hidden max-w-[8rem] truncate sm:inline">
            {displayName(linked)}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="gap-1.5"
      aria-label="Connect Discord"
    >
      <Link href="/api/discord/connect">
        <MessageCircle className="size-4 text-info" />
        <span className="hidden sm:inline">Connect Discord</span>
      </Link>
    </Button>
  );
}
