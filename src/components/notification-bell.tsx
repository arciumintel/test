"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import type { NotificationItem as ServerNotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type BellNotification = Omit<ServerNotificationItem, "createdAt"> & {
  createdAt: string;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: BellNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  async function onOpenItem(id: string, actionUrl: string | null) {
    await markNotificationReadAction(id);
    setOpen(false);
    if (actionUrl) {
      router.push(actionUrl);
    } else {
      router.refresh();
    }
  }

  async function onMarkAllRead() {
    await markAllNotificationsReadAction();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-2rem,24rem)]">
        <SheetHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={onMarkAllRead}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {notifications.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              No notifications yet. Complete a course to earn your first badge.
            </p>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenItem(item.id, item.actionUrl)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50",
                  !item.readAt && "border-border-strong bg-surface-secondary"
                )}
              >
                <p className="font-medium">{item.title}</p>
                {item.body && (
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
        <div className="mt-4 border-t pt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/profile/notifications">View all</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
