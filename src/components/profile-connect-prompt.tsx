"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletAuth } from "@/components/auth/wallet-auth";

export function ProfileConnectPrompt() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <GraduationCap
        className="mx-auto size-8 text-muted-foreground"
        aria-hidden
      />
      <p className="mt-3 font-medium">Connect your wallet to get started</p>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Save lesson progress, quiz scores, and badges in one place.
      </p>
      <div className="mt-6 flex justify-center">
        <WalletAuth align="center" />
      </div>
      <p className="mt-4 text-pretty text-sm text-muted-foreground">
        You can read courses without a wallet. Connect when you want tracked
        progress.
      </p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/courses">Browse courses</Link>
      </Button>
    </div>
  );
}
