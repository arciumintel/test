"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { assignProjectAdmin, removeProjectAdmin } from "@/app/actions/project-discord";
import { shortWallet } from "@/lib/utils";

type AdminRow = {
  id: string;
  role: "owner" | "manager" | "analyst";
  user: { walletAddress: string; displayName: string | null };
};

type Props = {
  productId: string;
  admins: AdminRow[];
};

export function ProjectAdminPanel({ productId, admins }: Props) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = React.useState("");
  const [role, setRole] = React.useState<"owner" | "manager" | "analyst">(
    "manager"
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await assignProjectAdmin(productId, { walletAddress, role });
    if ("error" in res) setError(res.error);
    else {
      setWalletAddress("");
      router.refresh();
    }
    setBusy(false);
  }

  async function handleRemove(adminId: string) {
    setBusy(true);
    setError(null);
    const res = await removeProjectAdmin(productId, adminId);
    if ("error" in res) setError(res.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">Project admins</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Assign wallet users as Owner (full analytics config), Manager (content
        and concepts), or Analyst (read-only analytics). They must sign in with
        their wallet at least once before assignment.
      </p>

      <form onSubmit={handleAssign} className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <Label htmlFor="admin-wallet">Wallet address</Label>
          <Input
            id="admin-wallet"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Solana wallet address"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-role">Role</Label>
          <Select
            id="admin-role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "owner" | "manager" | "analyst")
            }
            className="w-full sm:w-36"
          >
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy || !walletAddress.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Add admin"}
          </Button>
        </div>
      </form>

      {admins.length > 0 && (
        <ul className="mt-6 divide-y rounded-lg border">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {admin.user.displayName || shortWallet(admin.user.walletAddress)}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {shortWallet(admin.user.walletAddress, 6)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="capitalize text-muted-foreground">{admin.role}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleRemove(admin.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
