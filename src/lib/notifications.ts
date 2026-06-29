import { prisma } from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      actionUrl: input.actionUrl ?? null,
    },
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function getRecentNotifications(
  userId: string,
  limit = 8
): Promise<NotificationItem[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      actionUrl: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
