"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Home,
  MessageSquare,
  Newspaper,
  MessagesSquare,
  Compass,
  Search,
  Bell,
  Menu,
  LogOut,
  User,
  Bookmark,
  Settings,
  Users,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { useDemoAuth, DEMO_USERS } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/forums", label: "Forums", icon: MessageSquare },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/discover", label: "Discover", icon: Compass },
];

export function Navbar() {
  const { user, isSignedIn, signIn, signOut, switchUser } = useDemoAuth();
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-green-500/20 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 text-lg font-bold tracking-tight">
            <span className="text-white">GetWired</span>
            <span className="text-[#00FF41] text-glow">.dev</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
              <Search className="size-4" />
            </Button>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#00FF41] text-[9px] font-bold text-black">
                3
              </span>
            </Button>

            {isSignedIn && user ? (
              <UserMenu
                user={user}
                onSignOut={signOut}
                onSwitchUser={() => setSwitchDialogOpen(true)}
              />
            ) : (
              <Button size="sm" onClick={() => signIn()} className="bg-[#00FF41] text-black hover:bg-[#00FF41]/80">
                Sign In
              </Button>
            )}

            {/* Mobile hamburger */}
            <MobileMenu />
          </div>
        </div>
      </nav>

      {/* Switch User Dialog */}
      <SwitchUserDialog
        open={switchDialogOpen}
        onOpenChange={setSwitchDialogOpen}
        currentUserId={user?.id}
        onSelect={(id) => {
          switchUser(id);
          setSwitchDialogOpen(false);
        }}
      />
    </>
  );
}

function UserMenu({
  user,
  onSignOut,
  onSwitchUser,
}: {
  user: { displayName: string; username: string; avatarUrl: string; rank: string };
  onSignOut: () => void;
  onSwitchUser: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden cursor-pointer rounded-full outline-none md:block">
        <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-[#111] border border-green-500/20">
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <User className="size-4" /> View Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Bookmark className="size-4" /> Bookmarks
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onSwitchUser}>
          <Users className="size-4" /> Switch User
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer text-red-400" onClick={onSignOut}>
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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-green-500/20 bg-[#0A0A0A]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1 text-lg font-bold">
            <span className="text-white">GetWired</span>
            <span className="text-[#00FF41]">.dev</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
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

function SwitchUserDialog({
  open,
  onOpenChange,
  currentUserId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  onSelect: (userId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-green-500/20 bg-[#111]">
        <DialogHeader>
          <DialogTitle className="text-white">Switch Demo User</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelect(u.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5",
                currentUserId === u.id && "bg-[#00FF41]/10 border border-[#00FF41]/30"
              )}
            >
              <UserAvatar src={u.avatarUrl} name={u.displayName} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{u.displayName}</span>
                <span className="text-xs text-muted-foreground">@{u.username}</span>
              </div>
              <RankBadge rank={u.rank} className="ml-auto" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

