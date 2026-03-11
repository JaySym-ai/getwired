"use client";

import { useCallback, useState } from "react";
import {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  ShoppingBag, User, Bookmark, Bell, Search, Shield, Mail,
  X, Minus, Maximize2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Rss, MessageSquare, MessagesSquare, Newspaper, Compass,
  ShoppingBag, User, Bookmark, Bell, Search, Shield, Mail,
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
}: WindowTitleBarProps) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICON_MAP[icon] ?? Search;

  const handleDoubleClick = useCallback(() => {
    if (isMaximized) {
      onRestore();
    } else {
      onMaximize();
    }
  }, [isMaximized, onMaximize, onRestore]);

  return (
    <div
      className={cn(
        "window-drag-handle flex h-10 items-center justify-between rounded-t-xl border-b px-3 select-none",
        "border-white/[0.06]",
        isFocused ? "bg-zinc-800/80" : "bg-zinc-800/50",
      )}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Traffic light buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={cn(
            "flex size-3 items-center justify-center rounded-full transition-colors",
            isFocused ? "bg-[#FF5F57]" : "bg-zinc-600",
          )}
          aria-label="Close"
        >
          {hovered && <X className="size-2 text-black/60 stroke-[3]" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          className={cn(
            "flex size-3 items-center justify-center rounded-full transition-colors",
            isFocused ? "bg-[#FEBC2E]" : "bg-zinc-600",
          )}
          aria-label="Minimize"
        >
          {hovered && <Minus className="size-2 text-black/60 stroke-[3]" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); isMaximized ? onRestore() : onMaximize(); }}
          className={cn(
            "flex size-3 items-center justify-center rounded-full transition-colors",
            isFocused ? "bg-[#28C840]" : "bg-zinc-600",
          )}
          aria-label="Maximize"
        >
          {hovered && <Maximize2 className="size-1.5 text-black/60 stroke-[3]" />}
        </button>
      </div>

      {/* Center: icon + title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
          {title}
        </span>
      </div>

      {/* Right side: empty for now */}
      <div className="w-14" />
    </div>
  );
}

