"use client";

import { useState, useEffect } from "react";
import { useDemoAuth } from "@/lib/demo-auth";
import { UserAvatar } from "@/components/shared/Avatar";

function useCurrentTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );
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

  return (
    <div
      className="fixed inset-x-0 top-0 z-[9999] flex h-7 items-center justify-between border-b border-white/[0.06] bg-zinc-950/80 px-4 backdrop-blur-xl"
      style={{ height: 28 }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-1 text-sm font-semibold leading-none">
        <span className="text-white">GetWired</span>
        <span className="text-[#3B82F6]">.dev</span>
      </div>

      {/* Right: Time + Avatar */}
      <div className="flex items-center gap-3">
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

