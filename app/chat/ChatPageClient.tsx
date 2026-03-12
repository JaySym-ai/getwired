"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChatRoomList } from "@/components/chat/ChatRoomList";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageSquare } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function ChatPageClient() {
  const rooms = useQuery(api.chat.listRooms, {}) ?? [];
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedRoomId = activeRoomId ?? rooms[0]?._id ?? null;

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-full md:h-full">
      <div className="hidden w-[300px] shrink-0 md:block">
        <ChatRoomList activeRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} />
      </div>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="fixed left-3 top-[4.25rem] z-30 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-lg transition-colors hover:bg-muted hover:text-foreground">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0" showCloseButton={false}>
            <ChatRoomList activeRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="min-w-0 flex-1">
        {selectedRoomId ? (
          <ChatRoom key={selectedRoomId} roomId={selectedRoomId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10">
              <MessageSquare className="size-8 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select a room</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a chat room from the sidebar to start chatting with the community.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
