"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationItem, type NotificationType } from "@/components/shared/NotificationItem";
import { useAppAuth } from "@/lib/auth";
import { api } from "../../convex/_generated/api";

export function NotificationBell() {
  const { user } = useAppAuth();
  const notificationsQuery = useQuery(
    api.notifications.getByUser,
    user?.convexUserId ? { userId: user.convexUserId, limit: 5 } : "skip",
  );
  const notifications = notificationsQuery ?? [];
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#3B82F6] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 border border-border bg-card p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead({})}
              className="flex items-center gap-1 text-xs text-[#3B82F6] hover:underline"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          )}
        </div>
        <Separator className="bg-border" />
        <ScrollArea className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  type={notification.type as NotificationType}
                  message={notification.message}
                  link={notification.link}
                  isRead={notification.isRead}
                  createdAt={notification.createdAt}
                  onClick={() => void markRead({ notificationId: notification._id })}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator className="bg-border" />
        <div className="px-3 py-2">
          <Link
            href="/notifications"
            className="block text-center text-xs text-[#3B82F6] hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
