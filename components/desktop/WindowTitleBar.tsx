"use client";

import { useState } from "react";
import {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  Rocket, User, Bookmark, Bell, Search, Shield, Mail,
  X, Minus, Maximize2, RotateCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  Rocket, User, Bookmark, Bell, Search, Shield, Mail,
};

interface WindowTitleBarProps {
  title: string;
  icon: string;
  isFocused: boolean;
  isMaximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onRefresh?: () => void;
}

export function WindowTitleBar({
  title,
  icon,
  isFocused,
  isMaximized,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onRefresh,
}: WindowTitleBarProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const Icon = ICON_MAP[icon] ?? Search;

  return (
    <div
      className={cn(
        "window-drag-handle flex h-10 items-center justify-between rounded-t-xl border-b px-1.5 pr-3 select-none",
        "border-white/[0.06]",
        isFocused ? "bg-zinc-800/80" : "bg-zinc-800/50",
      )}
      onDoubleClick={() => {
        if (isMaximized) {
          onRestore();
          return;
        }

        onMaximize();
      }}
    >
      {/* Window controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-all duration-150",
            isFocused
              ? "text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
              : "text-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-400",
          )}
          aria-label="Close"
        >
          <X className="size-3.5 stroke-[2]" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-all duration-150",
            isFocused
              ? "text-zinc-400 hover:bg-zinc-500/20 hover:text-zinc-300"
              : "text-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-400",
          )}
          aria-label="Minimize"
        >
          <Minus className="size-3.5 stroke-[2]" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); isMaximized ? onRestore() : onMaximize(); }}
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-all duration-150",
            isFocused
              ? "text-zinc-400 hover:bg-blue-500/20 hover:text-blue-400"
              : "text-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-400",
          )}
          aria-label="Maximize"
        >
          <Maximize2 className="size-3 stroke-[2]" />
        </button>
      </div>

      {/* Center: icon + title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
          {title}
        </span>
      </div>

      {/* Right side: refresh button */}
      <div className="flex w-14 items-center justify-end">
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSpinning(true);
              onRefresh();
              setTimeout(() => setIsSpinning(false), 500);
            }}
            className="flex items-center justify-center p-1"
            aria-label="Refresh"
          >
            <RotateCw
              className={cn(
                "size-3.5 text-muted-foreground hover:text-foreground transition-colors",
                isSpinning && "animate-spin",
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}
