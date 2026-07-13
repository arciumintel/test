import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const SKEW_CACHE_TTL_MS = 10 * 60 * 1000;
let cachedSkewMs: number | null = null;
let skewCheckedAt = 0;

/**
 * Cloudinary rejects signed uploads when the timestamp is >1h off their clock.
 * Local clocks (especially Windows without NTP) can drift that far, so we
 * measure skew against an HTTP Date header and adjust.
 */
async function getTrustedUnixTimestamp(): Promise<number> {
  const now = Date.now();
  if (cachedSkewMs === null || now - skewCheckedAt > SKEW_CACHE_TTL_MS) {
    try {
      const res = await fetch("https://res.cloudinary.com/", {
        method: "HEAD",
        cache: "no-store",
      });
      const dateHdr = res.headers.get("date");
      if (dateHdr) {
        const remote = Date.parse(dateHdr);
        if (!Number.isNaN(remote)) {
          cachedSkewMs = remote - Date.now();
          skewCheckedAt = Date.now();
        }
      }
    } catch {
      // Fall back to the local clock if the probe fails.
    }
  }
  return Math.round((Date.now() + (cachedSkewMs ?? 0)) / 1000);
}

/**
 * Produces a signature for a direct, signed browser upload. Lets the admin
 * upload course/lesson media to Cloudinary; we only ever store the returned
 * secure_url reference in Postgres.
 */
export async function signUpload(params: Record<string, string | number> = {}) {
  const timestamp = await getTrustedUnixTimestamp();
  const toSign = { timestamp, folder: "arcademy", ...params };
  const signature = cloudinary.utils.api_sign_request(
    toSign,
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
    folder: "arcademy",
  };
}

export { cloudinary };
