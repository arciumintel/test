"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

type Result = { ok: true };
type ActionError = { error: string };

export async function markNotificationReadAction(
  notificationId: string
): Promise<Result | ActionError> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required." };

  await markNotificationRead(user.id, notificationId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<
  Result | ActionError
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required." };

  await markAllNotificationsRead(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadFormAction(): Promise<void> {
  await markAllNotificationsReadAction();
}
