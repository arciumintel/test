import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsReadFormAction } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        My learning
      </Link>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {notifications.some((n) => !n.readAt) && (
          <form action={markAllNotificationsReadFormAction}>
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        )}
      </div>
      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no notifications yet.
          </p>
        ) : (
          notifications.map((item) => {
            const inner = (
              <div
                className={cn(
                  "rounded-xl border p-4",
                  !item.readAt && "border-border-strong bg-surface-secondary"
                )}
              >
                <p className="font-medium">{item.title}</p>
                {item.body && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.createdAt.toLocaleString()}
                </p>
              </div>
            );
            return item.actionUrl ? (
              <Link key={item.id} href={item.actionUrl} className="block">
                {inner}
              </Link>
            ) : (
              <div key={item.id}>{inner}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
