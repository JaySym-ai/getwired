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
import { Menu, MessageSquare } from "lucide-react";
import { DEMO_CHAT_ROOMS } from "@/lib/demo-data";

export function ChatPageClient() {
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectRoom = (index: number) => {
    setActiveRoom(index);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-[300px] shrink-0">
        <ChatRoomList activeRoomIndex={activeRoom} onSelectRoom={handleSelectRoom} />
      </div>

      {/* Mobile sidebar as Sheet */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="fixed left-3 top-[4.25rem] z-30 inline-flex items-center justify-center size-9 rounded-lg bg-card border border-border shadow-lg text-muted-foreground hover:text-white hover:bg-muted transition-colors cursor-pointer">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px]" showCloseButton={false}>
            <ChatRoomList activeRoomIndex={activeRoom} onSelectRoom={handleSelectRoom} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        {activeRoom !== null && activeRoom < DEMO_CHAT_ROOMS.length ? (
          <ChatRoom roomIndex={activeRoom} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#00FF41]/10 border border-[#00FF41]/20">
              <MessageSquare className="size-8 text-[#00FF41]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select a room</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Choose a chat room from the sidebar to start chatting with the community.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

