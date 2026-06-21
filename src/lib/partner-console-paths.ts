const PARTNER_CONSOLE_PREFIX = "/partner-console/";

/** Accept only in-app partner console paths (open-redirect safe). */
export function safePartnerConsolePath(next: string | undefined): string | null {
  if (!next?.trim()) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith(PARTNER_CONSOLE_PREFIX)) return null;
  if (decoded.includes("://") || decoded.startsWith("//")) return null;
  return decoded;
}

export function partnerConsoleDefaultPath(productId: string) {
  return `/partner-console/${productId}/courses`;
}
