"use client";

import { useCallback, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import type { RndDragEvent, DraggableData } from "react-rnd";
import { cn } from "@/lib/utils";
import { useWindowManager } from "./useWindowManager";
import { WindowTitleBar } from "./WindowTitleBar";
import type { WindowState } from "./types";

interface AppWindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

// Desktop area insets — windows live inside a container that's already
// below the MenuBar and beside the sidebar, so no insets needed.
const DESKTOP_INSET = { top: 0, bottom: 0 };

export function AppWindow({ windowState, children }: AppWindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    state,
  } = useWindowManager();

  const { id, title, icon, position, size, zIndex, isMinimized, isMaximized } = windowState;

  const [refreshKey, setRefreshKey] = useState(0);
  const onRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Determine if this window is the topmost (focused)
  const isFocused = useMemo(() => {
    const maxZ = Math.max(...state.windows.map((w) => w.zIndex));
    return zIndex === maxZ;
  }, [state.windows, zIndex]);

  const handleDragStop = useCallback(
    (_e: RndDragEvent, data: DraggableData) => {
      updateWindowPosition(id, { x: data.x, y: data.y });
    },
    [id, updateWindowPosition],
  );

  const handleResizeStop = useCallback(
    (
      _e: MouseEvent | TouchEvent,
      _direction: unknown,
      ref: HTMLElement,
      _delta: { width: number; height: number },
      pos: { x: number; y: number },
    ) => {
      updateWindowSize(id, {
        width: parseInt(ref.style.width, 10),
        height: parseInt(ref.style.height, 10),
      });
      updateWindowPosition(id, { x: pos.x, y: pos.y });
    },
    [id, updateWindowSize, updateWindowPosition],
  );

  const handleMouseDown = useCallback(() => {
    focusWindow(id);
  }, [id, focusWindow]);

  // When maximized, fill the desktop area with a small margin (macOS-style)
  const MAXIMIZE_PADDING = 8; // px gap around the maximized window
  const rndPosition = isMaximized
    ? { x: MAXIMIZE_PADDING, y: DESKTOP_INSET.top + MAXIMIZE_PADDING }
    : position;
  const rndSize = isMaximized
    ? {
        width: `calc(100% - ${MAXIMIZE_PADDING * 2}px)`,
        height: `calc(100% - ${DESKTOP_INSET.top + DESKTOP_INSET.bottom + MAXIMIZE_PADDING * 2}px)`,
      }
    : size;

  return (
    <Rnd
      position={rndPosition}
      size={rndSize}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      dragHandleClassName="window-drag-handle"
      minWidth={320}
      minHeight={200}
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{
        zIndex,
        display: isMinimized ? "none" : undefined,
        transition: isMaximized ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
      }}
      onMouseDown={handleMouseDown}
      bounds="parent"
    >
      <div
        className={cn(
          "flex h-full flex-col rounded-xl border overflow-hidden",
          "border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl",
          "transition-shadow duration-200",
          isFocused ? "shadow-2xl" : "shadow-lg",
        )}
      >
        <WindowTitleBar
          title={title}
          icon={icon}
          isFocused={isFocused}
          isMaximized={isMaximized}
          onClose={() => closeWindow(id)}
          onMinimize={() => minimizeWindow(id)}
          onMaximize={() => maximizeWindow(id)}
          onRestore={() => restoreWindow(id)}
          onRefresh={onRefresh}
        />
        <div className="flex-1 overflow-auto" key={refreshKey}>
          {children}
        </div>
      </div>
    </Rnd>
  );
}
