"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  Rocket, User, Bookmark, Bell, Search, Shield, Mail,
  ChevronLeft, ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWindowManager, APP_REGISTRY } from "./useWindowManager";

const ICON_MAP: Record<string, LucideIcon> = {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  Rocket, User, Bookmark, Bell, Search, Shield, Mail,
};

// Which apps to show in the sidebar (and in what order)
const DOCK_APP_IDS = [
  "feed", "forums", "chat", "news", "discover",
  "marketplace", "profile", "bookmarks", "notifications", "search",
];

export const SIDEBAR_WIDTH_EXPANDED = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 60;

const STORAGE_KEY = "getwired-sidebar-expanded";

export function Sidebar() {
  const { state, openWindow, focusWindow, restoreWindow } = useWindowManager();
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Read localStorage after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setExpanded(stored === "true");
    }
    setMounted(true);
  }, []);

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  // Determine the focused (topmost) window
  const focusedWindowId = useMemo(() => {
    if (state.windows.length === 0) return null;
    const maxZ = Math.max(...state.windows.map((w) => w.zIndex));
    return state.windows.find((w) => w.zIndex === maxZ)?.id ?? null;
  }, [state.windows]);

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

  const sidebarWidth = expanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-[9999] flex flex-col bg-zinc-950/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl transition-all duration-300 ease-in-out shadow-2xl"
      style={{ width: mounted ? sidebarWidth : SIDEBAR_WIDTH_EXPANDED }}
    >
      {/* Top: Logo */}
      <div className="flex items-center h-14 px-4 shrink-0">
        {expanded ? (
          <div className="flex items-baseline gap-0 select-none">
            <span className="text-lg font-black tracking-tight text-white">Get</span>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Wired</span>
            <span className="text-[10px] font-bold text-blue-400/70 ml-0.5 self-end mb-[3px]">.dev</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full select-none">
            <span className="text-base font-black bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">G</span>
          </div>
        )}
      </div>

      {/* Middle: App list (scrollable) */}
      <div className="overflow-y-auto overflow-x-hidden px-2 py-1 max-h-[60vh]">
        {DOCK_APP_IDS.map((appId) => {
          const app = APP_REGISTRY[appId];
          if (!app) return null;
          const Icon = ICON_MAP[app.icon] ?? Search;
          const runningWindow = state.windows.find((w) => w.appId === appId);
          const isRunning = !!runningWindow;
          const isFocused = runningWindow?.id === focusedWindowId;

          return (
            <button
              key={appId}
              onClick={() => handleClick(appId)}
              className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-150",
                expanded ? "gap-3 px-3 py-2" : "justify-center px-0 py-2",
                "hover:bg-white/[0.06]",
                isRunning && "border-l-2 border-blue-500",
                !isRunning && "border-l-2 border-transparent",
              )}
              title={app.title}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-colors",
                  isFocused
                    ? "text-white"
                    : isRunning
                      ? "text-zinc-300"
                      : "text-zinc-500 group-hover:text-zinc-300",
                )}
              />
              {expanded && (
                <span
                  className={cn(
                    "text-sm font-semibold truncate transition-colors",
                    isFocused
                      ? "text-white"
                      : isRunning
                        ? "text-zinc-300"
                        : "text-zinc-500 group-hover:text-zinc-300",
                  )}
                >
                  {app.title}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Toggle button */}
      <div className="shrink-0 px-2 py-2">
        <button
          onClick={toggleExpanded}
          className={cn(
            "flex items-center w-full rounded-lg py-2 transition-colors duration-150 hover:bg-white/[0.06]",
            expanded ? "px-3 gap-3" : "justify-center",
          )}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <>
              <ChevronLeft className="size-5 text-zinc-500" />
              <span className="text-sm text-zinc-500">Collapse</span>
            </>
          ) : (
            <ChevronRight className="size-5 text-zinc-500" />
          )}
        </button>
      </div>
    </div>
  );
}
