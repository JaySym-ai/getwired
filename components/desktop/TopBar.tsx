"use client";

import { useState, useEffect } from "react";
import { Wifi, Battery, Volume2 } from "lucide-react";

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function TopBar() {
  const time = useClock();

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex h-7 items-center justify-between bg-black/60 backdrop-blur-xl px-4 select-none border-b border-white/[0.06]">
      {/* Left: App name */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-white/90">GetWired</span>
      </div>

      {/* Right: Status icons + clock */}
      <div className="flex items-center gap-3 text-white/70">
        <Volume2 className="size-3.5" />
        <Wifi className="size-3.5" />
        <Battery className="size-3.5" />
        <span className="text-xs font-medium tabular-nums">{time}</span>
      </div>
    </div>
  );
}
