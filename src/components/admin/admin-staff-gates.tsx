"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletAuth } from "@/components/auth/wallet-auth";

export function AdminStaffConnectPrompt() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <ShieldAlert
        className="mx-auto size-10 text-muted-foreground"
        aria-hidden
      />
      <h1 className="mt-4 text-xl font-semibold">Staff access required</h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        Connect your staff wallet and sign in to open the admin dashboard.
      </p>
      <div className="mt-6 flex justify-center">
        <WalletAuth align="center" />
      </div>
    </div>
  );
}

export function AdminAccessDenied() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <ShieldAlert
        className="mx-auto size-10 text-muted-foreground"
        aria-hidden
      />
      <h1 className="mt-4 text-xl font-semibold">Staff access only</h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        This area is for Arcademy staff admins. Your wallet is connected, but it
        does not have staff permissions.
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href="/courses">Browse courses</Link>
      </Button>
    </div>
  );
}
