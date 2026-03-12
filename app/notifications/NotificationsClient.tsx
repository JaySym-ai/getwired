"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Bell } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationItem, type NotificationType } from "@/components/shared/NotificationItem";
import { useAppAuth } from "@/lib/auth";
import { api } from "../../convex/_generated/api";

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "like", label: "Likes" },
  { value: "comment", label: "Comments" },
  { value: "mention", label: "Mentions" },
  { value: "follow", label: "Follows" },
  { value: "news", label: "News" },
];

export function NotificationsClient() {
  const { user } = useAppAuth();
  const notificationsQuery = useQuery(
    api.notifications.getByUser,
    user?.convexUserId ? { userId: user.convexUserId, limit: 100 } : "skip",
  );
  const notifications = useMemo(() => notificationsQuery ?? [], [notificationsQuery]);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    if (activeTab === "all") {
      return notifications;
    }

    return notifications.filter((notification) => notification.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-[#3B82F6]" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-xs font-medium text-[#3B82F6]">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void markAllRead({})}
            className="gap-1.5 text-[#3B82F6] hover:text-[#3B82F6]/80"
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap border border-border bg-muted/50">
          {FILTER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-active:text-[#3B82F6]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FILTER_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-12 text-center">
                <Bell className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-2">
                {filtered.map((notification) => (
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
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
