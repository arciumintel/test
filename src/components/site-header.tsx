import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getManagedProducts } from "@/lib/project-admin";
import { prisma } from "@/lib/prisma";
import { isDiscordConfigured } from "@/lib/discord";
import { WalletAuth } from "@/components/auth/wallet-auth";
import { DiscordAuth } from "@/components/auth/discord-auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isStaff = user?.role === "staff_admin";

  const discordAccount = user
    ? await prisma.discordAccount.findUnique({
        where: { userId: user.id },
        select: { username: true, globalName: true },
      })
    : null;

  const managedProjects =
    user && !isStaff ? await getManagedProducts(user.id, false) : [];
  const showProjectConsole = isStaff || managedProjects.length > 0;

  const discordEnabled = isDiscordConfigured();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg tracking-tight">Arcademy</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">Courses</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">Ecosystem Projects</Link>
            </Button>
            {user && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">My learning</Link>
              </Button>
            )}
            {showProjectConsole && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/project-console">Project console</Link>
              </Button>
            )}
            {isStaff && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
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
