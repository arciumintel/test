"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  linked?: {
    username: string;
    globalName?: string | null;
  } | null;
  walletConnected: boolean;
  discordEnabled: boolean;
  /** `row` = full-width menu item for the mobile sheet. */
  presentation?: "header" | "row";
};

function displayName(linked: NonNullable<Props["linked"]>): string {
  return linked.globalName?.trim() || linked.username;
}

export function DiscordAuth({
  linked,
  walletConnected,
  discordEnabled,
  presentation = "header",
}: Props) {
  if (!walletConnected || !discordEnabled) return null;

  const isRow = presentation === "row";

  if (linked) {
    return (
      <Button
        variant={isRow ? "ghost" : "outline"}
        size={isRow ? "default" : "sm"}
        asChild
        className={cn(
          "gap-1.5",
          isRow && "h-11 w-full justify-start px-3 font-medium"
        )}
        aria-label={`Discord: ${displayName(linked)}`}
      >
        <Link href="/profile">
          <MessageCircle
            className={cn(
              "size-4 shrink-0 text-[#5865F2]",
              isRow && "size-[1.125rem]"
            )}
          />
          <span
            className={cn(
              "truncate",
              !isRow && "hidden max-w-[8rem] sm:inline"
            )}
          >
            {isRow ? `Discord · ${displayName(linked)}` : displayName(linked)}
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={isRow ? "ghost" : "outline"}
      size={isRow ? "default" : "sm"}
      asChild
      className={cn(
        "gap-1.5",
        isRow && "h-11 w-full justify-start px-3 font-medium"
      )}
      aria-label="Connect Discord"
    >
      <Link href="/api/discord/connect">
        <MessageCircle
          className={cn(
            "size-4 shrink-0 text-[#5865F2]",
            isRow && "size-[1.125rem]"
          )}
        />
        <span className={cn(!isRow && "hidden sm:inline")}>Connect Discord</span>
      </Link>
    </Button>
  );
}
