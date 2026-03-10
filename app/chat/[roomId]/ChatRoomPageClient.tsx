"use client";

import { useState } from "react";
import { ChatRoomList } from "@/components/chat/ChatRoomList";
import { ChatRoom } from "@/components/chat/ChatRoom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { DEMO_CHAT_ROOMS } from "@/lib/demo-data";

interface ChatRoomPageClientProps {
  roomIndex: number;
}

export function ChatRoomPageClient({ roomIndex }: ChatRoomPageClientProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectRoom = (index: number) => {
    router.push(`/chat/${index}`);
    setMobileOpen(false);
  };

  const validIndex = roomIndex >= 0 && roomIndex < DEMO_CHAT_ROOMS.length;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-[300px] shrink-0">
        <ChatRoomList activeRoomIndex={validIndex ? roomIndex : null} onSelectRoom={handleSelectRoom} />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="fixed left-3 top-[4.25rem] z-30 inline-flex items-center justify-center size-9 rounded-lg bg-card border border-border shadow-lg text-muted-foreground hover:text-white hover:bg-muted transition-colors cursor-pointer">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px]" showCloseButton={false}>
            <ChatRoomList activeRoomIndex={validIndex ? roomIndex : null} onSelectRoom={handleSelectRoom} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        {validIndex ? (
          <ChatRoom roomIndex={roomIndex} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Room not found</p>
          </div>
        )}
      </div>
    </div>
  );
}

