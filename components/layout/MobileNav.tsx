"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, MessagesSquare, Newspaper, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/forums", label: "Forums", icon: MessageSquare },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-green-500/20 bg-black/80 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors",
                isActive ? "text-[#00FF41]" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("size-5", isActive && "text-glow")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

