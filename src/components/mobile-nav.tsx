"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BookText,
  GraduationCap,
  LayoutGrid,
  Menu,
  Orbit,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { DiscordAuth } from "@/components/auth/discord-auth";
import { cn } from "@/lib/utils";
import type { NavLinkGroup } from "@/lib/site-nav";
import type { NotificationItem as ServerNotificationItem } from "@/lib/notifications";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/start": Sparkles,
  "/courses": BookOpen,
  "/ecosystem": Orbit,
  "/products": LayoutGrid,
  "/glossary": BookText,
  "/profile": GraduationCap,
  "/partners": Shield,
  "/partners/docs": BookText,
  "/partners/apply": Sparkles,
  "/partner-console": LayoutGrid,
  "/admin": Shield,
};

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Keep /partners exact so handbook / apply don't light up "Partners".
  if (href === "/partners") return false;
  return pathname.startsWith(`${href}/`);
}

type DiscordLinked = {
  username: string;
  globalName?: string | null;
} | null;

type MobileNotification = Omit<ServerNotificationItem, "createdAt" | "readAt"> & {
  createdAt: string;
  readAt: string | null;
};

export type MobileNavProps = {
  groups: NavLinkGroup[];
  notifications?: MobileNotification[];
  unreadCount?: number;
  discordLinked?: DiscordLinked;
  walletConnected?: boolean;
  discordEnabled?: boolean;
};

export function MobileNav({
  groups,
  notifications = [],
  unreadCount = 0,
  discordLinked = null,
  walletConnected = false,
  discordEnabled = false,
}: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(100vw-2rem,20rem)] flex-col gap-0 p-0"
      >
        <SheetHeader className="space-y-0 border-b px-4 py-4 pr-12 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold tracking-tight">
                Arcademy
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Learn the Arcium ecosystem
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <nav key={group.id} aria-label={group.label} className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = NAV_ICONS[link.href] ?? BookOpen;
                  const active = isActivePath(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[1.125rem] shrink-0",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}

          <div className="space-y-3 border-t pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preferences
            </p>

            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>

            {walletConnected ? (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                presentation="row"
                onOpenChange={(next) => {
                  if (next) closeMenu();
                }}
              />
            ) : null}

            {walletConnected && discordEnabled ? (
              <DiscordAuth
                linked={discordLinked}
                walletConnected={walletConnected}
                discordEnabled={discordEnabled}
                presentation="row"
              />
            ) : null}
          </div>
        </div>

        {!walletConnected ? (
          <div className="mt-auto border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Connect your wallet in the header to save progress and earn badges.
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
