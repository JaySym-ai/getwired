"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, TrendingUp, MessageSquare, Users, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALERT_ICONS: Record<string, React.ElementType> = {
  reddit_mention: MessageSquare,
  rank_change: TrendingUp,
  trend_spike: AlertTriangle,
  new_competitor: Users,
};

interface AlertsPopoverProps {
  projectId: Id<"projects">;
}

export function AlertsPopover({ projectId }: AlertsPopoverProps) {
  const alerts = useQuery(api.monitoring.getUnreadAlerts, { projectId });
  const markRead = useMutation(api.monitoring.markAlertRead);
  const markAllRead = useMutation(api.monitoring.markAllRead);

  const unreadCount = alerts?.length ?? 0;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="sm" className="relative" />}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Alerts</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllRead({ projectId })}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {unreadCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No new alerts
            </p>
          ) : (
            <div className="space-y-2">
              {alerts?.map((alert) => {
                const Icon = ALERT_ICONS[alert.type] ?? Bell;
                return (
                  <div
                    key={alert._id}
                    className="flex gap-2 rounded-md p-2 hover:bg-muted cursor-pointer"
                    onClick={() => markRead({ alertId: alert._id })}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

