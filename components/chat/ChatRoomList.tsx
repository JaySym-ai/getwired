"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Hash,
  Lock,
  MessageCircle,
  Brain,
  Globe,
  Smartphone,
  Cpu,
  ShieldCheck,
  Rocket,
  TrendingUp,
  Coffee,
} from "lucide-react";
import { DEMO_CHAT_ROOMS, DEMO_CHAT_MESSAGES, DEMO_USERS } from "@/lib/demo-data";
import { DEMO_USERS as AUTH_USERS } from "@/lib/demo-auth";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "ai-ml": Brain,
  "web-dev": Globe,
  mobile: Smartphone,
  hardware: Cpu,
  cybersecurity: ShieldCheck,
  startups: Rocket,
  career: TrendingUp,
  "off-topic": Coffee,
};

function getLastMessage(roomIndex: number): string | null {
  const msgs = DEMO_CHAT_MESSAGES.filter((m) => m.roomIndex === roomIndex);
  if (msgs.length === 0) return null;
  const last = msgs[msgs.length - 1]!;
  const author = DEMO_USERS[last.authorIndex % DEMO_USERS.length];
  const name = author?.username ?? "unknown";
  const preview = last.content.length > 40 ? last.content.slice(0, 40) + "…" : last.content;
  return `${name}: ${preview}`;
}

function getUnreadCount(roomIndex: number): number {
  // Fake unread counts for demo
  const counts = [3, 7, 0, 1, 5, 2, 0, 4, 1, 0];
  return counts[roomIndex] ?? 0;
}

interface ChatRoomListProps {
  activeRoomIndex: number | null;
  onSelectRoom: (index: number) => void;
}

export function ChatRoomList({ activeRoomIndex, onSelectRoom }: ChatRoomListProps) {
  const [search, setSearch] = useState("");

  const publicRooms = useMemo(
    () => DEMO_CHAT_ROOMS.map((r, i) => ({ ...r, index: i })).filter((r) => r.type === "public"),
    []
  );
  const privateRooms = useMemo(
    () => DEMO_CHAT_ROOMS.map((r, i) => ({ ...r, index: i })).filter((r) => r.type === "private"),
    []
  );

  // DM rooms from auth users
  const dmRooms = useMemo(
    () =>
      AUTH_USERS.slice(1, 4).map((u, i) => ({
        name: u.displayName,
        index: DEMO_CHAT_ROOMS.length + i,
        username: u.username,
        avatarUrl: u.avatarUrl,
      })),
    []
  );

  const filterFn = (name: string) =>
    !search || name.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        <Button variant="ghost" size="icon" className="size-7">
          <Plus className="size-4 text-[#00FF41]" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="h-8 pl-8 text-xs bg-secondary/30 border-border/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-2 py-1">
          {/* Public Rooms */}
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Public Rooms
          </p>
          {publicRooms.filter((r) => filterFn(r.name)).map((room) => {
            const Icon = (room.categorySlug && CATEGORY_ICONS[room.categorySlug]) || Hash;
            const unread = getUnreadCount(room.index);
            const lastMsg = getLastMessage(room.index);
            return (
              <RoomItem
                key={room.index}
                icon={<Icon className="size-4" />}
                name={room.name}
                preview={lastMsg}
                unread={unread}
                active={activeRoomIndex === room.index}
                onClick={() => onSelectRoom(room.index)}
              />
            );
          })}

          {/* Private Groups */}
          <p className="mt-3 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Private Groups
          </p>
          {privateRooms.filter((r) => filterFn(r.name)).map((room) => {
            const unread = getUnreadCount(room.index);
            const lastMsg = getLastMessage(room.index);
            return (
              <RoomItem
                key={room.index}
                icon={<Lock className="size-4" />}
                name={room.name}
                preview={lastMsg}
                unread={unread}
                active={activeRoomIndex === room.index}
                onClick={() => onSelectRoom(room.index)}
              />
            );
          })}

          {/* Direct Messages */}
          <p className="mt-3 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Direct Messages
          </p>
          {dmRooms.filter((r) => filterFn(r.name)).map((dm) => (
            <RoomItem
              key={dm.index}
              icon={<MessageCircle className="size-4" />}
              name={dm.name}
              preview={`@${dm.username}`}
              unread={0}
              active={activeRoomIndex === dm.index}
              onClick={() => onSelectRoom(dm.index)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface RoomItemProps {
  icon: React.ReactNode;
  name: string;
  preview: string | null;
  unread: number;
  active: boolean;
  onClick: () => void;
}

function RoomItem({ icon, name, preview, unread, active, onClick }: RoomItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
        active
          ? "bg-[#00FF41]/10 border border-[#00FF41]/30"
          : "hover:bg-secondary/50 border border-transparent"
      )}
    >
      <span className={cn("shrink-0", active ? "text-[#00FF41]" : "text-muted-foreground")}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", active ? "text-[#00FF41]" : "text-foreground")}>
          {name}
        </p>
        {preview && (
          <p className="text-[11px] text-muted-foreground truncate">{preview}</p>
        )}
      </div>
      {unread > 0 && (
        <Badge className="shrink-0 bg-[#00FF41] text-black text-[10px] px-1.5 py-0 min-w-[18px] flex items-center justify-center">
          {unread}
        </Badge>
      )}
    </button>
  );
}
