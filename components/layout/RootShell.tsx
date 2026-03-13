"use client";

import { usePathname } from "next/navigation";
import { Desktop } from "@/components/desktop/Desktop";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    !pathname ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname !== "/"
  ) {
    return children;
  }

  return <Desktop />;
}
