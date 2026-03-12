"use client";

import Link from "next/link";
import {
  Home,
  MessageSquare,
  Newspaper,
  MessagesSquare,
  Compass,
  Search,
  Menu,
  LogOut,
  User,
  Bookmark,
  Settings,
} from "lucide-react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/shared/Avatar";
import { useAppAuth } from "@/lib/auth";
import { APP_ENV } from "@/lib/env";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/forums", label: "Forums", icon: MessageSquare },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/discover", label: "Discover", icon: Compass },
];

export function Navbar() {
  const { user, isSignedIn, signIn, signOut } = useAppAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/50 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="text-foreground">GetWired</span>
          <span className="text-[#3B82F6] text-glow">.dev</span>
          <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
            {APP_ENV}
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" render={<Link href="/search" />}>
            <Search className="size-4" />
          </Button>

          <NotificationBell />

          {isSignedIn && user ? (
            <UserMenu user={user} onSignOut={signOut} />
          ) : (
            <Button size="sm" onClick={signIn} className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80">
              Sign In
            </Button>
          )}

          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

function UserMenu({
  user,
  onSignOut,
}: {
  user: { displayName: string; username: string; avatarUrl: string };
  onSignOut: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden cursor-pointer rounded-full outline-none md:block">
        <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 border border-border bg-card">
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/profile/${user.username}`}>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <User className="size-4" /> View Profile
          </DropdownMenuItem>
        </Link>
        <Link href="/bookmarks">
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Bookmark className="size-4" /> Bookmarks
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer text-red-400" onClick={() => void onSignOut()}>
          <LogOut className="size-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-border bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1 text-lg font-bold">
            <span className="text-foreground">GetWired</span>
            <span className="text-[#3B82F6]">.dev</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
