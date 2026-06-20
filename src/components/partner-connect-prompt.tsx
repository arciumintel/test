"use client";

import Link from "next/link";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletAuth } from "@/components/auth/wallet-auth";

export function PartnerConnectPrompt() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <Handshake
        className="mx-auto size-8 text-muted-foreground"
        aria-hidden
      />
      <p className="mt-3 font-medium">Connect your wallet to open Partner console</p>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Partner tools are tied to your wallet. Connect and sign in to manage
        projects, course drafts, and Discord setup.
      </p>
      <div className="mt-6 flex justify-center">
        <WalletAuth align="center" />
      </div>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/courses">Browse courses</Link>
      </Button>
    </div>
  );
}
