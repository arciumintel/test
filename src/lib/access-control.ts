import "server-only";

import type { User } from "@prisma/client";
import { isProjectAdmin } from "@/lib/project-admin-access";
import { getCurrentUser } from "@/lib/session";

export const ACCESS_MESSAGES = {
  unauthenticated: "Connect your wallet to continue.",
  staffRequired: "You must be signed in as staff to do this.",
  projectAdminRequired: "You do not have permission to manage this project.",
  analyticsForbidden: "You do not have permission to view this analytics.",
} as const;

export type AccessDenialReason = "unauthenticated" | "forbidden";

export type AccessResult =
  | { ok: true; user: User }
  | { ok: false; reason: AccessDenialReason; message: string };

export async function authorizeUser(
  message: string = ACCESS_MESSAGES.unauthenticated
): Promise<AccessResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "unauthenticated", message };
  }
  return { ok: true, user };
}

export async function authorizeStaff(
  message: string = ACCESS_MESSAGES.staffRequired
): Promise<AccessResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "unauthenticated", message };
  }
  if (user.role !== "staff_admin") {
    return { ok: false, reason: "forbidden", message };
  }
  return { ok: true, user };
}

/** Staff or assigned partner admin for an ecosystem project. */
export async function authorizeProjectAdmin(
  productId: string,
  message: string = ACCESS_MESSAGES.projectAdminRequired
): Promise<AccessResult> {
  const auth = await authorizeUser(message);
  if (!auth.ok) return auth;

  if (auth.user.role === "staff_admin") {
    return auth;
  }

  const allowed = await isProjectAdmin(auth.user.id, productId);
  if (!allowed) {
    return { ok: false, reason: "forbidden", message };
  }

  return auth;
}

/** Alias — staff already pass project admin checks. */
export const authorizeStaffOrProjectAdmin = authorizeProjectAdmin;

export function toActionError(result: Extract<AccessResult, { ok: false }>): {
  error: string;
} {
  return { error: result.message };
}
