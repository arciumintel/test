/**
 * Runtime checks for production deployment assumptions.
 * Logs warnings in development; does not throw during builds.
 */
const REQUIRED_AT_RUNTIME = ["DATABASE_URL", "AUTH_SECRET"] as const;

const RECOMMENDED = [
  "DIRECT_URL",
  "NEXT_PUBLIC_APP_URL",
  "STAFF_ADMIN_WALLETS",
] as const;

export function validateDeploymentEnv(): string[] {
  const warnings: string[] = [];

  for (const key of REQUIRED_AT_RUNTIME) {
    if (!process.env[key]?.trim()) {
      warnings.push(`${key} is not set.`);
    }
  }

  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 16) {
    warnings.push("AUTH_SECRET should be at least 16 characters.");
  }

  for (const key of RECOMMENDED) {
    if (!process.env[key]?.trim()) {
      warnings.push(`${key} is not set (recommended for launch).`);
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    warnings.push("Cloudinary is not configured — media uploads will be disabled.");
  }

  return warnings;
}

export function logDeploymentWarnings(): void {
  const warnings = validateDeploymentEnv();
  if (warnings.length === 0) return;
  const prefix = "[arcademy:env]";
  for (const warning of warnings) {
    console.warn(prefix, warning);
  }
}
