"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildSignInMessage,
  isValidSolanaAddress,
  verifyWalletSignature,
} from "@/lib/solana";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { trackEventFireAndForget } from "@/lib/analytics-events";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function staffWallets(): Set<string> {
  return new Set(
    (process.env.STAFF_ADMIN_WALLETS ?? "")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean)
  );
}

/** Step 1: issue a one-time message for the wallet to sign. */
export async function requestNonce(
  walletAddress: string
): Promise<{ message: string } | { error: string }> {
  try {
    if (!isValidSolanaAddress(walletAddress)) {
      return { error: "Invalid Solana wallet address." };
    }

    const nonce = randomBytes(24).toString("hex");
    await prisma.authNonce.create({
      data: {
        walletAddress,
        nonce,
        expiresAt: new Date(Date.now() + NONCE_TTL_MS),
      },
    });

    return { message: buildSignInMessage(nonce) };
  } catch (error) {
    console.error("[auth] requestNonce failed:", error);
    return {
      error:
        "Could not reach the database. Check DATABASE_URL and your network, then try again.",
    };
  }
}

/** Step 2: verify the signature, upsert the user, and start a session. */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<{ ok: true; role: string } | { error: string }> {
  try {
    if (!isValidSolanaAddress(walletAddress)) {
      return { error: "Invalid Solana wallet address." };
    }

    const nonceMatch = message.match(/Nonce:\s*([a-f0-9]+)/);
    const nonce = nonceMatch?.[1];
    if (!nonce) return { error: "Malformed sign-in message." };

    const record = await prisma.authNonce.findUnique({ where: { nonce } });
    if (!record || record.walletAddress !== walletAddress) {
      return { error: "Sign-in challenge not found. Please try again." };
    }
    if (record.expiresAt < new Date()) {
      await prisma.authNonce.delete({ where: { id: record.id } }).catch(() => {});
      return { error: "Sign-in challenge expired. Please try again." };
    }

    if (!verifyWalletSignature(walletAddress, message, signature)) {
      return { error: "Signature verification failed." };
    }

    // One-time use.
    await prisma.authNonce.delete({ where: { id: record.id } }).catch(() => {});

    const shouldBeStaff = staffWallets().has(walletAddress);

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: shouldBeStaff ? { role: "staff_admin" } : {},
      create: {
        walletAddress,
        role: shouldBeStaff ? "staff_admin" : "learner",
      },
    });

    await createSession({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    trackEventFireAndForget({
      eventName: "wallet_connected",
      source: "server_action",
      path: "/",
      userId: user.id,
      walletAddress: user.walletAddress,
      metadata: { role: user.role },
    });

    revalidatePath("/", "layout");
    return { ok: true, role: user.role };
  } catch (error) {
    console.error("[auth] verifySignature failed:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Database connection failed. Check DATABASE_URL and try again.";
    return { error: message };
  }
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}

export async function updateDisplayName(
  displayName: string
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  const trimmed = displayName.trim().slice(0, 60);
  await prisma.user.update({
    where: { id: user.id },
    data: { displayName: trimmed || null },
  });
  revalidatePath("/profile");
  return { ok: true };
}
