import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Neon serverless driver needs a WebSocket implementation in Node.js.
 * Without this, Prisma queries throw opaque `ErrorEvent` failures and wallet
 * sign-in breaks at verifySignature.
 */
neonConfig.webSocketConstructor = ws;

/** Allow Neon compute wake-up from scale-to-zero (seconds). */
export function getDatabaseConnectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return "";

  if (url.includes("connect_timeout=")) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=30`;
}
