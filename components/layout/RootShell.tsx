"use client";

import { usePathname } from "next/navigation";
import { Desktop } from "@/components/desktop/Desktop";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return children;
  }

  return <Desktop />;
}
