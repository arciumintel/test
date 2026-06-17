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
      <Button variant="outline" size="sm" asChild className="gap-1.5">
        <Link href="/profile">
          <MessageCircle className="size-4 text-[#5865F2]" />
          <span className="max-w-[8rem] truncate">{displayName(linked)}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild className="gap-1.5">
      <Link href="/api/discord/connect">
        <MessageCircle className="size-4 text-[#5865F2]" />
        Connect Discord
      </Link>
    </Button>
  );
}
