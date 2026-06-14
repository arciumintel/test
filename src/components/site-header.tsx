import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { WalletAuth } from "@/components/auth/wallet-auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isStaff = user?.role === "staff_admin";

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
            {user && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">My learning</Link>
              </Button>
            )}
            {isStaff && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </nav>
        </div>
        <WalletAuth authedWallet={user?.walletAddress ?? null} />
      </div>
    </header>
  );
}
