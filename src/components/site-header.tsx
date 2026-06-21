import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getMyPartnerApplicationStatus } from "@/app/actions/partner-application";
import { getCurrentUser } from "@/lib/session";
import { getManagedProducts } from "@/lib/project-admin";
import { prisma } from "@/lib/prisma";
import { isDiscordConfigured } from "@/lib/discord";
import { WalletAuth } from "@/components/auth/wallet-auth";
import { DiscordAuth } from "@/components/auth/discord-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav, type NavLink } from "@/components/mobile-nav";
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
  const showPartnerConsole = isStaff || managedProjects.length > 0;

  const partnerStatus =
    user && !isStaff && !showPartnerConsole
      ? await getMyPartnerApplicationStatus()
      : null;
  const showBecomePartner =
    Boolean(user) &&
    !isStaff &&
    !showPartnerConsole &&
    !partnerStatus?.pendingApplication;

  const discordEnabled = isDiscordConfigured();

  const navLinks: NavLink[] = [
    { href: "/courses", label: "Courses" },
    { href: "/products", label: "Projects" },
    { href: "/partners", label: "Partners" },
  ];
  if (user) {
    navLinks.push({ href: "/profile", label: "My learning" });
  }
  if (showPartnerConsole) {
    navLinks.push({ href: "/partner-console", label: "Partner console" });
  }
  if (showBecomePartner) {
    navLinks.push({ href: "/partners/apply", label: "Become a partner" });
  }
  if (isStaff) {
    navLinks.push({ href: "/admin", label: "Admin" });
  }

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
