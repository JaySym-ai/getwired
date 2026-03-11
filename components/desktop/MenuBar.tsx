"use client";

import { useState, useEffect, useMemo } from "react";
import { Wifi, BatteryFull, Bell, Search, Sun, Moon } from "lucide-react";
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


export function MenuBar() {
  const { user } = useDemoAuth();
  const time = useCurrentTime();
  const { state, openWindow } = useWindowManager();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("getwired-theme");
      return stored ? stored === "dark" : true;
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("getwired-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

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

      </div>

      {/* Right: System tray */}
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="flex items-center">
          {isDark ? (
            <Moon className="size-3.5 text-zinc-400 hover:text-zinc-200" />
          ) : (
            <Sun className="size-3.5 text-zinc-400 hover:text-zinc-200" />
          )}
        </button>
        <Wifi className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        <BatteryFull className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        <button onClick={() => openWindow("notifications")} className="relative flex items-center">
          <Bell className="size-3.5 text-zinc-400 hover:text-zinc-200" />
          <span className="absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">3</span>
        </button>
        <button onClick={() => openWindow("search")} className="flex items-center">
          <Search className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        </button>
        <span className="text-xs text-zinc-400">{time}</span>
        {user && (
          <button onClick={() => openWindow("profile")} className="flex items-center">
            <UserAvatar
              src={user.avatarUrl}
              name={user.displayName}
              size="sm"
            />
          </button>
        )}
      </div>
    </div>
  );
}
