"use client";

import {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  ShoppingBag, User, Bookmark, Bell, Search, Shield, Mail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowManager, APP_REGISTRY } from "./useWindowManager";

const ICON_MAP: Record<string, LucideIcon> = {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  ShoppingBag, User, Bookmark, Bell, Search, Shield, Mail,
};

// Which apps to show in the dock (and in what order)
const DOCK_APP_IDS = [
  "feed", "forums", "chat", "news", "discover",
  "marketplace", "profile", "bookmarks", "notifications", "search",
];

export function Dock() {
  const { state, openWindow, focusWindow, restoreWindow } = useWindowManager();

  function handleClick(appId: string) {
    const existing = state.windows.find((w) => w.appId === appId);
    if (existing) {
      if (existing.isMinimized) {
        restoreWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
    } else {
      openWindow(appId);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] flex items-end justify-center pb-2" style={{ height: 72 }}>
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.1] bg-zinc-900/80 px-2 py-1.5 backdrop-blur-xl">
        {DOCK_APP_IDS.map((appId) => {
          const app = APP_REGISTRY[appId];
          if (!app) return null;
          const Icon = ICON_MAP[app.icon] ?? Search;
          const isRunning = state.windows.some((w) => w.appId === appId);

          return (
            <button
              key={appId}
              onClick={() => handleClick(appId)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl p-1.5 transition-transform duration-150 hover:scale-110",
                "hover:bg-white/[0.06]",
              )}
              title={app.title}
            >
              <div className="flex size-[44px] items-center justify-center">
                <Icon className="size-6 text-zinc-300 group-hover:text-white transition-colors" />
              </div>
              {/* Running indicator dot */}
              {isRunning && (
                <span className="absolute -bottom-0.5 size-1 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
