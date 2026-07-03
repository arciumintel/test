import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDiscordConfigured } from "@/lib/discord";
import { WalletAuth } from "@/components/auth/wallet-auth";
import { DiscordAuth } from "@/components/auth/discord-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { MobileNav } from "@/components/mobile-nav";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications";
import { getHeaderNavLinks, getSiteNavContext } from "@/lib/site-nav";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const navContext = await getSiteNavContext();
  const { user } = navContext;

  const discordAccount = user
    ? await prisma.discordAccount.findUnique({
        where: { userId: user.id },
        select: { username: true, globalName: true },
      })
    : null;

  const discordEnabled = isDiscordConfigured();

  const [notifications, unreadCount] = user
    ? await Promise.all([
        getRecentNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ])
    : [[], 0];

  const navLinks = getHeaderNavLinks(navContext);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <MobileNav links={navLinks} />
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="truncate text-lg tracking-tight">Arcademy</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {user && (
            <NotificationBell
              notifications={notifications.map((n) => ({
                ...n,
                createdAt: n.createdAt.toISOString(),
              }))}
              unreadCount={unreadCount}
            />
          )}
          <DiscordAuth
            linked={discordAccount}
            walletConnected={Boolean(user)}
            discordEnabled={discordEnabled}
          />
          <WalletAuth authedWallet={user?.walletAddress ?? null} />
        </div>
      </div>
    </header>
  );
}
