"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, Users, FileText } from "lucide-react";
import { DEMO_USERS, useDemoAuth } from "@/lib/demo-auth";
import { DEMO_CHAT_ROOMS, DEMO_CHAT_MESSAGES } from "@/lib/demo-data";
import { MessageBubble, type ChatMessageData, type ChatReaction } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { ThreadView } from "./ThreadView";

interface ChatRoomProps {
  roomIndex: number;
}

function buildMessages(roomIndex: number, currentUserId: string): ChatMessageData[] {
  return DEMO_CHAT_MESSAGES
    .filter((m) => m.roomIndex === roomIndex)
    .map((m, i) => {
      const author = DEMO_USERS[m.authorIndex % DEMO_USERS.length]!;
      const reactionMap = new Map<string, { count: number; reacted: boolean }>();
      for (const r of m.reactions) {
        const existing = reactionMap.get(r.emoji);
        if (existing) {
          existing.count++;
        } else {
          reactionMap.set(r.emoji, { count: 1, reacted: false });
        }
      }
      const reactions: ChatReaction[] = Array.from(reactionMap.entries()).map(
        ([emoji, data]) => ({ emoji, count: data.count, reacted: data.reacted })
      );
      return {
        id: `msg-${roomIndex}-${i}`,
        author,
        content: m.content,
        reactions,
        threadCount: i === 0 ? 2 : 0,
        createdAt: m.createdAt,
        isOwn: author.id === currentUserId,
      };
    });
}

export function ChatRoom({ roomIndex }: ChatRoomProps) {
  const { user } = useDemoAuth();
  const room = DEMO_CHAT_ROOMS[roomIndex];
  const currentUserId = user?.id ?? "user_001";

  const [messages, setMessages] = useState<ChatMessageData[]>(() =>
    buildMessages(roomIndex, currentUserId)
  );
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessageData[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset messages when room changes
  useEffect(() => {
    setMessages(buildMessages(roomIndex, currentUserId));
    setThreadMessageId(null);
  }, [roomIndex, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      if (!user) return;
      const newMsg: ChatMessageData = {
        id: `msg-${roomIndex}-${Date.now()}`,
        author: user,
        content,
        reactions: [],
        threadCount: 0,
        createdAt: Date.now(),
        isOwn: true,
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    [user, roomIndex]
  );

  const handleReact = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const idx = m.reactions.findIndex((r) => r.emoji === emoji);
        if (idx === -1) {
          return { ...m, reactions: [...m.reactions, { emoji, count: 1, reacted: true }] };
        }
        const r = m.reactions[idx]!;
        if (r.reacted) {
          if (r.count <= 1) {
            return { ...m, reactions: m.reactions.filter((_, i) => i !== idx) };
          }
          return { ...m, reactions: m.reactions.map((rx, i) => i === idx ? { ...rx, count: rx.count - 1, reacted: false } : rx) };
        }
        return { ...m, reactions: m.reactions.map((rx, i) => i === idx ? { ...rx, count: rx.count + 1, reacted: true } : rx) };
      })
    );
  }, []);

  const handleOpenThread = useCallback(
    (messageId: string) => {
      setThreadMessageId(messageId);
      // Generate some demo replies for the first message
      if (!user) return;
      const parent = messages.find((m) => m.id === messageId);
      if (parent && parent.threadCount > 0) {
        const demoReplies: ChatMessageData[] = [
          {
            id: `thread-${messageId}-1`,
            author: DEMO_USERS[1]!,
            content: "Great point! I've been thinking about this too.",
            reactions: [],
            threadCount: 0,
            createdAt: parent.createdAt + 300000,
            isOwn: false,
          },
          {
            id: `thread-${messageId}-2`,
            author: DEMO_USERS[3]!,
            content: "Agreed. We should discuss this more in the next meetup.",
            reactions: [],
            threadCount: 0,
            createdAt: parent.createdAt + 600000,
            isOwn: false,
          },
        ];
        setThreadReplies(demoReplies);
      } else {
        setThreadReplies([]);
      }
    },
    [messages, user]
  );

  const handleSendReply = useCallback(
    (content: string) => {
      if (!user) return;
      const reply: ChatMessageData = {
        id: `thread-reply-${Date.now()}`,
        author: user,
        content,
        reactions: [],
        threadCount: 0,
        createdAt: Date.now(),
        isOwn: true,
      };
      setThreadReplies((prev) => [...prev, reply]);
    },
    [user]
  );

  const parentMessage = useMemo(
    () => messages.find((m) => m.id === threadMessageId) ?? null,
    [messages, threadMessageId]
  );

  if (!room) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Room header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 glass-strong">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{room.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{room.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="size-8">
            <Users className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <FileText className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Settings className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>



      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="py-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onReact={handleReact}
              onOpenThread={handleOpenThread}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      <TypingIndicator />

      {/* Message input */}
      <MessageInput onSend={handleSend} />

      {/* Thread view */}
      <ThreadView
        open={threadMessageId !== null}
        onClose={() => setThreadMessageId(null)}
        parentMessage={parentMessage}
        replies={threadReplies}
        onSendReply={handleSendReply}
        onReact={handleReact}
      />
    </div>
  );
}