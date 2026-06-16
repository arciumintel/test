"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { LogOut, Loader2, Wallet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortWallet } from "@/lib/utils";
import { requestNonce, verifySignature, signOut } from "@/app/actions/auth";
import { trackClientEvent } from "@/app/actions/tracking";
import {
  getBrowserReferrer,
  getTrackingAnonymousId,
  getTrackingSessionId,
  getUtmParams,
} from "@/lib/tracking-client";

type Props = {
  authedWallet?: string | null;
  className?: string;
};

function currentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

async function trackWalletFailure(
  failureStage: string,
  failureReason: string
): Promise<void> {
  await trackClientEvent({
    eventName: "wallet_connect_failed",
    path: currentPath(),
    sessionId: getTrackingSessionId(),
    anonymousId: getTrackingAnonymousId(),
    referrer: getBrowserReferrer(),
    ...getUtmParams(),
    metadata: { failureStage, failureReason },
  });
}

export function WalletAuth({ authedWallet, className }: Props) {
  const router = useRouter();
  const { publicKey, signMessage, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const runSignIn = React.useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setBusy(true);
    setError(null);
    void trackClientEvent({
      eventName: "wallet_connect_started",
      path: currentPath(),
      sessionId: getTrackingSessionId(),
      anonymousId: getTrackingAnonymousId(),
      referrer: getBrowserReferrer(),
      ...getUtmParams(),
      metadata: {
        ctaPlacement: "header",
        walletAdapterName: wallet?.adapter.name,
      },
    });
    try {
      const address = publicKey.toBase58();
      const nonceRes = await requestNonce(address);
      if ("error" in nonceRes) {
        setError(nonceRes.error);
        await trackWalletFailure("nonce_request", nonceRes.error);
        return;
      }
      const encoded = new TextEncoder().encode(nonceRes.message);
      let signature: Uint8Array;
      try {
        signature = await signMessage(encoded);
      } catch (e) {
        const reason =
          e instanceof Error && e.message.includes("User rejected")
            ? "Signature request was rejected."
            : "Could not sign the message.";
        setError(reason);
        await trackWalletFailure("signature_request", reason);
        return;
      }
      const res = await verifySignature(
        address,
        bs58.encode(signature),
        nonceRes.message
      );
      if ("error" in res) {
        setError(res.error);
        await trackWalletFailure("signature_verification", res.error);
        return;
      }
      router.refresh();
    } catch (e) {
      const reason =
        e instanceof Error && e.message.includes("User rejected")
          ? "Signature request was rejected."
          : "Could not complete sign-in. Please try again.";
      setError(reason);
      await trackWalletFailure("session_create", reason);
    } finally {
      setBusy(false);
    }
  }, [publicKey, signMessage, router, wallet?.adapter.name]);

  async function handleSignOut() {
    setBusy(true);
    try {
      await disconnect().catch(() => {});
      await signOut();
      setMenuOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function openWalletModal() {
    void trackClientEvent({
      eventName: "wallet_connect_started",
      path: currentPath(),
      sessionId: getTrackingSessionId(),
      anonymousId: getTrackingAnonymousId(),
      referrer: getBrowserReferrer(),
      ...getUtmParams(),
      metadata: { ctaPlacement: "header", walletAdapterName: wallet?.adapter.name },
    });
    setVisible(true);
  }

  // Already authenticated on the server.
  if (authedWallet) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <Button
          variant="outline"
          onClick={() => setMenuOpen((o) => !o)}
          className="font-mono"
        >
          <ShieldCheck className="text-success" />
          {shortWallet(authedWallet)}
        </Button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border bg-popover p-1 shadow-lg">
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Wallet connected, needs to sign in.
  if (connected && publicKey) {
    return (
      <div className={`flex flex-col items-end gap-1 ${className ?? ""}`}>
        <Button onClick={runSignIn} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          Sign in to continue
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // Not connected.
  return (
    <div className={`flex flex-col items-end gap-1 ${className ?? ""}`}>
      <Button onClick={openWalletModal} disabled={busy}>
        <Wallet />
        Connect wallet
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
