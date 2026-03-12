"use client";

import { useEffect, useMemo, useState } from "react";
import { Wifi, BatteryFull, Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { useAppAuth } from "@/lib/auth";
import { APP_ENV } from "@/lib/env";
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
  const { user, signIn } = useAppAuth();
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

  const focusedAppName = useMemo(() => {
    const visible = state.windows.filter((windowState) => !windowState.isMinimized);
    if (visible.length === 0) {
      return "GetWired";
    }

    const top = visible.reduce((current, next) => (current.zIndex > next.zIndex ? current : next));
    return top.title;
  }, [state.windows]);

  return (
    <div
      className="absolute inset-x-0 top-0 z-[9998] flex h-7 items-center justify-between border-b border-white/[0.06] bg-zinc-950/80 px-4 backdrop-blur-xl"
      style={{ height: 28 }}
    >
      <div className="flex items-center gap-0.5">
        <button className="rounded px-2 py-0.5 text-[13px] font-semibold text-white hover:bg-white/[0.08]">
          {focusedAppName}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setIsDark((value) => !value)} className="flex items-center">
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
        </button>
        <button onClick={() => openWindow("search")} className="flex items-center">
          <Search className="size-3.5 text-zinc-400 hover:text-zinc-200" />
        </button>
        <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
          {APP_ENV}
        </span>
        <span className="text-xs text-zinc-400">{time}</span>
        {user ? (
          <button onClick={() => openWindow("profile")} className="flex items-center">
            <UserAvatar
              src={user.avatarUrl}
              name={user.displayName}
              size="sm"
            />
          </button>
        ) : (
          <Button
            size="xs"
            onClick={signIn}
            className="h-6 bg-[#3B82F6] px-2 text-[10px] font-semibold text-white hover:bg-[#2563EB]"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
