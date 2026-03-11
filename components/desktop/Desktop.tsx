"use client";

import { useWindowManager } from "./useWindowManager";
import { AppWindow } from "./AppWindow";
import { AppContent } from "./AppContent";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";

export function Desktop() {
  const { state } = useWindowManager();

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Top menu bar */}
      <MenuBar />

      {/* Desktop area where windows live */}
      <div className="absolute inset-0 top-7 bottom-0">
        {state.windows.map((win) => (
          <AppWindow key={win.id} windowState={win}>
            <AppContent appId={win.appId} title={win.title} />
          </AppWindow>
        ))}
      </div>

      {/* Bottom dock */}
      <Dock />
    </div>
  );
}
