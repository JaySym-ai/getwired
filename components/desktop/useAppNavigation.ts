"use client";

import { useCallback } from "react";
import { useWindowManager } from "./useWindowManager";

/**
 * Hook for navigating between apps inside the desktop window system.
 * Use this instead of Next.js <Link> for internal navigation between apps.
 */
export function useAppNavigation() {
  const { openWindow } = useWindowManager();

  const navigateToApp = useCallback(
    (appId: string, title?: string) => {
      openWindow(appId, title);
    },
    [openWindow],
  );

  return { navigateToApp };
}

