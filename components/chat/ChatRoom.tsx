"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, Users, FileText } from "lucide-react";
import { MessageBubble, type ChatReaction } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { ThreadView } from "./ThreadView";
import { api } from "../../convex/_generated/api";

interface ChatRoomProps {
  roomId: string;
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const room = useQuery(api.chat.getRoomById, { roomId: roomId as never });
  const messages = useQuery(api.chat.getMessages, { roomId: roomId as never, limit: 100 }) ?? [];
  const users = useQuery(api.users.list, {}) ?? [];
  const sendMessage = useMutation(api.chat.sendMessage);
  const toggleReaction = useMutation(api.chat.toggleReaction);

  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const threadReplies = useQuery(
    api.chat.getThreadMessages,
    threadMessageId ? { threadId: threadMessageId as never } : "skip",
  ) ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const parentMessage = useMemo(
    () => messages.find((message) => message._id === threadMessageId) ?? null,
    [messages, threadMessageId],
  );

  if (room === undefined) {
    return null;
  }

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Room not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="glass-strong flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{room.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{room.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={{
                id: message._id,
                author: {
                  id: message.author.clerkId,
                  avatarUrl: message.author.avatar,
                  displayName: message.author.name,
                  rank: message.author.rank,
                },
                content: message.content,
                reactions: message.reactions as ChatReaction[],
                threadCount: message.threadCount,
                createdAt: message.createdAt,
                isOwn: message.isOwn,
              }}
              onReact={(messageId, emoji) => void toggleReaction({ messageId: messageId as never, emoji })}
              onOpenThread={setThreadMessageId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <TypingIndicator />

      <MessageInput
        onSend={(content) => void sendMessage({ roomId: room._id, content })}
        mentionOptions={users.map((user) => ({
          _id: user._id,
          username: user.username,
          name: user.name,
        }))}
      />

      <ThreadView
        open={threadMessageId !== null}
        onClose={() => setThreadMessageId(null)}
        parentMessage={
          parentMessage
            ? {
                id: parentMessage._id,
                author: {
                  id: parentMessage.author.clerkId,
                  avatarUrl: parentMessage.author.avatar,
                  displayName: parentMessage.author.name,
                  rank: parentMessage.author.rank,
                },
                content: parentMessage.content,
                reactions: parentMessage.reactions as ChatReaction[],
                threadCount: parentMessage.threadCount,
                createdAt: parentMessage.createdAt,
                isOwn: parentMessage.isOwn,
              }
            : null
        }
        replies={threadReplies.map((reply) => ({
          id: reply._id,
          author: {
            id: reply.author.clerkId,
            avatarUrl: reply.author.avatar,
            displayName: reply.author.name,
            rank: reply.author.rank,
          },
          content: reply.content,
          reactions: reply.reactions as ChatReaction[],
          threadCount: reply.threadCount,
          createdAt: reply.createdAt,
          isOwn: reply.isOwn,
        }))}
        onSendReply={(content) =>
          threadMessageId
            ? void sendMessage({ roomId: room._id, content, threadId: threadMessageId as never })
            : undefined
        }
        onReact={(messageId, emoji) => void toggleReaction({ messageId: messageId as never, emoji })}
        mentionOptions={users.map((user) => ({
          _id: user._id,
          username: user.username,
          name: user.name,
        }))}
      />
    </div>
  );
}
