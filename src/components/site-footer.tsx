import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SOLANA_CLUSTER } from "@/lib/solana-config";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap className="size-4 text-primary" />
          <span>Arcademy — the official learning platform for Arcium.</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-foreground">
            Courses
          </Link>
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span className="font-mono text-xs uppercase tracking-wide">
            Solana · {SOLANA_CLUSTER}
          </span>
        </div>
      </div>
    </footer>
  );
}
