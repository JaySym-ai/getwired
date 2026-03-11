"use client";

import Link from "next/link";
import { Heart, MessageCircle, AtSign, UserPlus, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "like" | "comment" | "mention" | "follow" | "news";

interface NotificationItemProps {
  type: NotificationType;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: number;
  onClick?: () => void;
  className?: string;
}

const iconMap: Record<NotificationType, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  mention: AtSign,
  follow: UserPlus,
  news: Newspaper,
};

const iconColorMap: Record<NotificationType, string> = {
  like: "text-red-400",
  comment: "text-blue-400",
  mention: "text-[#3B82F6]",
  follow: "text-purple-400",
  news: "text-amber-400",
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function NotificationItem({
  type,
  message,
  link,
  isRead,
  createdAt,
  onClick,
  className,
}: NotificationItemProps) {
  const Icon = iconMap[type];
  const iconColor = iconColorMap[type];

  return (
    <Link
      href={link}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5",
        !isRead && "border-l-2 border-l-[#3B82F6]",
        isRead && "border-l-2 border-l-transparent opacity-70",
        className
      )}
    >
      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5", iconColor)}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(createdAt)}</p>
      </div>
      {!isRead && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-[#3B82F6]" />
      )}
    </Link>
  );
}

