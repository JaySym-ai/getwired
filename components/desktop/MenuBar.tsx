"use client";

import { useState, useEffect, useMemo } from "react";
import { Wifi, BatteryFull, Bell, Search } from "lucide-react";
import { useDemoAuth } from "@/lib/demo-auth";
import { UserAvatar } from "@/components/shared/Avatar";
import { useWindowManager } from "./useWindowManager";

function useCurrentTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "short" });
      const clock = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setTime(`${day}  ${clock}`);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

const MENU_ITEMS = ["File", "Edit", "View", "Window", "Help"] as const;

export function MenuBar() {
  const { user } = useDemoAuth();
  const time = useCurrentTime();
  const { state, openWindow } = useWindowManager();

  // Determine the focused window's app name
  const focusedAppName = useMemo(() => {
    const visible = state.windows.filter((w) => !w.isMinimized);
    if (visible.length === 0) return "GetWired";
    const top = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
    return top.title;
  }, [state.windows]);

  return (
    <div
      className="absolute inset-x-0 top-0 z-[9998] flex h-7 items-center justify-between border-b border-white/[0.06] bg-zinc-950/80 px-4 backdrop-blur-xl"
      style={{ height: 28 }}
    >
      {/* Left: App menu items */}
      <div className="flex items-center gap-0.5">
        <button className="rounded px-2 py-0.5 text-[13px] font-semibold text-white hover:bg-white/[0.08]">
          {focusedAppName}
        </button>
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            className="rounded px-2 py-0.5 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.08]"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right: System tray */}
      <div className="flex items-center gap-3">
        <Wifi className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        <BatteryFull className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        <button onClick={() => openWindow("notifications")} className="flex items-center">
          <Bell className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        </button>
        <button onClick={() => openWindow("search")} className="flex items-center">
          <Search className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        </button>
        <span className="text-xs text-zinc-400">{time}</span>
        {user && (
          <UserAvatar
            src={user.avatarUrl}
            name={user.displayName}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
