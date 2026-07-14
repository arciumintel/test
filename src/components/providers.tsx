"use client";

import * as React from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "mainnet-beta") as Cluster;

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = React.useMemo(() => clusterApiUrl(cluster), []);
  // Wallet-Standard auto-discovers installed wallets (Phantom, Solflare, etc.),
  // so we don't need to register adapters manually.
  const wallets = React.useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
