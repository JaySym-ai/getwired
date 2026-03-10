"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, type ChatMessageData } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface ThreadViewProps {
  open: boolean;
  onClose: () => void;
  parentMessage: ChatMessageData | null;
  replies: ChatMessageData[];
  onSendReply: (content: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export function ThreadView({
  open,
  onClose,
  parentMessage,
  replies,
  onSendReply,
  onReact,
}: ThreadViewProps) {
  if (!parentMessage) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md w-full">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold">Thread</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          {/* Parent message */}
          <div className="border-b border-border pb-2">
            <MessageBubble
              message={parentMessage}
              onReact={onReact}
              onOpenThread={() => {}}
            />
          </div>

          {/* Replies */}
          <div className="py-2">
            {replies.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No replies yet. Start the conversation!
              </p>
            ) : (
              replies.map((reply) => (
                <MessageBubble
                  key={reply.id}
                  message={reply}
                  onReact={onReact}
                  onOpenThread={() => {}}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <MessageInput onSend={onSendReply} />
      </SheetContent>
    </Sheet>
  );
}

