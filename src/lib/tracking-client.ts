"use client";

const SESSION_KEY = "arcademy_sid";
const ANON_KEY = "arcademy_aid";

function getOrCreateStorageId(key: string): string {
  if (typeof window === "undefined") return "";
  let value = localStorage.getItem(key);
  if (!value) {
    value =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

export function getTrackingSessionId(): string {
  return getOrCreateStorageId(SESSION_KEY);
}

export function getTrackingAnonymousId(): string {
  return getOrCreateStorageId(ANON_KEY);
}

export function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
} {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") ?? undefined;
  const utmMedium = params.get("utm_medium") ?? undefined;
  const utmCampaign = params.get("utm_campaign") ?? undefined;
  const utmContent = params.get("utm_content") ?? undefined;
  return { utmSource, utmMedium, utmCampaign, utmContent };
}

export function getBrowserReferrer(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.referrer || undefined;
}
