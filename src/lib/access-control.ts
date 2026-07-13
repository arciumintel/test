import "server-only";

import type { ProjectAdminRole, User } from "@prisma/client";
import {
  getProjectAdminRole,
  isProjectAdmin,
} from "@/lib/project-admin-access";
import { getCurrentUser } from "@/lib/session";

export const ACCESS_MESSAGES = {
  unauthenticated: "Connect your wallet to continue.",
  staffRequired: "You must be signed in as staff to do this.",
  projectAdminRequired: "You do not have permission to manage this project.",
  analyticsForbidden: "You do not have permission to view this analytics.",
  analyticsConfigForbidden:
    "Analysts can view analytics but cannot change configuration.",
  analyticsSensitiveForbidden:
    "Only project owners and Arcademy staff can edit readiness, conversions, and recommendation policies.",
} as const;

export type AccessDenialReason = "unauthenticated" | "forbidden";

export type AccessResult =
  | { ok: true; user: User }
  | { ok: false; reason: AccessDenialReason; message: string };

export type AnalyticsAccessLevel =
  | "platform_admin"
  | "owner"
  | "manager"
  | "analyst";

export type AnalyticsAccessResult =
  | {
      ok: true;
      user: User;
      level: AnalyticsAccessLevel;
      projectRole: ProjectAdminRole | null;
    }
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

/** Staff or assigned partner admin for an ecosystem project (any role). */
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

function toAnalyticsAccess(
  user: User,
  level: AnalyticsAccessLevel,
  projectRole: ProjectAdminRole | null
): Extract<AnalyticsAccessResult, { ok: true }> {
  return { ok: true, user, level, projectRole };
}

/**
 * Platform Admin or any project admin (owner / manager / analyst).
 * Capability: view analytics, export, compare date ranges.
 */
export async function authorizeAnalyticsRead(
  productId: string,
  message: string = ACCESS_MESSAGES.analyticsForbidden
): Promise<AnalyticsAccessResult> {
  const auth = await authorizeUser(message);
  if (!auth.ok) return auth;

  if (auth.user.role === "staff_admin") {
    return toAnalyticsAccess(auth.user, "platform_admin", null);
  }

  const role = await getProjectAdminRole(auth.user.id, productId);
  if (!role) {
    return { ok: false, reason: "forbidden", message };
  }

  return toAnalyticsAccess(auth.user, role, role);
}

/**
 * Platform Admin, Owner, or Manager.
 * Capability: concepts, learning objectives, content tagging, terminology, dashboard layout.
 */
export async function authorizeAnalyticsConfig(
  productId: string,
  message: string = ACCESS_MESSAGES.projectAdminRequired
): Promise<AnalyticsAccessResult> {
  const auth = await authorizeAnalyticsRead(productId, message);
  if (!auth.ok) return auth;

  if (auth.level === "analyst") {
    return {
      ok: false,
      reason: "forbidden",
      message: ACCESS_MESSAGES.analyticsConfigForbidden,
    };
  }

  return auth;
}

/**
 * Platform Admin or Partner Owner only.
 * Capability: readiness formulas, conversion definitions, recommendation thresholds, pack install.
 */
export async function authorizeAnalyticsSensitiveConfig(
  productId: string,
  message: string = ACCESS_MESSAGES.projectAdminRequired
): Promise<AnalyticsAccessResult> {
  const auth = await authorizeAnalyticsRead(productId, message);
  if (!auth.ok) return auth;

  if (auth.level === "platform_admin" || auth.level === "owner") {
    return auth;
  }

  return {
    ok: false,
    reason: "forbidden",
    message: ACCESS_MESSAGES.analyticsSensitiveForbidden,
  };
}

/** Platform Admin only — global pack/template definitions. */
export async function authorizeAnalyticsPlatformAdmin(
  message: string = ACCESS_MESSAGES.staffRequired
): Promise<AccessResult> {
  return authorizeStaff(message);
}

export function toActionError(result: Extract<AccessResult, { ok: false }>): {
  error: string;
} {
  return { error: result.message };
}

export function toAnalyticsActionError(
  result: Extract<AnalyticsAccessResult, { ok: false }>
): { error: string } {
  return { error: result.message };
}
