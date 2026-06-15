import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export { SOLANA_CLUSTER } from "@/lib/solana-config";

/** The human-readable message a wallet signs to prove ownership. */
export function buildSignInMessage(nonce: string): string {
  return [
    "Sign in to Arcademy",
    "",
    "This signature proves you own this wallet. It does not trigger a transaction or cost any fees.",
    "",
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    void new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies that `signatureB58` is a valid ed25519 signature of `message`
 * produced by the private key behind `walletAddress`.
 */
export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signatureB58: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signatureB58);
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}
