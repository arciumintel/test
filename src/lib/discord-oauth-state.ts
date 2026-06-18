import "server-only";
import { SignJWT, jwtVerify } from "jose";

const MAX_AGE = 60 * 10; // 10 minutes

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short");
  }
  return new TextEncoder().encode(secret);
}

export async function createDiscordOAuthState(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: "discord_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyDiscordOAuthState(
  state: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(state, getSecret());
    if (payload.purpose !== "discord_oauth") return null;
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function createDiscordBotInstallState(
  productId: string,
  userId: string
): Promise<string> {
  return new SignJWT({ userId, productId, purpose: "discord_bot_install" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyDiscordBotInstallState(
  state: string
): Promise<{ userId: string; productId: string } | null> {
  try {
    const { payload } = await jwtVerify(state, getSecret());
    if (payload.purpose !== "discord_bot_install") return null;
    const userId = payload.userId;
    const productId = payload.productId;
    if (typeof userId !== "string" || typeof productId !== "string") return null;
    return { userId, productId };
  } catch {
    return null;
  }
}
