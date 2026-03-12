"use client";

import { useState } from "react";
import { ChatRoomList } from "@/components/chat/ChatRoomList";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatRoomPageClientProps {
  roomId: string;
}

export function ChatRoomPageClient({ roomId }: ChatRoomPageClientProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectRoom = (nextRoomId: string) => {
    router.push(`/chat/${nextRoomId}`);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="hidden w-[300px] shrink-0 md:block">
        <ChatRoomList activeRoomId={roomId} onSelectRoom={handleSelectRoom} />
      </div>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="fixed left-3 top-[4.25rem] z-30 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-lg transition-colors hover:bg-muted hover:text-foreground">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0" showCloseButton={false}>
            <ChatRoomList activeRoomId={roomId} onSelectRoom={handleSelectRoom} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="min-w-0 flex-1">
        <ChatRoom roomId={roomId} />
      </div>
    </div>
  );
}
